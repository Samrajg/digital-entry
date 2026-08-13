import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text("ALTER TABLE users ALTER COLUMN user_pin TYPE VARCHAR(255);"))
    db.commit()
    print("Table altered successfully")
except Exception as e:
    print(f"Failed: {e}")
finally:
    db.close()
