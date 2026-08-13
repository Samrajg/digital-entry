from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.entry import PublicContextResponse
from app.schemas.dynamic_form import DynamicResponseSubmit, DynamicResponseView
from app.services.entry_service import EntryService

router = APIRouter()

@router.get("/entry/{public_code}", response_model=PublicContextResponse)
def get_public_entry_context(public_code: str, db: Session = Depends(get_db)):
    context = EntryService.get_public_context(db, public_code)
    return context

@router.post("/entry/{public_code}/register", response_model=DynamicResponseView, status_code=status.HTTP_201_CREATED)
def register_entry(public_code: str, schema: DynamicResponseSubmit, db: Session = Depends(get_db)):
    entry = EntryService.create_dynamic_entry(db, public_code, schema)
    return entry
