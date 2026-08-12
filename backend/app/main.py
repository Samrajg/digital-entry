from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import test_db_connection, Base, engine
from app.api.auth import router as auth_router
import app.models.user  # Imports the user model to register it with SQLAlchemy's metadata

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

# Register the Authentication API router
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
def read_root():
    return {"status": "running", "message": "Digital Entry API is running"}
