import logging
from datetime import datetime
from typing import Callable

from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.attendance_record import AttendanceRecord
from backend.app.models.audit_log import AuditLog
from backend.app.models.student import Student

logger = logging.getLogger(__name__)


def handle_attendance_check_in(event_doc: dict, db: Session) -> tuple[str, int | None]:
    event_id = event_doc.get("event_id")
    student_id = event_doc.get("student_id")
    payload = event_doc.get("payload", {})
    
    # Idempotency check
    existing = db.query(AttendanceRecord).filter(AttendanceRecord.firebase_event_id == event_id).first()
    if existing:
        logger.info(f"AttendanceRecord for event {event_id} already exists (ID: {existing.attendance_id})")
        return "attendance_record", existing.attendance_id

    # Create new record
    dt_str = payload.get("attendance_date")
    attendance_date = datetime.strptime(dt_str, "%Y-%m-%d").date() if dt_str else datetime.now().date()
    
    # Async Race Condition Check: Prevent UniqueViolation if multiple SUCCESS events were queued
    if payload.get("status") == "SUCCESS":
        existing_success = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.attendance_date == attendance_date,
            AttendanceRecord.status == "SUCCESS"
        ).first()
        if existing_success:
            logger.warning(f"Student {student_id} already has a SUCCESS record for {attendance_date}. Ignoring duplicate event {event_id}.")
            return "attendance_record", existing_success.attendance_id
    
    record = AttendanceRecord(
        student_id=student_id,
        allocation_id=payload.get("allocation_id"),
        dorm_id=payload.get("dorm_id"),
        attendance_at=event_doc.get("occurred_at"),
        attendance_date=attendance_date,
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
        distance_meters=payload.get("distance_meters"),
        status=payload.get("status"),
        rejection_reason=payload.get("rejection_reason"),
        device_id=event_doc.get("device_id"),
        firebase_event_id=event_id,
        biometric_verified=payload.get("biometric_verified"),
    )
    db.add(record)
    db.flush()
    return "attendance_record", record.attendance_id


def handle_biometric_unlock(event_doc: dict, db: Session) -> tuple[str, int | None]:
    event_id = event_doc.get("event_id")
    student_id = event_doc.get("student_id")
    
    # Using JSON casting might differ by DB, so let's just do a simple check 
    # Or ideally we should have a `firebase_event_id` on audit logs but we don't.
    # We can store event_id in after_state.
    # To keep idempotency simple, check if audit log exists with this event_id in after_state
    
    # We will just write the audit log. For exact idempotency on JSON we'd need a specific query.
    # Let's do a basic check by action and actor_id within a short time frame, or skip exact idempotency for audit_logs for now
    # Wait, we can query jsonb:
    # However we don't know if it's json or jsonb.
    # We can just insert. Audit logs duplicate is less harmful, but let's try to avoid if possible.
    
    log = AuditLog(
        actor_role="student",
        actor_id=student_id,
        action="biometric_unlock",
        entity_type="mobile_event",
        after_state={"firebase_event_id": event_id, "payload": event_doc.get("payload")},
    )
    db.add(log)
    db.flush()
    return "audit_log", log.audit_id


def handle_device_registered(event_doc: dict, db: Session) -> tuple[str, int | None]:
    event_id = event_doc.get("event_id")
    student_id = event_doc.get("student_id")
    payload = event_doc.get("payload", {})
    device_id = event_doc.get("device_id")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if student:
        student.trusted_device_id = device_id
        student.trusted_device_registered_at = event_doc.get("occurred_at")
        student.fcm_token = payload.get("fcm_token")
        
        log = AuditLog(
            actor_role="student",
            actor_id=student_id,
            action="device_registered_sync",
            entity_type="student",
            entity_id=student_id,
            after_state={"firebase_event_id": event_id, "device_id": device_id},
        )
        db.add(log)
        db.flush()
        return "student", student.student_id
    return "student", None


def handle_session_event(event_doc: dict, db: Session) -> tuple[str, int | None]:
    event_id = event_doc.get("event_id")
    student_id = event_doc.get("student_id")
    event_type = event_doc.get("event_type")
    
    log = AuditLog(
        actor_role="student",
        actor_id=student_id,
        action=event_type,
        entity_type="mobile_session",
        after_state={"firebase_event_id": event_id},
    )
    db.add(log)
    db.flush()
    return "audit_log", log.audit_id


HANDLER_REGISTRY: dict[str, Callable[[dict, Session], tuple[str, int | None]]] = {
    "attendance_check_in": handle_attendance_check_in,
    "biometric_unlock": handle_biometric_unlock,
    "device_registered": handle_device_registered,
    "session_restored": handle_session_event,
    "firebase_token_refreshed": handle_session_event,
}
