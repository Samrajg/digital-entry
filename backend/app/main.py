from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import test_db_connection, Base, engine
from app.api.auth import router as auth_router
from app.api.campuses import router as campus_router
from app.api.gates import router as gate_router
from app.api.qr_codes import router as qr_code_router
import app.models # Register all models to SQLAlchemy's metadata

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

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(campus_router, prefix="/api/campuses", tags=["Campuses"])
app.include_router(gate_router, prefix="/api", tags=["Gates"])
app.include_router(qr_code_router, prefix="/api", tags=["QR Codes"])

@app.get("/")
def read_root():
    return {"status": "running", "message": "Digital Entry API is running"}
