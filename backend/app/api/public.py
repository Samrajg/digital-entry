from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.entry import PublicContextResponse
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
