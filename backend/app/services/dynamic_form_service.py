from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.dynamic_form import DynamicForm
from app.schemas.dynamic_form import DynamicFormCreate, DynamicFormUpdate
from typing import List

class DynamicFormService:
    @staticmethod
    def get_form(db: Session, form_id: str) -> DynamicForm:
        form = db.query(DynamicForm).filter(DynamicForm.form_id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        return form

    @staticmethod
    def list_forms(db: Session, skip: int = 0, limit: int = 100) -> List[DynamicForm]:
        return db.query(DynamicForm).offset(skip).limit(limit).all()

    @staticmethod
    def create_form(db: Session, schema: DynamicFormCreate) -> DynamicForm:
        # Pydantic alias for 'schema' is 'schema_', we convert to dict using model_dump
        form_data = schema.model_dump(by_alias=True)
        db_form = DynamicForm(**form_data)
        db.add(db_form)
        db.commit()
        db.refresh(db_form)
        return db_form

    @staticmethod
    def update_form(db: Session, form_id: str, schema: DynamicFormUpdate) -> DynamicForm:
        db_form = DynamicFormService.get_form(db, form_id)
        update_data = schema.model_dump(exclude_unset=True, by_alias=True)
        for key, value in update_data.items():
            setattr(db_form, key, value)
        
        db.commit()
        db.refresh(db_form)
        return db_form

    @staticmethod
    def delete_form(db: Session, form_id: str) -> dict:
        db_form = DynamicFormService.get_form(db, form_id)
        db.delete(db_form)
        db.commit()
        return {"detail": "Form deleted successfully"}
