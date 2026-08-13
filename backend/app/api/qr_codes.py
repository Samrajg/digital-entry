from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles
from app.schemas.qr_code import QRCodeCreate, QRCodeStatusUpdate, QRCodeResponse
from app.services.qr_code_service import QRCodeService
from typing import List

router = APIRouter()

# Read-only permission list (all roles can view)
READ_ROLES = ["admin", "security", "supervisor", "manager"]
# Write permission list (only admin can modify)
WRITE_ROLES = ["admin"]

@router.post("/gates/{gate_id}/qr-codes", response_model=QRCodeResponse, status_code=status.HTTP_201_CREATED)
def create_qr_code(
    gate_id: int,
    schema: QRCodeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    qr = QRCodeService.create_qr_code(db, gate_id, schema)
    return QRCodeService.build_response(qr)

@router.get("/gates/{gate_id}/qr-codes", response_model=List[QRCodeResponse])
def list_qr_codes(
    gate_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    qrs = QRCodeService.list_qr_codes_by_gate(db, gate_id)
    return [QRCodeService.build_response(qr) for qr in qrs]

@router.get("/qr-codes", response_model=List[QRCodeResponse])
def list_all_qr_codes(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    qrs = QRCodeService.list_all_qr_codes(db)
    return [QRCodeService.build_response(qr) for qr in qrs]

@router.get("/qr-codes/{qr_code_id}", response_model=QRCodeResponse)
def get_qr_code(
    qr_code_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(READ_ROLES))
):
    qr = QRCodeService.get_qr_code(db, qr_code_id)
    return QRCodeService.build_response(qr)

@router.patch("/qr-codes/{qr_code_id}/status", response_model=QRCodeResponse)
def update_qr_status(
    qr_code_id: int,
    schema: QRCodeStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(WRITE_ROLES))
):
    qr = QRCodeService.update_status(db, qr_code_id, schema.is_active)
    return QRCodeService.build_response(qr)
