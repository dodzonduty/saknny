import sys
import os
import random
from datetime import timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from backend.app.models.attendance_record import AttendanceRecord

def fix_times():
    db = SessionLocal()
    try:
        records = db.query(AttendanceRecord).all()
        count = 0
        for record in records:
            # We want the time to be between 18:45:00 UTC and 19:15:00 UTC 
            # so that it displays as 9:45 PM to 10:15 PM local time (Egypt UTC+3).
            # Generate a random total seconds between 18*3600 + 45*60 = 67500 and 19*3600 + 15*60 = 69300
            random_seconds = random.randint(67500, 69300)
            hours = random_seconds // 3600
            minutes = (random_seconds % 3600) // 60
            seconds = random_seconds % 60
            
            # Apply the new time while keeping the original date
            record.attendance_at = record.attendance_at.replace(
                hour=hours, minute=minutes, second=seconds, microsecond=0
            )
            count += 1
        
        db.commit()
        print(f"Fixed {count} attendance records to be between 9:45 PM and 10:15 PM.")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    fix_times()
