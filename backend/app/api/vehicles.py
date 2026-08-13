from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.log import LogResponse
from app.services.log_service import LogService

router = APIRouter()

@router.get("/", response_model=List[LogResponse])
def get_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return LogService.get_vehicles(db, skip, limit)
