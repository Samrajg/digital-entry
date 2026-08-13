from sqlalchemy.orm import Session
from app.models.gate import Gate
from app.schemas.gate import GateCreate, GateUpdate
from typing import List, Optional

class GateRepository:
    @staticmethod
    def get_by_id(db: Session, gate_id: int) -> Optional[Gate]:
        return db.query(Gate).filter(Gate.gate_id == gate_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Gate]:
        return db.query(Gate).filter(Gate.code == code).first()

    @staticmethod
    def list_by_campus(db: Session, campus_id: int) -> List[Gate]:
        return db.query(Gate).filter(Gate.campus_id == campus_id).all()

    @staticmethod
    def list_all(db: Session) -> List[Gate]:
        return db.query(Gate).all()

    @staticmethod
    def create(db: Session, campus_id: int, schema: GateCreate) -> Gate:
        db_gate = Gate(
            campus_id=campus_id,
            name=schema.name,
            code=schema.code.upper(),
            description=schema.description,
            location=schema.location,
            is_active=True
        )
        db.add(db_gate)
        db.commit()
        db.refresh(db_gate)
        return db_gate

    @staticmethod
    def update(db: Session, db_gate: Gate, schema: GateUpdate) -> Gate:
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "code":
                value = value.upper()
            setattr(db_gate, key, value)
        db.commit()
        db.refresh(db_gate)
        return db_gate

    @staticmethod
    def save(db: Session, db_gate: Gate) -> Gate:
        db.add(db_gate)
        db.commit()
        db.refresh(db_gate)
        return db_gate
