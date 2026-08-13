from app.core.database import SessionLocal
from sqlalchemy import text

def run_migrations():
    db = SessionLocal()
    try:
        print("Starting migrations for Features 7 & 8...")
        
        # 1. Add checked_out_at to visitors
        db.execute(text("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP;"))
        print("Added checked_out_at to visitors")

        # 2. Add checked_out_at to vehicles
        db.execute(text("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP;"))
        print("Added checked_out_at to vehicles")

        # 3. Create scheduled_visits table
        create_scheduled_visits_query = """
        CREATE TABLE IF NOT EXISTS scheduled_visits (
            scheduled_visit_id SERIAL PRIMARY KEY,
            visitor_name VARCHAR(255) NOT NULL,
            purpose VARCHAR(255),
            expected_date DATE NOT NULL,
            time_slot VARCHAR(50),
            campus_id INTEGER REFERENCES campuses(campus_id) ON DELETE CASCADE,
            gate_id INTEGER REFERENCES gates(gate_id) ON DELETE CASCADE,
            qr_pass_value VARCHAR(100) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        db.execute(text(create_scheduled_visits_query))
        print("Created scheduled_visits table")

        db.commit()
        print("Successfully updated database schema for Features 7 & 8!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
