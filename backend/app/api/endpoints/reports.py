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
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    if target_date is None:
        target_date = datetime.now().date()
        
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
    
    attended_student_ids = {record.student_id for record in attendances}
    
    # Aggregate logic
    total_allocated = len(allocations)
    total_attended = 0
    
    building_stats = {}
    room_stats = {}
    students_data = []
    
    for alloc, student, room, building in allocations:
        is_attended = student.student_id in attended_student_ids
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
            "status": "attended" if is_attended else "missed"
        })
        
    # Calculate rates
    for stat in building_stats.values():
        stat["rate"] = round((stat["attended"] / stat["total"]) * 100, 2) if stat["total"] > 0 else 0.0
        
    for stat in room_stats.values():
        stat["rate"] = round((stat["attended"] / stat["total"]) * 100, 2) if stat["total"] > 0 else 0.0
        
    summary = {
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


@router.get("/custom", response_model=APIResponse[dict])
def get_custom_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    student_id: Optional[int] = None,
    dorm_id: Optional[int] = None,
    room_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    today = datetime.now().date()
    if end_date is None:
        end_date = today
    if start_date is None:
        start_date = today.replace(day=1)
        
    # Query Active Allocations matching filters
    query = (
        db.query(Allocation)
        .join(Room, Allocation.room_id == Room.room_id)
        .filter(Allocation.status == "assigned")
    )
    
    if student_id:
        query = query.filter(Allocation.student_id == student_id)
    if room_id:
        query = query.filter(Allocation.room_id == room_id)
    if dorm_id:
        query = query.filter(Room.dorm_id == dorm_id)
        
    allocations = query.all()
    
    # Calculate Total Possible Attendances
    total_possible = 0
    student_total_days = 0
    student_alloc_student_id = None
    
    for alloc in allocations:
        alloc_start = alloc.assigned_at.date()
        valid_start = max(start_date, alloc_start)
        valid_end = min(end_date, today)
        
        if valid_start <= valid_end:
            days = (valid_end - valid_start).days + 1
            total_possible += days
            if student_id and alloc.student_id == student_id:
                student_total_days += days
                student_alloc_student_id = alloc.student_id

    # Query Successful Attendances in date range
    att_query = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.attendance_date >= start_date,
            AttendanceRecord.attendance_date <= end_date,
            AttendanceRecord.status == "SUCCESS"
        )
    )
    
    if student_id:
        att_query = att_query.filter(AttendanceRecord.student_id == student_id)
    else:
        # Filter attendance by the students who match the dorm/room criteria
        valid_student_ids = [a.student_id for a in allocations]
        if valid_student_ids:
            att_query = att_query.filter(AttendanceRecord.student_id.in_(valid_student_ids))
        else:
            # No valid students, so no attendance
            att_query = att_query.filter(AttendanceRecord.student_id == -1)
            
    total_attended = att_query.count()
    total_missed = max(0, total_possible - total_attended)
    
    response_data = {
        "summary": {
            "total_possible": total_possible,
            "attended": total_attended,
            "missed": total_missed,
            "overall_rate": round((total_attended / total_possible) * 100, 2) if total_possible > 0 else 0.0
        }
    }
    
    if student_id:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        response_data["student_breakdown"] = {
            "student_id": student_id,
            "name": student.name if student else None,
            "attended_days": total_attended,
            "missed_days": max(0, student_total_days - total_attended),
            "total_days": student_total_days
        }
        
    return success_response(response_data)
