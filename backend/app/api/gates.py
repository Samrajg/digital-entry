from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles
from app.schemas.gate import GateCreate, GateUpdate, GateStatusUpdate, GateResponse, GateDetailResponse
from app.services.gate_service import GateService
from typing import List

router = APIRouter()

# Read-only permission list (all roles can view)
READ_ROLES = ["admin", "security", "supervisor", "manager"]
# Write permission list (only admin can modify)
WRITE_ROLES = ["admin"]

@router.post("/campuses/{campus_id}/gates", response_model=GateResponse, status_code=status.HTTP_201_CREATED)
def create_gate(
    campus_id: int,
    schema: GateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    return GateService.create_gate(db, campus_id, schema)

@router.get("/campuses/{campus_id}/gates", response_model=List[GateResponse])
def list_gates(
    campus_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    return GateService.list_gates_by_campus(db, campus_id)

@router.get("/gates", response_model=List[GateDetailResponse])
def list_all_gates(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    gates = GateService.list_all_gates(db)
    return [
        {
            "gate_id": gate.gate_id,
            "campus_id": gate.campus_id,
            "campus_name": gate.campus.name,
            "name": gate.name,
            "code": gate.code,
            "description": gate.description,
            "location": gate.location,
            "is_active": gate.is_active,
            "created_at": gate.created_at,
            "updated_at": gate.updated_at,
            "qr_codes": []
        }
        for gate in gates
    ]

@router.get("/gates/{gate_id}", response_model=GateDetailResponse)
def get_gate(
    gate_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    db_gate = GateService.get_gate(db, gate_id)
    # Map relation items for detail schema response
    return {
        "gate_id": db_gate.gate_id,
        "campus_id": db_gate.campus_id,
        "campus_name": db_gate.campus.name,
        "name": db_gate.name,
        "code": db_gate.code,
        "description": db_gate.description,
        "location": db_gate.location,
        "is_active": db_gate.is_active,
        "created_at": db_gate.created_at,
        "updated_at": db_gate.updated_at,
        "qr_codes": db_gate.qr_codes
    }

@router.put("/gates/{gate_id}", response_model=GateResponse)
def update_gate(
    gate_id: int,
    schema: GateUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    return GateService.update_gate(db, gate_id, schema)

@router.patch("/gates/{gate_id}/status", response_model=GateResponse)
def update_gate_status(
    gate_id: int,
    schema: GateStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    return GateService.update_status(db, gate_id, schema.is_active)
