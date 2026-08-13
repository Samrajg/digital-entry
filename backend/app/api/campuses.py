from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles
from app.schemas.campus import CampusCreate, CampusUpdate, CampusStatusUpdate, CampusResponse, CampusDetailResponse
from app.services.campus_service import CampusService
from typing import List

router = APIRouter()

# Read-only permission list (all roles can view)
READ_ROLES = ["admin", "security", "supervisor", "manager"]
# Write permission list (only admin can modify)
WRITE_ROLES = ["admin"]

@router.post("", response_model=CampusResponse, status_code=status.HTTP_201_CREATED)
def create_campus(
    schema: CampusCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    return CampusService.create_campus(db, schema)

@router.get("", response_model=List[CampusResponse])
def list_campuses(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    return CampusService.list_campuses(db)

@router.get("/{campus_id}", response_model=CampusDetailResponse)
def get_campus(
    campus_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    return CampusService.get_campus(db, campus_id)

@router.put("/{campus_id}", response_model=CampusResponse)
def update_campus(
    campus_id: int,
    schema: CampusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    return CampusService.update_campus(db, campus_id, schema)

@router.patch("/{campus_id}/status", response_model=CampusResponse)
def update_campus_status(
    campus_id: int,
    schema: CampusStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    return CampusService.update_status(db, campus_id, schema.is_active)
