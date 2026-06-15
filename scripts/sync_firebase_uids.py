import sys
from backend.app.core.database import SessionLocal
from backend.app.models.student import Student
from backend.app.services.firebase import _ensure_firebase_initialized
from firebase_admin import auth

def sync_uids():
    _ensure_firebase_initialized()
    db = SessionLocal()
    
    students = db.query(Student).all()
    count = 0
    for student in students:
        try:
            fb_user = auth.get_user_by_email(student.email)
            if fb_user.uid != student.firebase_uid:
                print(f"Syncing {student.email}: {student.firebase_uid} -> {fb_user.uid}")
                student.firebase_uid = fb_user.uid
                count += 1
        except Exception as e:
            print(f"Failed to find {student.email} in Firebase: {e}")
            
    if count > 0:
        db.commit()
        print(f"Successfully synced {count} users.")
    else:
        print("All users are already in sync.")

if __name__ == "__main__":
    sync_uids()
