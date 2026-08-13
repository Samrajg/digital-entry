from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.log_service import LogService
from app.models.vehicle import Vehicle
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/")
def get_vehicles(
    skip: int = 0, 
    limit: int = 100, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    campus_id: Optional[int] = None,
    gate_id: Optional[int] = None,
    security_id: Optional[int] = None,
    sort_by: Optional[str] = 'created_at',
    sort_order: Optional[str] = 'desc',
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    return LogService.get_vehicles(db, skip, limit, start_date, end_date, campus_id, gate_id, security_id, sort_by, sort_order, active_only)

@router.post("/{vehicle_id}/checkout")
def checkout_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.checked_out_at:
        raise HTTPException(status_code=400, detail="Vehicle already checked out")
        
    vehicle.checked_out_at = datetime.utcnow()
    db.commit()
    return {"message": "Vehicle checked out successfully", "checked_out_at": vehicle.checked_out_at}
