from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.campus_repository import CampusRepository
from app.schemas.campus import CampusCreate, CampusUpdate
from app.models.campus import Campus
from typing import List

class CampusService:
    @staticmethod
    def create_campus(db: Session, schema: CampusCreate) -> Campus:
        # Check if code already exists
        existing = CampusRepository.get_by_code(db, schema.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Campus with code '{schema.code.upper()}' already exists."
            )
        return CampusRepository.create(db, schema)

    @staticmethod
    def list_campuses(db: Session) -> List[Campus]:
        return CampusRepository.list_all(db)

    @staticmethod
    def get_campus(db: Session, campus_id: int) -> Campus:
        campus = CampusRepository.get_by_id(db, campus_id)
        if not campus:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Campus with ID {campus_id} not found."
            )
        return campus

    @staticmethod
    def update_campus(db: Session, campus_id: int, schema: CampusUpdate) -> Campus:
        db_campus = CampusService.get_campus(db, campus_id)
        
        # Check code collision if code is updated
        if schema.code and schema.code.upper() != db_campus.code:
            existing = CampusRepository.get_by_code(db, schema.code)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Campus with code '{schema.code.upper()}' already exists."
                )
        
        return CampusRepository.update(db, db_campus, schema)

    @staticmethod
    def update_status(db: Session, campus_id: int, is_active: bool) -> Campus:
        db_campus = CampusService.get_campus(db, campus_id)
        db_campus.is_active = is_active
        return CampusRepository.save(db, db_campus)
