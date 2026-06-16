from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.lease import Lease
from backend.app.models.student import Student
from backend.app.models.room import Room
from backend.app.models.building import Building
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class IssueLeaseRequest(BaseModel):
    allocation_id: int
    expires_at: datetime | None = None


@router.post("/admin/contracts/leases", response_model=APIResponse[dict])
def issue_lease(
    payload: IssueLeaseRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    allocation = db.query(Allocation).filter(Allocation.allocation_id == payload.allocation_id).first()
    if not allocation:
        return error_response("Allocation not found")
    if allocation.status != "assigned":
        return error_response("Lease can only be issued for assigned allocations")

    existing = db.query(Lease).filter(Lease.allocation_id == allocation.allocation_id).first()
    if existing:
        return error_response("Lease already issued for allocation")

    lease = Lease(
        allocation_id=allocation.allocation_id,
        student_id=allocation.student_id,
        admin_id=admin.admin_id,
        status="pending_signature",
        expires_at=payload.expires_at,
        document_url=f"leases/{allocation.student_id}_{allocation.allocation_id}.pdf",
    )
    db.add(lease)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="lease_issued",
        entity_type="lease",
        entity_id=lease.lease_id,
        after_state={"status": lease.status},
    )
    db.commit()
    db.refresh(lease)
    return success_response({"lease_id": lease.lease_id, "status": lease.status})


@router.get("/admin/contracts/leases", response_model=APIResponse[dict])
def admin_leases(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    items = (
        db.query(Lease, Allocation, Student, Room, Building)
        .outerjoin(Allocation, Lease.allocation_id == Allocation.allocation_id)
        .outerjoin(Student, Lease.student_id == Student.student_id)
        .outerjoin(Room, Allocation.room_id == Room.room_id)
        .outerjoin(Building, Room.dorm_id == Building.dorm_id)
        .order_by(Lease.issued_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "lease_id": row.Lease.lease_id,
                    "allocation_id": row.Lease.allocation_id,
                    "student_id": row.Lease.student_id,
                    "student_name": row.Student.name if row.Student else None,
                    "room_id": row.Allocation.room_id if row.Allocation else None,
                    "room_number": row.Room.room_number if row.Room else None,
                    "building_name": row.Building.building_name if row.Building else None,
                    "status": row.Lease.status,
                    "document_url": row.Lease.document_url,
                    "issued_at": row.Lease.issued_at,
                    "expires_at": row.Lease.expires_at,
                    "signed_at": row.Lease.signed_at,
                }
                for row in items
            ],
            "count": len(items),
        }
    )


@router.get("/contracts/leases/me", response_model=APIResponse[dict])
def my_leases(db: Session = Depends(get_db), student=Depends(get_current_student)):
    items = (
        db.query(Lease)
        .filter(Lease.student_id == student.student_id)
        .order_by(Lease.issued_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "lease_id": lease.lease_id,
                    "status": lease.status,
                    "document_url": lease.document_url,
                    "issued_at": lease.issued_at,
                    "expires_at": lease.expires_at,
                    "signed_at": lease.signed_at,
                }
                for lease in items
            ],
            "count": len(items),
        }
    )


@router.put("/contracts/leases/{lease_id}/sign", response_model=APIResponse[dict])
def sign_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    lease = (
        db.query(Lease)
        .filter(Lease.lease_id == lease_id, Lease.student_id == student.student_id)
        .first()
    )
    if not lease:
        return error_response("Lease not found")
    if lease.status != "pending_signature":
        return error_response("Lease is not pending signature")

    lease.status = "signed"
    lease.signed_at = datetime.now(timezone.utc)
    lease.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="lease_signed",
        entity_type="lease",
        entity_id=lease.lease_id,
        after_state={"status": lease.status},
    )
    db.commit()
    return success_response({"lease_id": lease.lease_id, "status": lease.status})


@router.post("/admin/contracts/leases/{lease_id}/expire", response_model=APIResponse[dict])
def expire_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        return error_response("Lease not found")

    lease.status = "expired"
    lease.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="lease_expired",
        entity_type="lease",
        entity_id=lease.lease_id,
        after_state={"status": lease.status},
    )
    db.commit()
    return success_response({"lease_id": lease.lease_id, "status": lease.status})
