from sqlalchemy.orm import Session
from app.models.qr_code import QRCode
from app.schemas.qr_code import QRCodeCreate
from typing import List, Optional

class QRCodeRepository:
    @staticmethod
    def get_by_id(db: Session, qr_code_id: int) -> Optional[QRCode]:
        return db.query(QRCode).filter(QRCode.qr_code_id == qr_code_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[QRCode]:
        return db.query(QRCode).filter(QRCode.code == code).first()

    @staticmethod
    def list_by_gate(db: Session, gate_id: int) -> List[QRCode]:
        return db.query(QRCode).filter(QRCode.gate_id == gate_id).all()

    @staticmethod
    def list_all(db: Session) -> List[QRCode]:
        return db.query(QRCode).all()

    @staticmethod
    def create(db: Session, gate_id: int, schema: QRCodeCreate, code_str: str, destination_url: str) -> QRCode:
        db_qr = QRCode(
            gate_id=gate_id,
            code=code_str,
            name=schema.name,
            destination_url=destination_url,
            is_active=True
        )
        db.add(db_qr)
        db.commit()
        db.refresh(db_qr)
        return db_qr

    @staticmethod
    def save(db: Session, db_qr: QRCode) -> QRCode:
        db.add(db_qr)
        db.commit()
        db.refresh(db_qr)
        return db_qr
