import os
import sys
from datetime import datetime, timedelta
import random

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from backend.app.core.database import SessionLocal
from backend.app.models.student import Student
from backend.app.models.building import Building
from backend.app.models.room import Room
from backend.app.models.allocation import Allocation
from backend.app.models.attendance_record import AttendanceRecord
from backend.app.services.firebase import _ensure_firebase_initialized
from firebase_admin import auth

# Configuration
LATITUDE = 30.0828
LONGITUDE = 31.2463
RADIUS = 100
PASSWORD = "abc134101"

MALE_NAMES = ["Adham", "Mohamed", "Ziad", "Mahmoud", "Mostafa", "Hazem", "Saied", "Ahmed", "Omar", "Youssef", "Ali", "Tarek", "Khaled", "Amr", "Mazen", "Nour", "Seif", "Karim", "Yassin", "Hassan", "Ibrahim", "Tamer", "Hossam", "Rami", "Waleed"]
FEMALE_NAMES = ["Zienab", "Mariem", "Salma", "Aya", "Nour", "Habiba", "Jana", "Menna", "Laila", "Hana", "Farah", "Yasmine", "Nada", "Rawan", "Dina", "Hadeer", "Maha", "Sarah", "Reem", "Nadine", "Malak", "May", "Noha", "Hoda", "Esraa"]

def wipe_firebase_users():
    print("Wiping Firebase Auth Users...")
    _ensure_firebase_initialized()
    users = auth.list_users()
    count = 0
    while users.users:
        for user in users.users:
            auth.delete_user(user.uid)
            count += 1
        if users.has_next_page:
            users = users.get_next_page()
        else:
            break
    print(f"Deleted {count} users from Firebase.")

def run_seed():
    wipe_firebase_users()
    
    db = SessionLocal()
    print("Wiping PostgreSQL Database...")
    db.execute(text("TRUNCATE TABLE students, buildings CASCADE;"))
    db.commit()

    print("Creating Buildings and Rooms...")
    male_building = Building(building_name="Men's Dormitory Alpha", gender_type="M", status="active")
    female_building = Building(building_name="Women's Dormitory Beta", gender_type="F", status="active")
    db.add_all([male_building, female_building])
    db.commit()

    male_rooms = []
    for i in range(1, 14): # 13 rooms with 2 beds = 26 beds
        r = Room(dorm_id=male_building.dorm_id, room_number=f"M-{100+i}", total_beds=2, available_beds=2, latitude=LATITUDE, longitude=LONGITUDE, allowed_radius_meters=RADIUS, status="active")
        male_rooms.append(r)
    
    female_rooms = []
    for i in range(1, 14): # 13 rooms with 2 beds = 26 beds
        r = Room(dorm_id=female_building.dorm_id, room_number=f"F-{100+i}", total_beds=2, available_beds=2, latitude=LATITUDE, longitude=LONGITUDE, allowed_radius_meters=RADIUS, status="active")
        female_rooms.append(r)

    db.add_all(male_rooms + female_rooms)
    db.commit()

    print("Creating Students and Firebase Accounts...")
    def create_students(names, gender, rooms):
        students = []
        room_idx = 0
        bed_count = 0
        
        for name in names:
            email = f"{name.lower()}@student.sakkny.com"
            try:
                user = auth.create_user(email=email, password=PASSWORD, display_name=name)
                uid = user.uid
            except Exception as e:
                print(f"Failed to create {email} in Firebase: {e}")
                continue
            
            student = Student(
                faculty_id=random.randint(1000, 9999),
                name=name,
                email=email,
                gender=gender,
                home_city="Cairo",
                password_hash="$2a$12$yWW9jrP7lZc.mZZWRTh1j.GLI8pl.3DDNdYz6xOj/lwpIivUXVaaO", 
                enroll_status=True,
                firebase_uid=uid
            )
            db.add(student)
            db.flush()
            students.append(student)
            
            # Allocate to room
            room = rooms[room_idx]
            allocation = Allocation(
                student_id=student.student_id,
                room_id=room.room_id,
                plan="full_board",
                status="assigned",
                assigned_at=datetime.now() - timedelta(days=20)
            )
            db.add(allocation)
            room.available_beds -= 1
            
            bed_count += 1
            if bed_count >= 2:
                room_idx += 1
                bed_count = 0
                
        return students

    m_students = create_students(MALE_NAMES, "M", male_rooms)
    f_students = create_students(FEMALE_NAMES, "F", female_rooms)
    db.commit()
    
    print("Generating Mock Attendance Records for last 14 days...")
    all_students = m_students + f_students
    today = datetime.now().date()
    
    records_to_insert = []
    for day_offset in range(14):
        target_date = today - timedelta(days=day_offset)
        
        for student in all_students:
            # 80% chance of success, 10% chance of rejected, 10% missed
            r = random.random()
            if r < 0.8:
                status = "SUCCESS"
                rejection_reason = None
            elif r < 0.9:
                status = "REJECTED"
                rejection_reason = "Out of bounds"
            else:
                continue # Missed
                
            # Find allocation
            alloc = db.query(Allocation).filter(Allocation.student_id == student.student_id, Allocation.status == "assigned").first()
            if not alloc:
                continue
                
            room = db.query(Room).filter(Room.room_id == alloc.room_id).first()
            
            occurred_at = datetime.combine(target_date, datetime.min.time()) + timedelta(hours=22, minutes=random.randint(0, 59))
            
            record = AttendanceRecord(
                student_id=student.student_id,
                allocation_id=alloc.allocation_id,
                dorm_id=room.dorm_id,
                attendance_date=target_date,
                attendance_at=occurred_at,
                latitude=LATITUDE,
                longitude=LONGITUDE,
                distance_meters=random.uniform(5.0, 95.0) if status == "SUCCESS" else random.uniform(150.0, 500.0),
                status=status,
                rejection_reason=rejection_reason,
                device_id="mock-device",
                firebase_event_id=f"mock-{student.student_id}-{day_offset}"
            )
            records_to_insert.append(record)
            
    db.add_all(records_to_insert)
    db.commit()
    print("Seeding Complete!")

if __name__ == "__main__":
    run_seed()
