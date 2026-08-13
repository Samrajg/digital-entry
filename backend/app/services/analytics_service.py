from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.models.visitor import Visitor
from app.models.vehicle import Vehicle
from app.models.gate import Gate
from app.models.campus import Campus

class AnalyticsService:
    @staticmethod
    def get_overview(db: Session):
        today = datetime.utcnow().date()
        seven_days_ago = today - timedelta(days=6)
        
        # 1. Stat cards
        today_visitors = db.query(Visitor).filter(func.date(Visitor.created_at) == today).count()
        today_vehicles = db.query(Vehicle).filter(func.date(Vehicle.created_at) == today).count()
        active_visitors = db.query(Visitor).filter(Visitor.checked_out_at.is_(None)).count()
        active_vehicles = db.query(Vehicle).filter(Vehicle.checked_out_at.is_(None)).count()
        active_gates = db.query(Gate).filter(Gate.is_active == True).count()
        active_campuses = db.query(Campus).filter(Campus.is_active == True).count()

        # 2. Trend line (Last 7 days)
        # Initialize dictionary with past 7 days (including today) set to 0
        trends = {}
        for i in range(7):
            d = today - timedelta(days=6-i)
            trends[d.strftime("%Y-%m-%d")] = {"date": d.strftime("%m/%d"), "visitors": 0, "vehicles": 0}

        visitor_trends = db.query(
            func.date(Visitor.created_at).label('date'),
            func.count(Visitor.visitor_id).label('count')
        ).filter(func.date(Visitor.created_at) >= seven_days_ago).group_by(func.date(Visitor.created_at)).all()

        vehicle_trends = db.query(
            func.date(Vehicle.created_at).label('date'),
            func.count(Vehicle.vehicle_id).label('count')
        ).filter(func.date(Vehicle.created_at) >= seven_days_ago).group_by(func.date(Vehicle.created_at)).all()

        for d, count in visitor_trends:
            date_str = d.strftime("%Y-%m-%d") if isinstance(d, date) else str(d)
            if date_str in trends:
                trends[date_str]["visitors"] = count
                
        for d, count in vehicle_trends:
            date_str = d.strftime("%Y-%m-%d") if isinstance(d, date) else str(d)
            if date_str in trends:
                trends[date_str]["vehicles"] = count

        trend_data = list(trends.values())

        # 3. Bar chart: Entries per campus
        campus_visitor_counts = db.query(Campus.name, func.count(Visitor.visitor_id))\
            .join(Gate, Campus.campus_id == Gate.campus_id)\
            .join(Visitor, Gate.gate_id == Visitor.gate_id)\
            .group_by(Campus.name).all()
            
        campus_vehicle_counts = db.query(Campus.name, func.count(Vehicle.vehicle_id))\
            .join(Gate, Campus.campus_id == Gate.campus_id)\
            .join(Vehicle, Gate.gate_id == Vehicle.gate_id)\
            .group_by(Campus.name).all()

        campus_stats = {}
        for c_name, count in campus_visitor_counts:
            if c_name not in campus_stats:
                campus_stats[c_name] = {"name": c_name, "visitors": 0, "vehicles": 0}
            campus_stats[c_name]["visitors"] = count
            
        for c_name, count in campus_vehicle_counts:
            if c_name not in campus_stats:
                campus_stats[c_name] = {"name": c_name, "visitors": 0, "vehicles": 0}
            campus_stats[c_name]["vehicles"] = count

        campus_data = list(campus_stats.values())

        # 4. Donut chart total breakdown
        total_visitors = db.query(Visitor).count()
        total_vehicles = db.query(Vehicle).count()

        # 5. Activity feed (Last 5 check-ins total)
        recent_visitors = db.query(Visitor).order_by(Visitor.created_at.desc()).limit(5).all()
        recent_vehicles = db.query(Vehicle).order_by(Vehicle.created_at.desc()).limit(5).all()

        activities = []
        for v in recent_visitors:
            activities.append({
                "type": "Visitor",
                "id": f"V-{v.visitor_id}",
                "timestamp": v.created_at,
                "details": f"Visitor checked in at Gate {v.gate_id}"
            })
        for v in recent_vehicles:
            activities.append({
                "type": "Vehicle",
                "id": f"C-{v.vehicle_id}",
                "timestamp": v.created_at,
                "details": f"Vehicle checked in at Gate {v.gate_id}"
            })
            
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        activities = activities[:5]

        # Format output
        return {
            "stats": {
                "today_visitors": today_visitors,
                "today_vehicles": today_vehicles,
                "active_visitors": active_visitors,
                "active_vehicles": active_vehicles,
                "active_gates": active_gates,
                "active_campuses": active_campuses
            },
            "trends": trend_data,
            "campus_breakdown": campus_data,
            "split": [
                {"name": "Visitors", "value": total_visitors},
                {"name": "Vehicles", "value": total_vehicles}
            ],
            "recent_activity": activities
        }
