from sqlalchemy.orm import Session
from app.models.campus import Campus
from app.schemas.campus import CampusCreate, CampusUpdate
from typing import List, Optional

class CampusRepository:
    @staticmethod
    def get_by_id(db: Session, campus_id: int) -> Optional[Campus]:
        return db.query(Campus).filter(Campus.campus_id == campus_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Campus]:
        return db.query(Campus).filter(Campus.code == code).first()

    @staticmethod
    def list_all(db: Session) -> List[Campus]:
        return db.query(Campus).all()

    @staticmethod
    def create(db: Session, schema: CampusCreate) -> Campus:
        db_campus = Campus(
            name=schema.name,
            code=schema.code.upper(),
            address=schema.address,
            city=schema.city,
            is_active=True
        )
        db.add(db_campus)
        db.commit()
        db.refresh(db_campus)
        return db_campus

    @staticmethod
    def update(db: Session, db_campus: Campus, schema: CampusUpdate) -> Campus:
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "code":
                value = value.upper()
            setattr(db_campus, key, value)
        db.commit()
        db.refresh(db_campus)
        return db_campus

    @staticmethod
    def save(db: Session, db_campus: Campus) -> Campus:
        db.add(db_campus)
        db.commit()
        db.refresh(db_campus)
        return db_campus
