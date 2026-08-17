from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.entry import PublicContextResponse, CheckoutSubmit, CheckoutResponse
from app.schemas.dynamic_form import DynamicResponseSubmit, DynamicResponseView
from app.services.entry_service import EntryService
from app.models.schedule import ScheduledVisit
from fastapi import HTTPException

router = APIRouter()

@router.get("/entry/{public_code}", response_model=PublicContextResponse)
def get_public_entry_context(public_code: str, db: Session = Depends(get_db)):
    context = EntryService.get_public_context(db, public_code)
    return context

@router.post("/entry/{public_code}/register", response_model=DynamicResponseView, status_code=status.HTTP_201_CREATED)
def register_entry(public_code: str, schema: DynamicResponseSubmit, db: Session = Depends(get_db)):
    entry = EntryService.create_dynamic_entry(db, public_code, schema)
    return entry

@router.get("/schedule/{qr_pass_value}")
def get_public_schedule(qr_pass_value: str, db: Session = Depends(get_db)):
    schedule = db.query(ScheduledVisit).filter(ScheduledVisit.qr_pass_value == qr_pass_value, ScheduledVisit.status == "PENDING").first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Invalid or expired pass")
    return {
        "scheduled_visit_id": schedule.scheduled_visit_id,
        "visitor_name": schedule.visitor_name,
        "purpose": schedule.purpose,
        "campus_id": schedule.campus_id,
        "gate_id": schedule.gate_id
    }

@router.get("/exit/{public_code}", response_model=PublicContextResponse)
def get_exit_context(public_code: str, db: Session = Depends(get_db)):
    context = EntryService.get_public_context(db, public_code)
    if context.get("qr_type") not in ["exit_visitor", "exit_vehicle"]:
        raise HTTPException(status_code=400, detail="Not an exit QR code")
    return context

@router.post("/exit/{public_code}/checkout", response_model=CheckoutResponse)
def process_checkout_endpoint(public_code: str, data: CheckoutSubmit, db: Session = Depends(get_db)):
    result = EntryService.process_checkout(db, public_code, data.pass_id, data.security_pin)
    return result

# Appointment Public Routes

from app.services.appointment_service import AppointmentService
from app.schemas.appointment import AppointmentCheckin

@router.get("/appointment/{code}")
def get_public_appointment_context(code: str, db: Session = Depends(get_db)):
    """Fetch appointment details for check-in page"""
    appointment = AppointmentService.get_public_appointment_by_code(db, code)
    
    # Return context similar to what's expected by the frontend
    return {
        "appointment_code": appointment.appointment_code,
        "visitor_name": appointment.visitor_name,
        "visitor_count": appointment.visitor_count,
        "purpose": appointment.purpose,
        "employee_name": appointment.employee_name,
        "department": appointment.department,
        "campus_name": appointment.campus.name if appointment.campus else "",
        "meeting_location": appointment.meeting_location,
        "appointment_date": appointment.appointment_date.isoformat(),
        "time_slot": f"{appointment.time_slot_start} - {appointment.time_slot_end}",
        "notes": appointment.notes,
        "status": appointment.status,
        "is_valid": appointment.status == "SCHEDULED" and appointment.appointment_date == __import__('datetime').datetime.now().date()
    }

@router.post("/appointment/{code}/checkin")
def process_appointment_checkin(code: str, checkin_data: AppointmentCheckin, db: Session = Depends(get_db)):
    """Process guard PIN and finalize check-in"""
    return AppointmentService.process_checkin(db, code, checkin_data.security_pin, checkin_data.gate_id)
