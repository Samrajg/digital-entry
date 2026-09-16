from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.models.schedule import ScheduledVisit
from app.models.campus import Campus
from app.models.gate import Gate
from app.schemas.schedule import ScheduleCreate, ScheduleUpdateStatus, ScheduleResponse
import uuid

router = APIRouter()

@router.get("/", response_model=list[ScheduleResponse])
def get_schedules(db: Session = Depends(get_db)):
    schedules = db.query(ScheduledVisit).options(
        joinedload(ScheduledVisit.campus),
        joinedload(ScheduledVisit.gate)
    ).order_by(desc(ScheduledVisit.expected_date)).all()
    
    response = []
    for s in schedules:
        # Build response manually to include campus_name and gate_name
        resp_dict = {
            "scheduled_visit_id": s.scheduled_visit_id,
            "visitor_name": s.visitor_name,
            "purpose": s.purpose,
            "expected_date": s.expected_date,
            "time_slot": s.time_slot,
            "campus_id": s.campus_id,
            "gate_id": s.gate_id,
            "qr_pass_value": s.qr_pass_value,
            "status": s.status,
            "created_at": s.created_at,
            "campus_name": s.campus.name if s.campus else "Unknown",
            "gate_name": s.gate.name if s.gate else "Unknown"
        }
        response.append(resp_dict)
        
    return response

@router.post("/", response_model=ScheduleResponse)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    # Generate unique QR pass
    qr_pass = f"SCH-{uuid.uuid4().hex[:8].upper()}"
    
    db_schedule = ScheduledVisit(
        visitor_name=schedule.visitor_name,
        purpose=schedule.purpose,
        expected_date=schedule.expected_date,
        time_slot=schedule.time_slot,
        campus_id=schedule.campus_id,
        gate_id=schedule.gate_id,
        qr_pass_value=qr_pass,
        status="PENDING"
    )
    
    db.add(db_schedule)
    db.commit()
    # BUG-21 FIX: Use joinedload so relationships are loaded in a single query on refresh
    # instead of issuing two extra SELECT queries for Campus and Gate separately.
    db.refresh(db_schedule)
    db.expire(db_schedule)
    db_schedule = db.query(ScheduledVisit).options(
        joinedload(ScheduledVisit.campus),
        joinedload(ScheduledVisit.gate)
    ).filter(ScheduledVisit.scheduled_visit_id == db_schedule.scheduled_visit_id).first()
    
    return {
        "scheduled_visit_id": db_schedule.scheduled_visit_id,
        "visitor_name": db_schedule.visitor_name,
        "purpose": db_schedule.purpose,
        "expected_date": db_schedule.expected_date,
        "time_slot": db_schedule.time_slot,
        "campus_id": db_schedule.campus_id,
        "gate_id": db_schedule.gate_id,
        "qr_pass_value": db_schedule.qr_pass_value,
        "status": db_schedule.status,
        "created_at": db_schedule.created_at,
        # Use the already-loaded relationship — no extra query needed
        "campus_name": db_schedule.campus.name if db_schedule.campus else "Unknown",
        "gate_name": db_schedule.gate.name if db_schedule.gate else "Unknown"
    }

@router.put("/{visit_id}/status", response_model=ScheduleResponse)
def update_schedule_status(visit_id: int, update: ScheduleUpdateStatus, db: Session = Depends(get_db)):
    # BUG-21 FIX: Load relationships eagerly from the start so no extra queries are needed later
    db_schedule = db.query(ScheduledVisit).options(
        joinedload(ScheduledVisit.campus),
        joinedload(ScheduledVisit.gate)
    ).filter(ScheduledVisit.scheduled_visit_id == visit_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    db_schedule.status = update.status
    db.commit()
    db.refresh(db_schedule)
    
    return {
        "scheduled_visit_id": db_schedule.scheduled_visit_id,
        "visitor_name": db_schedule.visitor_name,
        "purpose": db_schedule.purpose,
        "expected_date": db_schedule.expected_date,
        "time_slot": db_schedule.time_slot,
        "campus_id": db_schedule.campus_id,
        "gate_id": db_schedule.gate_id,
        "qr_pass_value": db_schedule.qr_pass_value,
        "status": db_schedule.status,
        "created_at": db_schedule.created_at,
        # Use the relationship loaded by joinedload — no separate Campus/Gate SELECT
        "campus_name": db_schedule.campus.name if db_schedule.campus else "Unknown",
        "gate_name": db_schedule.gate.name if db_schedule.gate else "Unknown"
    }
