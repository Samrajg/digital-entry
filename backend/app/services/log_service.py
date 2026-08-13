from sqlalchemy.orm import Session
from app.models.visitor import Visitor
from app.models.vehicle import Vehicle
from app.models.qr_code import QRCode
from app.models.gate import Gate
from app.models.campus import Campus
from app.models.security import Security
from app.models.dynamic_form import DynamicForm

class LogService:
    @staticmethod
    def _format_form_data(form_data: dict, form) -> dict:
        if not form or not form.schema:
            return form_data
        field_map = {field.get("id"): field.get("label", field.get("id")) for field in form.schema if isinstance(field, dict)}
        return {field_map.get(k, k): v for k, v in form_data.items()}
    @staticmethod
    def get_visitors(db: Session, skip: int = 0, limit: int = 100):
        results = db.query(Visitor, QRCode, Gate, Campus, Security, DynamicForm)\
            .join(QRCode, Visitor.qr_code_id == QRCode.qr_code_id)\
            .join(Gate, Visitor.gate_id == Gate.gate_id)\
            .join(Campus, Gate.campus_id == Campus.campus_id)\
            .outerjoin(Security, Visitor.security_id == Security.security_id)\
            .outerjoin(DynamicForm, Visitor.form_id == DynamicForm.form_id)\
            .order_by(Visitor.created_at.desc())\
            .offset(skip).limit(limit).all()
        
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
                "created_at": visitor.created_at
            })
        return response

    @staticmethod
    def get_vehicles(db: Session, skip: int = 0, limit: int = 100):
        results = db.query(Vehicle, QRCode, Gate, Campus, Security, DynamicForm)\
            .join(QRCode, Vehicle.qr_code_id == QRCode.qr_code_id)\
            .join(Gate, Vehicle.gate_id == Gate.gate_id)\
            .join(Campus, Gate.campus_id == Campus.campus_id)\
            .outerjoin(Security, Vehicle.security_id == Security.security_id)\
            .outerjoin(DynamicForm, Vehicle.form_id == DynamicForm.form_id)\
            .order_by(Vehicle.created_at.desc())\
            .offset(skip).limit(limit).all()
        
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
                "created_at": vehicle.created_at
            })
        return response
