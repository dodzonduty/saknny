from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.attendance_record import AttendanceRecord
from backend.app.models.building import Building
from backend.app.models.room import Room
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log
from backend.app.services.geofence import haversine_distance_meters

router = APIRouter()


class AttendanceCheckInRequest(BaseModel):
    student_id: int
    firebase_uid: str
    latitude: float
    longitude: float
    timestamp: datetime | None = None
    device_id: str | None = None


class DeviceRegisterRequest(BaseModel):
    fcm_token: str
    device_id: str | None = None
    platform: str | None = None


def _local_attendance_date(now_utc: datetime) -> datetime.date:
    timezone_name = settings.UNIVERSITY_TIMEZONE
    local_dt = now_utc.astimezone(ZoneInfo(timezone_name))
    return local_dt.date()


def _record_rejection(
    db: Session,
    current_student,
    payload: AttendanceCheckInRequest,
    reason: str,
    allocation_id: int | None = None,
    dorm_id: int | None = None,
    distance_meters: float | None = None,
) -> None:
    now_utc = datetime.now(timezone.utc)
    record = AttendanceRecord(
        student_id=current_student.student_id,
        allocation_id=allocation_id,
        dorm_id=dorm_id,
        attendance_at=now_utc,
        attendance_date=_local_attendance_date(now_utc),
        client_timestamp=payload.timestamp,
        latitude=payload.latitude,
        longitude=payload.longitude,
        distance_meters=distance_meters,
        status="REJECTED",
        rejection_reason=reason,
        device_id=payload.device_id,
    )
    db.add(record)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=current_student.student_id,
        action="attendance_rejected",
        entity_type="attendance_record",
        entity_id=record.attendance_id,
        after_state={"reason": reason},
    )


@router.post("/devices/register", response_model=APIResponse[dict])
def register_device(
    payload: DeviceRegisterRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    student.fcm_token = payload.fcm_token
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="device_registered",
        entity_type="student",
        entity_id=student.student_id,
        after_state={"has_fcm_token": True, "device_id": payload.device_id, "platform": payload.platform},
    )
    db.commit()
    return success_response({"registered": True})


@router.post("/attendance/check-in", response_model=APIResponse[dict])
def attendance_check_in(
    payload: AttendanceCheckInRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    now_utc = datetime.now(timezone.utc)
    attendance_date = _local_attendance_date(now_utc)

    if payload.student_id != student.student_id:
        _record_rejection(db, student, payload, "Student identity mismatch")
        db.commit()
        return error_response("Student identity mismatch")

    if not student.firebase_uid or student.firebase_uid != payload.firebase_uid:
        _record_rejection(db, student, payload, "Firebase identity mismatch")
        db.commit()
        return error_response("Firebase identity mismatch")

    if payload.latitude < -90 or payload.latitude > 90 or payload.longitude < -180 or payload.longitude > 180:
        _record_rejection(db, student, payload, "Invalid coordinates provided")
        db.commit()
        return error_response("Invalid coordinates provided")

    allocation = (
        db.query(Allocation)
        .filter(
            Allocation.student_id == student.student_id,
            Allocation.status == "assigned",
        )
        .first()
    )
    if not allocation:
        _record_rejection(db, student, payload, "No active allocation found for attendance")
        db.commit()
        return error_response("No active allocation found for attendance")

    duplicate_success = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student.student_id,
            AttendanceRecord.attendance_date == attendance_date,
            AttendanceRecord.status == "SUCCESS",
        )
        .first()
    )
    if duplicate_success:
        _record_rejection(
            db,
            student,
            payload,
            "Attendance already marked for today",
            allocation_id=allocation.allocation_id,
        )
        db.commit()
        return error_response("Attendance already marked for today")

    room = db.query(Room).filter(Room.room_id == allocation.room_id).first()
    building = db.query(Building).filter(Building.dorm_id == room.dorm_id).first() if room else None
    if not building or building.latitude is None or building.longitude is None:
        _record_rejection(
            db,
            student,
            payload,
            "Dorm geolocation is not configured",
            allocation_id=allocation.allocation_id,
            dorm_id=building.dorm_id if building else None,
        )
        db.commit()
        return error_response("Dorm geolocation is not configured")

    distance = haversine_distance_meters(
        float(payload.latitude),
        float(payload.longitude),
        float(building.latitude),
        float(building.longitude),
    )
    if distance > building.allowed_radius_meters:
        _record_rejection(
            db,
            student,
            payload,
            "Outside permitted attendance zone",
            allocation_id=allocation.allocation_id,
            dorm_id=building.dorm_id,
            distance_meters=distance,
        )
        db.commit()
        return error_response("Outside permitted attendance zone")

    record = AttendanceRecord(
        student_id=student.student_id,
        allocation_id=allocation.allocation_id,
        dorm_id=building.dorm_id,
        attendance_at=now_utc,
        attendance_date=attendance_date,
        client_timestamp=payload.timestamp,
        latitude=payload.latitude,
        longitude=payload.longitude,
        distance_meters=distance,
        status="SUCCESS",
        rejection_reason=None,
        device_id=payload.device_id,
    )
    db.add(record)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="attendance_success",
        entity_type="attendance_record",
        entity_id=record.attendance_id,
        after_state={"distance_meters": round(distance, 2), "attendance_date": str(attendance_date)},
    )
    db.commit()
    return success_response(
        {
            "status": "SUCCESS",
            "attendance_id": record.attendance_id,
            "distance_meters": round(distance, 2),
            "attendance_date": str(attendance_date),
        }
    )


@router.get("/attendance/score", response_model=APIResponse[dict])
def attendance_score(db: Session = Depends(get_db), student=Depends(get_current_student)):
    success_count = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student.student_id,
            AttendanceRecord.status == "SUCCESS",
        )
        .count()
    )
    total_attempts = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == student.student_id)
        .count()
    )
    percentage = 0.0
    if total_attempts > 0:
        percentage = round((success_count / total_attempts) * 100, 2)

    latest_success = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student.student_id,
            AttendanceRecord.status == "SUCCESS",
        )
        .order_by(AttendanceRecord.attendance_at.desc())
        .first()
    )
    return success_response(
        {
            "student_id": student.student_id,
            "attendance_percentage": percentage,
            "successful_days": success_count,
            "eligible_days": total_attempts,
            "latest_check_in": latest_success.attendance_at if latest_success else None,
        }
    )


@router.get("/admin/attendance/analytics", response_model=APIResponse[dict])
def attendance_analytics(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    now_utc = datetime.now(timezone.utc)
    today = _local_attendance_date(now_utc)

    today_success_count = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.attendance_date == today,
            AttendanceRecord.status == "SUCCESS",
        )
        .count()
    )
    today_rejected_count = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.attendance_date == today,
            AttendanceRecord.status == "REJECTED",
        )
        .count()
    )

    dorm_rows = (
        db.query(
            Building.dorm_id,
            Building.building_name,
            func.count(case((AttendanceRecord.status == "SUCCESS", 1))).label("success_count"),
            func.count(AttendanceRecord.attendance_id).label("total_count"),
        )
        .join(AttendanceRecord, AttendanceRecord.dorm_id == Building.dorm_id, isouter=True)
        .group_by(Building.dorm_id, Building.building_name)
        .all()
    )
    attendance_by_dorm = []
    for row in dorm_rows:
        percentage = round((row.success_count / row.total_count) * 100, 2) if row.total_count else 0.0
        attendance_by_dorm.append(
            {
                "dorm_id": row.dorm_id,
                "building_name": row.building_name,
                "attendance_percentage": percentage,
            }
        )

    active_allocations = (
        db.query(Allocation.student_id)
        .filter(Allocation.status == "assigned")
        .distinct()
        .count()
    )
    checked_in_students_today = (
        db.query(AttendanceRecord.student_id)
        .filter(
            AttendanceRecord.attendance_date == today,
            AttendanceRecord.status == "SUCCESS",
        )
        .distinct()
        .count()
    )
    absent_students_count = max(active_allocations - checked_in_students_today, 0)

    suspicious_attempts = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.status == "REJECTED",
            AttendanceRecord.rejection_reason.in_(
                [
                    "Outside permitted attendance zone",
                    "Firebase identity mismatch",
                    "Attendance already marked for today",
                ]
            ),
        )
        .count()
    )

    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="attendance_analytics_viewed",
        entity_type="attendance_report",
        after_state={"date": str(today)},
    )
    db.commit()

    return success_response(
        {
            "today_success_count": today_success_count,
            "today_rejected_count": today_rejected_count,
            "attendance_percentage_by_dorm": attendance_by_dorm,
            "absent_students_count": absent_students_count,
            "suspicious_attempts": suspicious_attempts,
        }
    )
