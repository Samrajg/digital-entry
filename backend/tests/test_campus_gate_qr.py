import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.models.user import User

# Use a local SQLite file to persist tables across session connections
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate the schema in the test database
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply the dependency override to the app
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    engine.dispose()
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass

def test_create_campus_unauthorized():
    # Attempting to create a campus without auth headers (401)
    response = client.post(
        "/api/campuses",
        json={"name": "Alpha Campus", "code": "ALPHA", "address": "123 St", "city": "NYC"}
    )
    assert response.status_code == 401

    # Attempting with non-admin role (403)
    response = client.post(
        "/api/campuses",
        json={"name": "Alpha Campus", "code": "ALPHA", "address": "123 St", "city": "NYC"},
        headers={"X-User-Id": "2"} # User ID 2 is security role
    )
    assert response.status_code == 403

def test_create_campus_success():
    # Admin creates campus successfully
    response = client.post(
        "/api/campuses",
        json={"name": "Alpha Campus", "code": "ALPHA", "address": "123 St", "city": "NYC"},
        headers={"X-User-Id": "1"} # User ID 1 is admin
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alpha Campus"
    assert data["code"] == "ALPHA"
    assert data["is_active"] is True
    assert "campus_id" in data

def test_create_campus_duplicate_code():
    # Attempt to create duplicate code
    response = client.post(
        "/api/campuses",
        json={"name": "Alpha Second", "code": "ALPHA", "address": "456 Rd", "city": "NYC"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_get_campuses():
    # Read-only user (security) gets campuses
    response = client.get("/api/campuses", headers={"X-User-Id": "2"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["code"] == "ALPHA"

def test_get_campus_details():
    # Fetch campus details with gates
    response = client.get("/api/campuses/1", headers={"X-User-Id": "2"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alpha Campus"
    assert "gates" in data
    assert len(data["gates"]) == 0

def test_update_campus():
    # Admin updates campus details
    response = client.put(
        "/api/campuses/1",
        json={"name": "Alpha Modified", "code": "ALPHAv2", "address": "New Addr", "city": "Boston"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alpha Modified"
    assert data["code"] == "ALPHAV2" # uppercase conversion

def test_create_gate_success():
    # Admin creates a gate under campus 1
    response = client.post(
        "/api/campuses/1/gates",
        json={"name": "Main Entrance", "code": "MAIN-GATE", "description": "Front gate", "location": "North wing"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Main Entrance"
    assert data["code"] == "MAIN-GATE"
    assert data["campus_id"] == 1
    assert data["is_active"] is True

def test_create_gate_duplicate_code():
    # Try to create gate with duplicate code
    response = client.post(
        "/api/campuses/1/gates",
        json={"name": "Main Copy", "code": "MAIN-GATE", "description": "Duplicate gate"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 409

def test_get_gate_details():
    # Fetch gate details with campus information and QR codes list
    response = client.get("/api/gates/1", headers={"X-User-Id": "2"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Main Entrance"
    assert data["campus_name"] == "Alpha Modified"
    assert "qr_codes" in data
    assert len(data["qr_codes"]) == 0

def test_create_qr_code_success():
    # Admin creates a QR code under gate 1
    response = client.post(
        "/api/gates/1/qr-codes",
        json={"name": "Primary Entry QR"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Primary Entry QR"
    assert data["gate_name"] == "Main Entrance"
    assert data["campus_name"] == "Alpha Modified"
    assert data["code"] == "QR-ALPHAV2-MAIN-GATE"
    assert data["destination_url"] == "/entry/QR-ALPHAV2-MAIN-GATE"
    assert data["qr_image_base64"] is not None
    assert len(data["qr_image_base64"]) > 0

def test_parent_deactivation_rules():
    # Deactivate the campus
    response = client.patch(
        "/api/campuses/1/status",
        json={"is_active": False},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Rule 3: Try to create a gate under deactivated campus (should fail)
    response = client.post(
        "/api/campuses/1/gates",
        json={"name": "South Gate", "code": "SOUTH-GATE"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 400

    # Rule 3: Try to create QR under a gate belonging to deactivated campus (should fail)
    response = client.post(
        "/api/gates/1/qr-codes",
        json={"name": "Backup QR"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 400

    # Activate campus, deactivate gate
    client.patch("/api/campuses/1/status", json={"is_active": True}, headers={"X-User-Id": "1"})
    client.patch("/api/gates/1/status", json={"is_active": False}, headers={"X-User-Id": "1"})

    # Rule 4: Try to create QR code under deactivated gate (should fail)
    response = client.post(
        "/api/gates/1/qr-codes",
        json={"name": "Backup QR"},
        headers={"X-User-Id": "1"}
    )
    assert response.status_code == 400
