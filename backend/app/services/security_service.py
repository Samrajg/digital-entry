from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.security import Security
from app.schemas.security import SecurityCreate, SecurityUpdate
from typing import List

class SecurityService:
    @staticmethod
    def get_all(db: Session) -> List[Security]:
        return db.query(Security).order_by(Security.created_at.desc()).all()

    @staticmethod
    def create(db: Session, schema: SecurityCreate) -> Security:
        existing = db.query(Security).filter(Security.security_pin == schema.security_pin).first()
        if existing:
            raise HTTPException(status_code=400, detail="Security PIN already exists.")
        
        db_security = Security(
            security_name=schema.security_name,
            security_pin=schema.security_pin
        )
        db.add(db_security)
        db.commit()
        db.refresh(db_security)
        return db_security

    @staticmethod
    def update(db: Session, security_id: int, schema: SecurityUpdate) -> Security:
        db_security = db.query(Security).filter(Security.security_id == security_id).first()
        if not db_security:
            raise HTTPException(status_code=404, detail="Security personnel not found.")

        if schema.security_pin and schema.security_pin != db_security.security_pin:
            existing = db.query(Security).filter(Security.security_pin == schema.security_pin).first()
            if existing:
                raise HTTPException(status_code=400, detail="Security PIN already exists.")

        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_security, key, value)
            
        db.commit()
        db.refresh(db_security)
        return db_security
