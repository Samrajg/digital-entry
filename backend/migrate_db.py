from app.core.database import SessionLocal
from sqlalchemy import text

def add_columns():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS form_id VARCHAR(100) REFERENCES dynamic_forms(form_id) ON DELETE CASCADE;"))
        db.execute(text("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS form_id VARCHAR(100) REFERENCES dynamic_forms(form_id) ON DELETE CASCADE;"))
        db.commit()
        print("Successfully updated database schema")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_columns()
