import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Normalize postgres URL schema if needed (SQLAlchemy requires postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(db_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
except Exception as e:
    print(f"Failed to initialize SQLAlchemy Engine: {e}", file=sys.stderr)
    raise e

def test_db_connection():
    print("Testing connection to database...")
    try:
        # Try to connect and execute a simple query
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        
        print("\n" + "="*50)
        print("DATABASE STATUS: Connected to terminal / database successfully!")
        print("="*50 + "\n")
    except Exception as e:
        print("\n" + "!"*50, file=sys.stderr)
        print("DATABASE STATUS: Connection Failed!", file=sys.stderr)
        print(f"Exception Message: {e}", file=sys.stderr)
        print("!"*50 + "\n", file=sys.stderr)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

