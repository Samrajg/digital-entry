from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.gate_repository import GateRepository
from app.services.campus_service import CampusService
from app.schemas.gate import GateCreate, GateUpdate
from app.models.gate import Gate
from typing import List

class GateService:
    @staticmethod
    def create_gate(db: Session, campus_id: int, schema: GateCreate) -> Gate:
        # Verify campus exists
        campus = CampusService.get_campus(db, campus_id)
        
        # Rule 3: An inactive campus should prevent new active entry points from being used
        if not campus.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create a gate under an inactive campus."
            )
            
        # Check if gate code already exists globally
        existing = GateRepository.get_by_code(db, schema.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Gate with code '{schema.code.upper()}' already exists."
            )
            
        return GateRepository.create(db, campus_id, schema)

    @staticmethod
    def list_gates_by_campus(db: Session, campus_id: int) -> List[Gate]:
        # Verify campus exists
        CampusService.get_campus(db, campus_id)
        return GateRepository.list_by_campus(db, campus_id)

    @staticmethod
    def list_all_gates(db: Session) -> List[Gate]:
        return GateRepository.list_all(db)

    @staticmethod
    def get_gate(db: Session, gate_id: int) -> Gate:
        gate = GateRepository.get_by_id(db, gate_id)
        if not gate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Gate with ID {gate_id} not found."
            )
        return gate

    @staticmethod
    def update_gate(db: Session, gate_id: int, schema: GateUpdate) -> Gate:
        db_gate = GateService.get_gate(db, gate_id)
        
        # Check code collision if code is updated
        if schema.code and schema.code.upper() != db_gate.code:
            existing = GateRepository.get_by_code(db, schema.code)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Gate with code '{schema.code.upper()}' already exists."
                )
                
        return GateRepository.update(db, db_gate, schema)

    @staticmethod
    def update_status(db: Session, gate_id: int, is_active: bool) -> Gate:
        db_gate = GateService.get_gate(db, gate_id)
        
        # Check if parent campus is inactive when activating a gate
        if is_active and not db_gate.campus.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot activate a gate when its campus is inactive."
            )
            
        db_gate.is_active = is_active
        return GateRepository.save(db, db_gate)
