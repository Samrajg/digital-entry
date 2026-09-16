from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
# BUG-10 FIX: Import AppointmentUpdate so we can wire PUT /{appointment_id}
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment_service import AppointmentService

router = APIRouter()
logger = logging.getLogger(__name__)


def _resolve_campus_name(appointment) -> str:
    """
    BUG-22 FIX: campus_name was silently staying "" when appointment.campus is None.
    This happens when a campus is deleted after the appointment was created (cascade
    on D1 isn't always guaranteed to fire). Emit a warning so it shows in logs and
    return a clearly informative placeholder instead of a blank string.
    """
    if appointment.campus:
        return appointment.campus.name
    logger.warning(
        "Appointment %s (campus_id=%s) has no associated campus — it may have been deleted.",
        appointment.appointment_id,
        appointment.campus_id,
    )
    return f"[Campus {appointment.campus_id} deleted]"


@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new appointment"""
    appointment = AppointmentService.create_appointment(db, appointment_in, current_user)
    response = AppointmentResponse.from_orm(appointment)
    response.campus_name = _resolve_campus_name(appointment)
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
        res.campus_name = _resolve_campus_name(apt)
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
        res.campus_name = _resolve_campus_name(apt)
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
    response.campus_name = _resolve_campus_name(appointment)
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
    response.campus_name = _resolve_campus_name(appointment)
    return response


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    update_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    BUG-10 FIX: Edit a SCHEDULED appointment.
    Only the creator or an admin can edit. Only SCHEDULED appointments can be modified.
    Send only the fields you want to change — all fields are optional.
    """
    appointment = AppointmentService.update_appointment(db, appointment_id, update_in, current_user)
    response = AppointmentResponse.from_orm(appointment)
    response.campus_name = _resolve_campus_name(appointment)
    response.qr_image_base64 = AppointmentService.get_appointment_qr_base64(appointment)
    return response
