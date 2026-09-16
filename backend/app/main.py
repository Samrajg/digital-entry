from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import test_db_connection, Base, engine
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.campuses import router as campus_router
from app.api.gates import router as gate_router
from app.api.qr_codes import router as qr_code_router
from app.api.public import router as public_router
from app.api.forms import router as forms_router
from app.api.visitors import router as visitors_router
from app.api.vehicles import router as vehicles_router
from app.api.analytics import router as analytics_router
from app.api.notifications import router as notifications_router
from app.api.schedules import router as schedules_router
from app.api.appointments import router as appointments_router
import app.models  # Register all models to SQLAlchemy's metadata
from app.core.security import get_current_user, require_roles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Test connection on startup
    test_db_connection()
    # Automatically generate database tables if they do not exist
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Database table initialization failed: {e}")
    yield

app = FastAPI(title="Digital Entry API", lifespan=lifespan)

# BUG-15 FIX: CORS origins are now read from settings (driven by CORS_ORIGINS env var).
# Previously hardcoded to "http://localhost:3000" — now configurable without a code change.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(public_router, prefix="/api/public", tags=["Public"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])

# Protected routes
protected_dependencies = [Depends(get_current_user)]

# BUG-12 FIX: Removed redundant Depends(get_current_user) from admin_dependencies.
# require_roles() already calls get_current_user internally via its own Depends chain.
# Having both was causing two JWT decodes + two DB user lookups per admin request.
admin_dependencies = [Depends(require_roles(["admin"]))]

app.include_router(campus_router, prefix="/api/campuses", tags=["Campuses"], dependencies=protected_dependencies)
app.include_router(gate_router, prefix="/api", tags=["Gates"], dependencies=protected_dependencies)
app.include_router(qr_code_router, prefix="/api", tags=["QR Codes"], dependencies=protected_dependencies)
app.include_router(forms_router, prefix="/api/forms", tags=["Dynamic Forms"], dependencies=admin_dependencies)
app.include_router(users_router, prefix="/api/users", tags=["Users"], dependencies=admin_dependencies)
app.include_router(visitors_router, prefix="/api/visitors", tags=["Visitors"], dependencies=admin_dependencies)
app.include_router(vehicles_router, prefix="/api/vehicles", tags=["Vehicles"], dependencies=protected_dependencies)
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"], dependencies=protected_dependencies)
app.include_router(schedules_router, prefix="/api/schedules", tags=["Schedules"], dependencies=admin_dependencies)
app.include_router(appointments_router, prefix="/api/appointments", tags=["Appointments"], dependencies=protected_dependencies)

@app.get("/")
def read_root():
    return {"status": "running", "message": "Digital Entry API is running"}
