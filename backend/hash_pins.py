import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

try:
    users = db.query(User).all()
    updated = 0
    for u in users:
        # Check if already hashed with bcrypt
        if not u.user_pin.startswith("$2b$"):
            u.user_pin = get_password_hash(u.user_pin)
            updated += 1

    db.commit()
    print(f"Hashed {updated} user PINs.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
