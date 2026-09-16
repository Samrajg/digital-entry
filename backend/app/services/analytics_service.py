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
        # BUG-19 FIX: func.date() in D1 returns a string, not a date object, and the behaviour
        # can be dialect-dependent. Use explicit datetime range comparisons instead —
        # they work reliably across SQLite and Cloudflare D1.
        today_start = datetime(today.year, today.month, today.day, 0, 0, 0)
        today_end = datetime(today.year, today.month, today.day, 23, 59, 59, 999999)
        today_visitors = db.query(Visitor).filter(
            Visitor.created_at >= today_start,
            Visitor.created_at <= today_end
        ).count()
        today_vehicles = db.query(Vehicle).filter(
            Vehicle.created_at >= today_start,
            Vehicle.created_at <= today_end
        ).count()
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

        # BUG-19 FIX: Use datetime range filtering per day instead of func.date() which
        # returns strings from D1. Query all rows in the 7-day window then group in Python.
        window_start = datetime(seven_days_ago.year, seven_days_ago.month, seven_days_ago.day, 0, 0, 0)
        visitor_rows = db.query(Visitor.created_at).filter(Visitor.created_at >= window_start).all()
        vehicle_rows = db.query(Vehicle.created_at).filter(Vehicle.created_at >= window_start).all()

        for (created_at,) in visitor_rows:
            if created_at:
                # Handle both datetime objects and ISO strings returned by D1
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    except ValueError:
                        continue
                date_str = created_at.strftime("%Y-%m-%d")
                if date_str in trends:
                    trends[date_str]["visitors"] += 1

        for (created_at,) in vehicle_rows:
            if created_at:
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    except ValueError:
                        continue
                date_str = created_at.strftime("%Y-%m-%d")
                if date_str in trends:
                    trends[date_str]["vehicles"] += 1

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

        # 6. Anomalies (Overstays)
        eight_hours_ago = datetime.utcnow() - timedelta(hours=8)
        overstay_visitors = db.query(Visitor).filter(
            Visitor.checked_out_at.is_(None),
            Visitor.created_at < eight_hours_ago
        ).all()
        
        twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
        overstay_vehicles = db.query(Vehicle).filter(
            Vehicle.checked_out_at.is_(None),
            Vehicle.created_at < twelve_hours_ago
        ).all()
        
        def _visitor_display_name(form_data: dict) -> str:
            """
            BUG-11 FIX: Visitor model has no visitor_name column.
            The visitor's name lives inside the JSON form_data dict.
            Try common field names in priority order, fall back gracefully.
            """
            if not form_data:
                return "Unknown Visitor"
            for key in ("visitor_name", "name", "full_name", "Name", "Visitor Name"):
                val = form_data.get(key)
                if val and str(val).strip():
                    return str(val).strip()
            return "Unknown Visitor"

        anomalies = []
        for v in overstay_visitors:
            duration = datetime.utcnow() - v.created_at
            hours = int(duration.total_seconds() // 3600)
            # BUG-11 FIX: use form_data to get name, not the non-existent visitor_name column
            name = _visitor_display_name(v.form_data)
            anomalies.append({
                "type": "Visitor",
                "id": f"V-{v.visitor_id}",
                "name": name,
                "duration_hours": hours,
                "message": f"Visitor {name} has been on campus for {hours} hours"
            })
            
        for v in overstay_vehicles:
            duration = datetime.utcnow() - v.created_at
            hours = int(duration.total_seconds() // 3600)
            name = v.form_data.get('driver_name', 'Unknown Driver') if v.form_data else 'Unknown Driver'
            anomalies.append({
                "type": "Vehicle",
                "id": f"C-{v.vehicle_id}",
                "name": name,
                "duration_hours": hours,
                "message": f"Vehicle (Driver: {name}) has been on campus for {hours} hours (Overnight)"
            })
            
        anomalies.sort(key=lambda x: x["duration_hours"], reverse=True)

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
            "recent_activity": activities,
            "anomalies": anomalies
        }
