from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.api.deps import get_current_admin
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.building import Building
from backend.app.models.room import Room
from backend.app.models.student import Student
from backend.app.models.attendance_record import AttendanceRecord
from backend.app.schemas.response import APIResponse, success_response

router = APIRouter()

@router.get("/daily", response_model=APIResponse[dict])
def get_daily_report(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    now = datetime.now()
    # If the time is before 22:15, today's attendance window hasn't closed yet. Show yesterday's report.
    if now.hour < 22 or (now.hour == 22 and now.minute <= 15):
        target_date = (now - timedelta(days=1)).date()
    else:
        target_date = now.date()
        
    # Get all active allocations with assigned_at <= target_date
    # We join with Student, Room, Building to get the necessary metadata
    allocations = (
        db.query(Allocation, Student, Room, Building)
        .join(Student, Allocation.student_id == Student.student_id)
        .join(Room, Allocation.room_id == Room.room_id)
        .join(Building, Room.dorm_id == Building.dorm_id)
        .filter(
            Allocation.status == "assigned",
            func.date(Allocation.assigned_at) <= target_date
        )
        .all()
    )
    
    # Get all successful attendance records for this date
    attendances = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.attendance_date == target_date,
            AttendanceRecord.status == "SUCCESS"
        )
        .all()
    )
    
    attended_student_records = {record.student_id: record for record in attendances}
    
    # Aggregate logic
    total_allocated = len(allocations)
    total_attended = 0
    
    building_stats = {}
    room_stats = {}
    students_data = []
    
    for alloc, student, room, building in allocations:
        attendance_record = attended_student_records.get(student.student_id)
        is_attended = attendance_record is not None
        if is_attended:
            total_attended += 1
            
        # Building stats
        if building.dorm_id not in building_stats:
            building_stats[building.dorm_id] = {
                "dorm_id": building.dorm_id,
                "building_name": building.building_name,
                "total": 0,
                "attended": 0
            }
        building_stats[building.dorm_id]["total"] += 1
        if is_attended:
            building_stats[building.dorm_id]["attended"] += 1
            
        # Room stats
        if room.room_id not in room_stats:
            room_stats[room.room_id] = {
                "room_id": room.room_id,
                "room_number": room.room_number,
                "dorm_id": building.dorm_id,
                "total": 0,
                "attended": 0
            }
        room_stats[room.room_id]["total"] += 1
        if is_attended:
            room_stats[room.room_id]["attended"] += 1
            
        # Student list
        students_data.append({
            "student_id": student.student_id,
            "student_name": student.name,
            "room_id": room.room_id,
            "room_number": room.room_number,
            "dorm_id": building.dorm_id,
            "building_name": building.building_name,
            "status": "attended" if is_attended else "missed",
            "attendance_time": attendance_record.attendance_at.isoformat() if is_attended else None
        })
        
    # Calculate rates
    for stat in building_stats.values():
        stat["rate"] = round((stat["attended"] / stat["total"]) * 100, 2) if stat["total"] > 0 else 0.0
        
    for stat in room_stats.values():
        stat["rate"] = round((stat["attended"] / stat["total"]) * 100, 2) if stat["total"] > 0 else 0.0
        
    summary = {
        "target_date": target_date.isoformat(),
        "total_allocated": total_allocated,
        "attended": total_attended,
        "missed": total_allocated - total_attended
    }
    
    return success_response({
        "summary": summary,
        "building_rates": list(building_stats.values()),
        "room_rates": list(room_stats.values()),
        "students": students_data
    })


@router.get("/student-log", response_model=APIResponse[dict])
def get_student_log_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    student_id: Optional[int] = None,
    student_name: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    today = datetime.now().date()
    if end_date is None:
        end_date = today
    if start_date is None:
        start_date = today.replace(day=1)
        
    period_days = (end_date - start_date).days + 1
        
    if not student_id and not student_name:
        return success_response({
            "summary": {
                "period_days": period_days,
                "attended": 0,
                "missed": 0,
                "overall_rate": 0.0
            },
            "logs": []
        })
        
    # Query Active Allocations matching filters
    query = (
        db.query(Allocation, Student, Room, Building)
        .join(Student, Allocation.student_id == Student.student_id)
        .join(Room, Allocation.room_id == Room.room_id)
        .join(Building, Room.dorm_id == Building.dorm_id)
        .filter(Allocation.status == "assigned")
    )
    
    if student_id:
        query = query.filter(Allocation.student_id == student_id)
    if student_name:
        query = query.filter(Student.name.ilike(f"%{student_name}%"))
        
    allocations = query.all()
    
    valid_student_ids = [a[1].student_id for a in allocations]
    
    # Query Successful Attendances in date range
    att_query = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.attendance_date >= start_date,
            AttendanceRecord.attendance_date <= end_date,
            AttendanceRecord.status == "SUCCESS"
        )
    )
    if valid_student_ids:
        att_query = att_query.filter(AttendanceRecord.student_id.in_(valid_student_ids))
    else:
        att_query = att_query.filter(AttendanceRecord.student_id == -1)
        
    attendances = att_query.all()
    
    # Create lookup dict: (student_id, date) -> record
    att_dict = {(r.student_id, r.attendance_date): r for r in attendances}
    
    period_days = (end_date - start_date).days + 1
    total_attended = 0
    
    logs = []
    
    # Generate log for every day in the period
    for alloc, student, room, building in allocations:
        for i in range(period_days):
            current_day = start_date + timedelta(days=i)
            
            # Check if attended
            record = att_dict.get((student.student_id, current_day))
            is_attended = record is not None
            if is_attended:
                total_attended += 1
                
            logs.append({
                "student_name": student.name,
                "student_id": student.student_id,
                "building_name": building.building_name,
                "room_number": room.room_number,
                "day": current_day.isoformat(),
                "attendance_time": record.attendance_at.isoformat() if is_attended else None,
                "status": "attended" if is_attended else "missed"
            })
            
    total_possible = period_days * len(allocations)
    total_missed = total_possible - total_attended
    
    response_data = {
        "summary": {
            "period_days": period_days,
            "attended": total_attended,
            "missed": total_missed,
            "overall_rate": round((total_attended / total_possible) * 100, 2) if total_possible > 0 else 0.0
        },
        "logs": logs
    }
    
    return success_response(response_data)
