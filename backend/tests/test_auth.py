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

@pytest.fixture(autouse=True)
def setup_test_users():
    # Setup fresh users for every single test run
    db = TestingSessionLocal()
    db.query(User).delete()
    db.commit()

    test_users = [
        User(username="admin_user", user_pin="1111", user_role="admin"),
        User(username="security_user", user_pin="2222", user_role="security"),
        User(username="supervisor_user", user_pin="3333", user_role="supervisor"),
        User(username="manager_user", user_pin="4444", user_role="manager"),
    ]
    
    for u in test_users:
        db.add(u)
    db.commit()
    db.close()

def test_login_valid_admin():
    response = client.post(
        "/api/auth/login", 
        json={"username": "admin_user", "user_pin": "1111"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Login successful"
    assert data["user"]["username"] == "admin_user"
    assert data["user"]["user_role"] == "admin"

def test_login_valid_security():
    response = client.post(
        "/api/auth/login", 
        json={"username": "security_user", "user_pin": "2222"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "security_user"
    assert data["user"]["user_role"] == "security"

def test_login_valid_supervisor():
    response = client.post(
        "/api/auth/login", 
        json={"username": "supervisor_user", "user_pin": "3333"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "supervisor_user"
    assert data["user"]["user_role"] == "supervisor"

def test_login_valid_manager():
    response = client.post(
        "/api/auth/login", 
        json={"username": "manager_user", "user_pin": "4444"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "manager_user"
    assert data["user"]["user_role"] == "manager"

def test_login_invalid_username():
    response = client.post(
        "/api/auth/login", 
        json={"username": "invalid_user", "user_pin": "1111"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid username or PIN"

def test_login_invalid_pin():
    response = client.post(
        "/api/auth/login", 
        json={"username": "admin_user", "user_pin": "wrong_pin"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid username or PIN"
