from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.dynamic_response import DynamicResponse
from app.models.qr_code import QRCode
from app.models.gate import Gate
from app.models.campus import Campus
from app.models.security import Security
from app.schemas.dynamic_form import DynamicResponseSubmit

class EntryService:
    @staticmethod
    def get_public_context(db: Session, public_code: str):
        qr = db.query(QRCode).filter(QRCode.code == public_code).first()
        if not qr:
            raise HTTPException(status_code=404, detail="QR code not found")
        
        gate = qr.gate
        campus = gate.campus if gate else None
        form = qr.form

        # Determine overall active state
        is_active = qr.is_active and (gate.is_active if gate else False) and (campus.is_active if campus else False)
        
        if form and not form.is_active:
            is_active = False

        return {
            "campusName": campus.name if campus else "Unknown Campus",
            "gateName": gate.name if gate else "Unknown Gate",
            "active": is_active,
            "form_id": form.form_id if form else None,
            "form_name": form.name if form else None,
            "form_schema": form.schema if form else None
        }

    @staticmethod
    def create_dynamic_entry(db: Session, public_code: str, entry_data: DynamicResponseSubmit) -> DynamicResponse:
        qr = db.query(QRCode).filter(QRCode.code == public_code).first()
        if not qr:
            raise HTTPException(status_code=404, detail="QR code not found")
        
        if not qr.is_active:
            raise HTTPException(status_code=400, detail="QR code is inactive")
            
        if not qr.form_id:
            raise HTTPException(status_code=400, detail="QR code has no form attached")

        security = db.query(Security).filter(
            Security.security_pin == entry_data.security_pin,
            Security.is_active == True
        ).first()

        if not security:
            raise HTTPException(status_code=403, detail="Invalid or inactive security PIN")

        if qr.qr_type == 'vehicle':
            from app.models.vehicle import Vehicle
            db_response = Vehicle(
                form_id=qr.form_id,
                qr_code_id=qr.qr_code_id,
                gate_id=qr.gate_id,
                security_id=security.security_id,
                form_data=entry_data.response_data
            )
        else:
            from app.models.visitor import Visitor
            db_response = Visitor(
                form_id=qr.form_id,
                qr_code_id=qr.qr_code_id,
                gate_id=qr.gate_id,
                security_id=security.security_id,
                form_data=entry_data.response_data
            )
            
        db.add(db_response)
        db.commit()
        db.refresh(db_response)
        
        return {
            "response_id": db_response.vehicle_id if qr.qr_type == 'vehicle' else db_response.visitor_id,
            "form_id": db_response.form_id,
            "qr_code_id": db_response.qr_code_id,
            "response_data": db_response.form_data,
            "created_at": db_response.created_at
        }
