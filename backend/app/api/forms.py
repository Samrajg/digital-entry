from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.dynamic_form import DynamicFormCreate, DynamicFormUpdate, DynamicFormResponse
from app.services.dynamic_form_service import DynamicFormService

router = APIRouter()

@router.post("/", response_model=DynamicFormResponse, status_code=status.HTTP_201_CREATED)
def create_form(schema: DynamicFormCreate, db: Session = Depends(get_db)):
    return DynamicFormService.create_form(db, schema)

@router.get("/", response_model=List[DynamicFormResponse])
def list_forms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DynamicFormService.list_forms(db, skip, limit)

@router.get("/{form_id}", response_model=DynamicFormResponse)
def get_form(form_id: str, db: Session = Depends(get_db)):
    return DynamicFormService.get_form(db, form_id)

@router.put("/{form_id}", response_model=DynamicFormResponse)
def update_form(form_id: str, schema: DynamicFormUpdate, db: Session = Depends(get_db)):
    return DynamicFormService.update_form(db, form_id, schema)

@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(form_id: str, db: Session = Depends(get_db)):
    DynamicFormService.delete_form(db, form_id)
