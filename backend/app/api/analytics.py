from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    return AnalyticsService.get_overview(db)
