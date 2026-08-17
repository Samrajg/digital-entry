from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.services.appointment_service import AppointmentService

router = APIRouter()

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new appointment"""
    appointment = AppointmentService.create_appointment(db, appointment_in, current_user)
    # Convert to response and inject campus_name
    response = AppointmentResponse.from_orm(appointment)
    if appointment.campus:
        response.campus_name = appointment.campus.name
        
    # Generate and include the QR code image immediately so the frontend can display it
    response.qr_image_base64 = AppointmentService.get_appointment_qr_base64(appointment)
    return response

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    status: str = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List appointments (Admins see all, Employees see their own)"""
    appointments = AppointmentService.get_appointments(db, current_user, status)
    
    results = []
    for apt in appointments:
        res = AppointmentResponse.from_orm(apt)
        if apt.campus:
            res.campus_name = apt.campus.name
        res.qr_image_base64 = AppointmentService.get_appointment_qr_base64(apt)
        results.append(res)
    return results

@router.get("/today", response_model=List[AppointmentResponse])
def get_todays_expected_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's expected appointments for security guards"""
    if current_user.user_role not in ["admin", "security"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    appointments = AppointmentService.get_todays_expected(db)
    results = []
    for apt in appointments:
        res = AppointmentResponse.from_orm(apt)
        if apt.campus:
            res.campus_name = apt.campus.name
        results.append(res)
    return results

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific appointment details, including QR code"""
    appointment = AppointmentService.get_appointment(db, appointment_id, current_user)
    response = AppointmentResponse.from_orm(appointment)
    if appointment.campus:
        response.campus_name = appointment.campus.name
        
    # Generate and include the QR code image
    response.qr_image_base64 = AppointmentService.get_appointment_qr_base64(appointment)
    return response

@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an appointment"""
    appointment = AppointmentService.cancel_appointment(db, appointment_id, current_user)
    response = AppointmentResponse.from_orm(appointment)
    if appointment.campus:
        response.campus_name = appointment.campus.name
    return response
