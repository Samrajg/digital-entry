from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.security import SecurityCreate, SecurityUpdate, SecurityResponse
from app.services.security_service import SecurityService

router = APIRouter()

@router.get("/", response_model=List[SecurityResponse])
def get_all_security(db: Session = Depends(get_db)):
    return SecurityService.get_all(db)

@router.post("/", response_model=SecurityResponse, status_code=status.HTTP_201_CREATED)
def create_security(schema: SecurityCreate, db: Session = Depends(get_db)):
    return SecurityService.create(db, schema)

@router.put("/{security_id}", response_model=SecurityResponse)
def update_security(security_id: int, schema: SecurityUpdate, db: Session = Depends(get_db)):
    return SecurityService.update(db, security_id, schema)
