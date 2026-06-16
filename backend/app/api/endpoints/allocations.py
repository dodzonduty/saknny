from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.application import Application
from backend.app.models.building import Building
from backend.app.models.room import Room
from backend.app.models.student import Student
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class AssignAllocationRequest(BaseModel):
    app_id: int
    room_id: int
    plan: str


@router.post("/admin/allocations", response_model=APIResponse[dict])
def assign_bed(
    payload: AssignAllocationRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.plan not in {"breakfast", "full_board"}:
        return error_response("plan must be breakfast or full_board")

    app = db.query(Application).filter(Application.app_id == payload.app_id).first()
    if not app:
        return error_response("Application not found")
    if app.status != "approved":
        return error_response("Application must be approved before allocation")

    student = db.query(Student).filter(Student.student_id == app.student_id).first()
    room = db.query(Room).filter(Room.room_id == payload.room_id).first()
    if not room:
        return error_response("Room not found")
    if room.available_beds <= 0:
        return error_response("No available beds in selected room")

    building = db.query(Building).filter(Building.dorm_id == room.dorm_id).first()
    if building and building.gender_type != student.gender:
        return error_response("Student gender does not match building gender policy")

    existing = db.query(Allocation).filter(Allocation.student_id == student.student_id).first()
    if existing:
        return error_response("Student already has an allocation")

    room.available_beds -= 1
    room.updated_at = datetime.now(timezone.utc)
    allocation = Allocation(
        student_id=student.student_id,
        room_id=room.room_id,
        admin_id=admin.admin_id,
        app_id=app.app_id,
        plan=payload.plan,
        status="assigned",
    )
    db.add(allocation)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="allocation_assigned",
        entity_type="allocation",
        entity_id=allocation.allocation_id,
        after_state={
            "student_id": allocation.student_id,
            "room_id": allocation.room_id,
            "plan": allocation.plan,
        },
    )
    db.commit()
    db.refresh(allocation)
    return success_response({"allocation_id": allocation.allocation_id, "status": allocation.status})


@router.get("/admin/allocations", response_model=APIResponse[dict])
def admin_allocations(
    student_id: int | None = None,
    db: Session = Depends(get_db), 
    _=Depends(get_current_admin)
):
    query = (
        db.query(Allocation, Student, Room, Building)
        .outerjoin(Student, Allocation.student_id == Student.student_id)
        .outerjoin(Room, Allocation.room_id == Room.room_id)
        .outerjoin(Building, Room.dorm_id == Building.dorm_id)
    )
    
    if student_id:
        query = query.filter(Allocation.student_id == student_id)
        
    items = query.order_by(Allocation.assigned_at.desc()).all()
    return success_response(
        {
            "items": [
                {
                    "allocation_id": row.Allocation.allocation_id,
                    "student_id": row.Allocation.student_id,
                    "student_name": row.Student.name if row.Student else None,
                    "room_id": row.Allocation.room_id,
                    "room_number": row.Room.room_number if row.Room else None,
                    "building_name": row.Building.building_name if row.Building else None,
                    "plan": row.Allocation.plan,
                    "status": row.Allocation.status,
                    "assigned_at": row.Allocation.assigned_at,
                }
                for row in items
            ],
            "count": len(items),
        }
    )


@router.get("/allocations/me", response_model=APIResponse[dict])
def my_allocation(db: Session = Depends(get_db), student=Depends(get_current_student)):
    row = (
        db.query(Allocation, Room, Building)
        .outerjoin(Room, Allocation.room_id == Room.room_id)
        .outerjoin(Building, Room.dorm_id == Building.dorm_id)
        .filter(Allocation.student_id == student.student_id, Allocation.status == "assigned")
        .first()
    )
    if not row:
        return success_response({"allocation": None})
    alloc, room, building = row.Allocation, row.Room, row.Building
    return success_response(
        {
            "allocation": {
                "allocation_id": alloc.allocation_id,
                "room_id": alloc.room_id,
                "plan": alloc.plan,
                "status": alloc.status,
                "assigned_at": alloc.assigned_at,
                "room_number": room.room_number if room else None,
                "building_name": building.building_name if building else None,
                "dorm_id": room.dorm_id if room else None,
                "latitude": float(room.latitude) if room and room.latitude is not None else None,
                "longitude": float(room.longitude) if room and room.longitude is not None else None,
                "allowed_radius_meters": room.allowed_radius_meters if room else None,
            }
        }
    )
