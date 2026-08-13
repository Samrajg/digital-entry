from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import qrcode
import io
import base64
from app.repositories.qr_code_repository import QRCodeRepository
from app.services.gate_service import GateService
from app.schemas.qr_code import QRCodeCreate, QRCodeUpdate
from app.models.qr_code import QRCode
from typing import List, Optional

class QRCodeService:
    @staticmethod
    def generate_qr_base64(url: str) -> str:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    @staticmethod
    def create_qr_code(db: Session, gate_id: int, schema: QRCodeCreate) -> QRCode:
        # Verify gate exists
        gate = GateService.get_gate(db, gate_id)
        
        # Rule 4: An inactive gate should prevent its QR entry point from being considered active
        if not gate.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create a QR code under an inactive gate."
            )
            
        # Rule 3: An inactive campus should prevent new active entry points from being used
        if not gate.campus.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create a QR code when the campus is inactive."
            )

        # Generate unique code for QR: QR-CAMPUS-GATE
        base_code = f"QR-{gate.campus.code}-{gate.code}"
        code_str = base_code
        counter = 1
        
        # Ensure global uniqueness of the QR code
        while QRCodeRepository.get_by_code(db, code_str) is not None:
            code_str = f"{base_code}-{counter}"
            counter += 1

        import os
        frontend_url = os.getenv("FRONTEND_URL", "http://10.10.3.29:3000")
        destination_url = f"{frontend_url}/entry/{code_str}"

        return QRCodeRepository.create(db, gate_id, schema, code_str, destination_url)

    @staticmethod
    def list_qr_codes_by_gate(db: Session, gate_id: int) -> List[QRCode]:
        # Verify gate exists
        GateService.get_gate(db, gate_id)
        return QRCodeRepository.list_by_gate(db, gate_id)

    @staticmethod
    def list_all_qr_codes(db: Session) -> List[QRCode]:
        return QRCodeRepository.list_all(db)

    @staticmethod
    def get_qr_code(db: Session, qr_code_id: str) -> QRCode:
        qr = QRCodeRepository.get_by_id(db, qr_code_id)
        if not qr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"QR Code with ID {qr_code_id} not found."
            )
        return qr

    @staticmethod
    def update_status(db: Session, qr_code_id: str, is_active: bool) -> QRCode:
        db_qr = QRCodeService.get_qr_code(db, qr_code_id)
        
        # If activating QR code, verify parent gate and campus are active
        if is_active:
            if not db_qr.gate.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot activate QR code when the gate is inactive."
                )
            if not db_qr.gate.campus.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot activate QR code when the campus is inactive."
                )
                
        db_qr.is_active = is_active
        return QRCodeRepository.save(db, db_qr)

    @staticmethod
    def update_qr_code(db: Session, qr_code_id: str, schema: QRCodeUpdate) -> QRCode:
        db_qr = QRCodeService.get_qr_code(db, qr_code_id)
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_qr, key, value)
        return QRCodeRepository.save(db, db_qr)

    @staticmethod
    def build_response(qr: QRCode) -> dict:
        # Generate server-side base64 image representation
        qr_image = QRCodeService.generate_qr_base64(qr.destination_url)
        return {
            "qr_code_id": qr.qr_code_id,
            "gate_id": qr.gate_id,
            "gate_name": qr.gate.name,
            "campus_id": qr.gate.campus_id,
            "campus_name": qr.gate.campus.name,
            "code": qr.code,
            "name": qr.name,
            "destination_url": qr.destination_url,
            "is_active": qr.is_active,
            "qr_type": qr.qr_type,
            "qr_image_base64": qr_image,
            "created_at": qr.created_at,
            "updated_at": qr.updated_at
        }
