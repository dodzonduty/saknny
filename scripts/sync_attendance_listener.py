"""
Real-time listener for Firestore attendance logs.
Syncs attendance logs from Firebase to PostgreSQL.
"""

import os
import sys
import threading
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from firebase_admin import firestore  # noqa: E402

from backend.app.core.database import SessionLocal  # noqa: E402
from backend.app.models.student import Student  # noqa: E402
from backend.app.models.attendance_record import AttendanceRecord  # noqa: E402
from backend.app.services.firebase import _ensure_firebase_initialized  # noqa: E402

callback_done = threading.Event()

def on_snapshot(col_snapshot, changes, read_time):
    print(f"Received snapshot at {read_time}")
    db = SessionLocal()
    try:
        for change in changes:
            if change.type.name == 'ADDED':
                doc = change.document
                data = doc.to_dict()
                firebase_uid = data.get('firebase_uid')
                lat = data.get('latitude')
                lng = data.get('longitude')
                timestamp = data.get('timestamp')
                device_id = data.get('device_id')
                
                print(f"New attendance for {firebase_uid}")
                
                # Lookup student
                student = db.query(Student).filter(Student.firebase_uid == firebase_uid).first()
                if not student:
                    print(f"Warning: No student found for firebase_uid {firebase_uid}")
                    continue
                
                # Convert firestore datetime
                dt = timestamp if timestamp else datetime.now(timezone.utc)
                attendance_date = dt.date()
                
                existing = db.query(AttendanceRecord).filter(
                    AttendanceRecord.student_id == student.student_id,
                    AttendanceRecord.attendance_date == attendance_date
                ).first()
                
                if not existing:
                    record = AttendanceRecord(
                        student_id=student.student_id,
                        attendance_at=dt,
                        attendance_date=attendance_date,
                        client_timestamp=dt,
                        latitude=lat,
                        longitude=lng,
                        status='SUCCESS',
                        device_id=device_id
                    )
                    db.add(record)
                    db.commit()
                    print(f"Successfully recorded attendance for student_id {student.student_id}")
    except Exception as e:
        print(f"Error processing snapshot: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    _ensure_firebase_initialized()
    db = firestore.client()
    
    col_query = db.collection('attendance_logs')
    col_watch = col_query.on_snapshot(on_snapshot)
    
    print("Listening for attendance logs... (Press Ctrl+C to stop)")
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping listener.")
        col_watch.unsubscribe()

if __name__ == "__main__":
    main()
