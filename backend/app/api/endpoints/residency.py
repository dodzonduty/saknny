from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.checkin import CheckIn
from backend.app.models.room_change_request import RoomChangeRequest
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class RoomChangeRequestPayload(BaseModel):
    target_building_id: int | None = None
    reason: str


class RoomChangeReviewPayload(BaseModel):
    status: str


@router.post("/checkins/initiate", response_model=APIResponse[dict])
def initiate_checkin(db: Session = Depends(get_db), student=Depends(get_current_student)):
    allocation = (
        db.query(Allocation)
        .filter(Allocation.student_id == student.student_id, Allocation.status == "assigned")
        .first()
    )
    if not allocation:
        return error_response("No active allocation found")

    existing = (
        db.query(CheckIn)
        .filter(CheckIn.student_id == student.student_id, CheckIn.status != "checked_out")
        .first()
    )
    if existing:
        return error_response("Check-in already initiated")

    record = CheckIn(student_id=student.student_id, allocation_id=allocation.allocation_id)
    db.add(record)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="checkin_initiated",
        entity_type="checkin",
        entity_id=record.checkin_id,
        after_state={"status": record.status},
    )
    db.commit()
    db.refresh(record)
    return success_response({"checkin_id": record.checkin_id, "status": record.status})


@router.put("/admin/checkins/{checkin_id}/issue-key", response_model=APIResponse[dict])
def issue_key(
    checkin_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    checkin = db.query(CheckIn).filter(CheckIn.checkin_id == checkin_id).first()
    if not checkin:
        return error_response("Check-in record not found")

    checkin.status = "checked_in"
    checkin.key_issued_by = admin.admin_id
    checkin.checked_in_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="checkin_key_issued",
        entity_type="checkin",
        entity_id=checkin.checkin_id,
        after_state={"status": checkin.status},
    )
    db.commit()
    return success_response({"checkin_id": checkin.checkin_id, "status": checkin.status})


@router.post("/lifecycle/room-change", response_model=APIResponse[dict])
def request_room_change(
    payload: RoomChangeRequestPayload,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    allocation = (
        db.query(Allocation)
        .filter(Allocation.student_id == student.student_id, Allocation.status == "assigned")
        .first()
    )
    request = RoomChangeRequest(
        student_id=student.student_id,
        current_room_id=allocation.room_id if allocation else None,
        target_building_id=payload.target_building_id,
        reason=payload.reason,
    )
    db.add(request)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="room_change_requested",
        entity_type="room_change_request",
        entity_id=request.request_id,
        after_state={"status": request.status},
    )
    db.commit()
    db.refresh(request)
    return success_response({"request_id": request.request_id, "status": request.status})


@router.get("/admin/lifecycle/room-change", response_model=APIResponse[dict])
def admin_room_change_list(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    rows = (
        db.query(RoomChangeRequest)
        .order_by(RoomChangeRequest.created_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "request_id": row.request_id,
                    "student_id": row.student_id,
                    "current_room_id": row.current_room_id,
                    "target_building_id": row.target_building_id,
                    "status": row.status,
                    "reason": row.reason,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )


@router.put("/admin/lifecycle/room-change/{request_id}/review", response_model=APIResponse[dict])
def review_room_change(
    request_id: int,
    payload: RoomChangeReviewPayload,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.status not in {"approved", "rejected"}:
        return error_response("status must be approved or rejected")

    row = db.query(RoomChangeRequest).filter(RoomChangeRequest.request_id == request_id).first()
    if not row:
        return error_response("Room change request not found")

    row.status = payload.status
    row.reviewed_by = admin.admin_id
    row.reviewed_at = datetime.now(timezone.utc)
    row.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="room_change_reviewed",
        entity_type="room_change_request",
        entity_id=row.request_id,
        after_state={"status": row.status},
    )
    db.commit()
    return success_response({"request_id": row.request_id, "status": row.status})


@router.post("/lifecycle/checkout", response_model=APIResponse[dict])
def initiate_checkout(db: Session = Depends(get_db), student=Depends(get_current_student)):
    record = (
        db.query(CheckIn)
        .filter(CheckIn.student_id == student.student_id, CheckIn.status == "checked_in")
        .first()
    )
    if not record:
        return error_response("No active check-in found")

    record.status = "checked_out"
    record.checked_out_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="checkout_initiated",
        entity_type="checkin",
        entity_id=record.checkin_id,
        after_state={"status": record.status},
    )
    db.commit()
    return success_response({"checkin_id": record.checkin_id, "status": record.status})
