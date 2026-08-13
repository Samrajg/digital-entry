from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.models.visitor import Visitor
from app.models.vehicle import Vehicle
from app.models.qr_code import QRCode
from app.models.gate import Gate
from app.models.campus import Campus
from app.models.security import Security
from app.models.dynamic_form import DynamicForm
from typing import Optional
from datetime import datetime

class LogService:
    @staticmethod
    def _format_form_data(form_data: dict, form) -> dict:
        if not form or not form.schema:
            return form_data
        field_map = {field.get("id"): field.get("label", field.get("id")) for field in form.schema if isinstance(field, dict)}
        return {field_map.get(k, k): v for k, v in form_data.items()}

    @staticmethod
    def get_visitors(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        campus_id: Optional[int] = None,
        gate_id: Optional[int] = None,
        security_id: Optional[int] = None,
        sort_by: Optional[str] = 'created_at',
        sort_order: Optional[str] = 'desc',
        active_only: bool = False
    ):
        query = db.query(Visitor, QRCode, Gate, Campus, Security, DynamicForm)\
            .join(QRCode, Visitor.qr_code_id == QRCode.qr_code_id)\
            .join(Gate, Visitor.gate_id == Gate.gate_id)\
            .join(Campus, Gate.campus_id == Campus.campus_id)\
            .outerjoin(Security, Visitor.security_id == Security.security_id)\
            .outerjoin(DynamicForm, Visitor.form_id == DynamicForm.form_id)

        # Filters
        if start_date:
            query = query.filter(Visitor.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Visitor.created_at <= datetime.fromisoformat(end_date))
        if campus_id:
            query = query.filter(Gate.campus_id == campus_id)
        if gate_id:
            query = query.filter(Visitor.gate_id == gate_id)
        if security_id:
            query = query.filter(Visitor.security_id == security_id)
        if active_only:
            query = query.filter(Visitor.checked_out_at == None)

        total = query.count()

        # Sorting
        order_col = Visitor.created_at
        if sort_by == 'campus_name':
            order_col = Campus.name
        elif sort_by == 'gate_name':
            order_col = Gate.name
        elif sort_by == 'security_name':
            order_col = Security.security_name

        if sort_order == 'asc':
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        results = query.offset(skip).limit(limit).all()
        
        response = []
        for visitor, qr, gate, campus, sec, form in results:
            response.append({
                "id": visitor.visitor_id,
                "form_id": visitor.form_id,
                "qr_code_id": visitor.qr_code_id,
                "qr_name": qr.name,
                "gate_name": gate.name,
                "campus_name": campus.name,
                "security_name": sec.security_name if sec else "Unknown",
                "form_data": LogService._format_form_data(visitor.form_data, form),
                "created_at": visitor.created_at,
                "checked_out_at": visitor.checked_out_at
            })
        return {"data": response, "total": total}

    @staticmethod
    def get_vehicles(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        campus_id: Optional[int] = None,
        gate_id: Optional[int] = None,
        security_id: Optional[int] = None,
        sort_by: Optional[str] = 'created_at',
        sort_order: Optional[str] = 'desc',
        active_only: bool = False
    ):
        query = db.query(Vehicle, QRCode, Gate, Campus, Security, DynamicForm)\
            .join(QRCode, Vehicle.qr_code_id == QRCode.qr_code_id)\
            .join(Gate, Vehicle.gate_id == Gate.gate_id)\
            .join(Campus, Gate.campus_id == Campus.campus_id)\
            .outerjoin(Security, Vehicle.security_id == Security.security_id)\
            .outerjoin(DynamicForm, Vehicle.form_id == DynamicForm.form_id)

        # Filters
        if start_date:
            query = query.filter(Vehicle.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Vehicle.created_at <= datetime.fromisoformat(end_date))
        if campus_id:
            query = query.filter(Gate.campus_id == campus_id)
        if gate_id:
            query = query.filter(Vehicle.gate_id == gate_id)
        if security_id:
            query = query.filter(Vehicle.security_id == security_id)
        if active_only:
            query = query.filter(Vehicle.checked_out_at == None)

        total = query.count()

        # Sorting
        order_col = Vehicle.created_at
        if sort_by == 'campus_name':
            order_col = Campus.name
        elif sort_by == 'gate_name':
            order_col = Gate.name
        elif sort_by == 'security_name':
            order_col = Security.security_name

        if sort_order == 'asc':
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        results = query.offset(skip).limit(limit).all()
        
        response = []
        for vehicle, qr, gate, campus, sec, form in results:
            response.append({
                "id": vehicle.vehicle_id,
                "form_id": vehicle.form_id,
                "qr_code_id": vehicle.qr_code_id,
                "qr_name": qr.name,
                "gate_name": gate.name,
                "campus_name": campus.name,
                "security_name": sec.security_name if sec else "Unknown",
                "form_data": LogService._format_form_data(vehicle.form_data, form),
                "created_at": vehicle.created_at,
                "checked_out_at": vehicle.checked_out_at
            })
        return {"data": response, "total": total}
