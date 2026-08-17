from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException
from datetime import datetime
import uuid
from typing import List, Optional

from app.models.appointment import Appointment
from app.models.campus import Campus
from app.models.user import User
from app.schemas.appointment import AppointmentCreate
from app.services.qr_code_service import QRCodeService

class AppointmentService:
    @staticmethod
    def _generate_appointment_code() -> str:
        # e.g. APT-2026-08-17-X7K9
        date_str = datetime.now().strftime("%Y-%m-%d")
        suffix = str(uuid.uuid4()).split('-')[0].upper()
        return f"APT-{date_str}-{suffix}"

    @staticmethod
    def create_appointment(db: Session, appointment_in: AppointmentCreate, current_user: User) -> Appointment:
        # Validate campus
        campus = db.query(Campus).filter(Campus.campus_id == appointment_in.campus_id).first()
        if not campus:
            raise HTTPException(status_code=404, detail="Campus not found")

        appointment_code = AppointmentService._generate_appointment_code()
        
        db_appointment = Appointment(
            appointment_code=appointment_code,
            created_by=current_user.user_id,
            employee_name=current_user.username, # Basic fallback; in real system might join on a Profile
            visitor_name=appointment_in.visitor_name,
            visitor_email=appointment_in.visitor_email,
            visitor_phone=appointment_in.visitor_phone,
            visitor_count=appointment_in.visitor_count,
            purpose=appointment_in.purpose,
            campus_id=appointment_in.campus_id,
            meeting_location=appointment_in.meeting_location,
            department=appointment_in.department,
            appointment_date=appointment_in.appointment_date,
            time_slot_start=appointment_in.time_slot_start,
            time_slot_end=appointment_in.time_slot_end,
            notes=appointment_in.notes,
            status="SCHEDULED"
        )
        
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        return db_appointment

    @staticmethod
    def get_appointments(db: Session, user: User, status: Optional[str] = None) -> List[Appointment]:
        query = db.query(Appointment)
        
        # If not admin, only show own appointments
        if user.user_role != "admin":
            query = query.filter(Appointment.created_by == user.user_id)
            
        if status:
            query = query.filter(Appointment.status == status)
            
        return query.order_by(desc(Appointment.created_at)).all()

    @staticmethod
    def get_appointment(db: Session, appointment_id: int, user: User) -> Appointment:
        appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
            
        # Permission check
        if user.user_role != "admin" and appointment.created_by != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
            
        return appointment

    @staticmethod
    def cancel_appointment(db: Session, appointment_id: int, user: User) -> Appointment:
        appointment = AppointmentService.get_appointment(db, appointment_id, user)
        
        if appointment.status != "SCHEDULED":
            raise HTTPException(status_code=400, detail=f"Cannot cancel appointment with status {appointment.status}")
            
        appointment.status = "CANCELLED"
        appointment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(appointment)
        return appointment

    @staticmethod
    def get_todays_expected(db: Session) -> List[Appointment]:
        # For security guards
        today = datetime.now().date()
        return db.query(Appointment).filter(
            Appointment.appointment_date == today,
            Appointment.status == "SCHEDULED"
        ).order_by(Appointment.time_slot_start).all()

    @staticmethod
    def get_public_appointment_by_code(db: Session, code: str) -> Appointment:
        appointment = db.query(Appointment).filter(Appointment.appointment_code == code).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found or invalid QR code")
        return appointment
        
    @staticmethod
    def get_appointment_qr_base64(appointment: Appointment) -> str:
        # The QR code contains the public check-in URL
        qr_value = f"/appointment/{appointment.appointment_code}"
        return QRCodeService.generate_qr_base64(qr_value)

    @staticmethod
    def process_checkin(db: Session, code: str, security_pin: str, gate_id: int):
        from app.models.security import Security
        from app.models.visitor import Visitor
        
        # Validate appointment
        appointment = AppointmentService.get_public_appointment_by_code(db, code)
        if appointment.status != "SCHEDULED":
            raise HTTPException(status_code=400, detail="Appointment is not in SCHEDULED status")
            
        today = datetime.now().date()
        if appointment.appointment_date != today:
            raise HTTPException(status_code=400, detail=f"Appointment is for {appointment.appointment_date}, not today")
            
        # Validate security PIN
        guard = db.query(Security).filter(Security.security_pin == security_pin).first()
        if not guard:
            raise HTTPException(status_code=403, detail="Invalid security PIN")
            
        # Create visitor record
        form_data = {
            "purpose": appointment.purpose,
            "meeting_with": appointment.employee_name,
            "department": appointment.department,
            "meeting_location": appointment.meeting_location,
            "visitor_email": appointment.visitor_email,
            "visitor_phone": appointment.visitor_phone,
            "visitor_count": appointment.visitor_count
        }
        
        # Assuming QRCodeService creates a pass
        qr_code = QRCodeService.create_qr_code(db, "visitor")
        
        visitor = Visitor(
            visitor_name=appointment.visitor_name,
            phone_number=appointment.visitor_phone or "N/A",
            form_id="appointment_form",
            qr_code_id=qr_code.qr_code_id,
            gate_id=gate_id,
            campus_id=appointment.campus_id,
            appointment_id=appointment.appointment_id,
            security_id=guard.security_id,
            form_data=form_data
        )
        
        db.add(visitor)
        db.flush() # get visitor_id
        
        # Update appointment
        appointment.status = "CHECKED_IN"
        appointment.checked_in_at = datetime.utcnow()
        appointment.checked_in_gate_id = gate_id
        appointment.checked_in_security_id = guard.security_id
        appointment.visitor_record_id = visitor.visitor_id
        
        db.commit()
        db.refresh(appointment)
        
        return {
            "status": "success",
            "message": "Entry Authorized",
            "pass_id": qr_code.pass_id,
            "directions": appointment.meeting_location,
            "employee_name": appointment.employee_name
        }
