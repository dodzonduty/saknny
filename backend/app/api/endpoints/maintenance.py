from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.maintenance_ticket import MaintenanceTicket
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class CreateTicketRequest(BaseModel):
    title: str
    description: str
    priority: str = "medium"


class AssignTicketRequest(BaseModel):
    assigned_admin_id: int | None = None
    status: str


class EscalateTicketRequest(BaseModel):
    reason: str


@router.post("/maintenance/tickets", response_model=APIResponse[dict])
def create_ticket(
    payload: CreateTicketRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    if payload.priority not in {"low", "medium", "high", "urgent"}:
        return error_response("Invalid ticket priority")

    allocation = db.query(Allocation).filter(Allocation.student_id == student.student_id).first()
    ticket = MaintenanceTicket(
        student_id=student.student_id,
        room_id=allocation.room_id if allocation else None,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="open",
    )
    db.add(ticket)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="maintenance_ticket_created",
        entity_type="maintenance_ticket",
        entity_id=ticket.ticket_id,
        after_state={"status": ticket.status, "priority": ticket.priority},
    )
    db.commit()
    db.refresh(ticket)
    return success_response({"ticket_id": ticket.ticket_id, "status": ticket.status})


@router.get("/maintenance/tickets/me", response_model=APIResponse[dict])
def my_tickets(db: Session = Depends(get_db), student=Depends(get_current_student)):
    rows = (
        db.query(MaintenanceTicket)
        .filter(MaintenanceTicket.student_id == student.student_id)
        .order_by(MaintenanceTicket.created_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "ticket_id": row.ticket_id,
                    "title": row.title,
                    "status": row.status,
                    "priority": row.priority,
                    "created_at": row.created_at,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )


@router.get("/admin/maintenance/tickets", response_model=APIResponse[dict])
def admin_tickets(
    status: str = "open",
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    rows = (
        db.query(MaintenanceTicket)
        .filter(MaintenanceTicket.status == status)
        .order_by(MaintenanceTicket.created_at.asc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "ticket_id": row.ticket_id,
                    "student_id": row.student_id,
                    "room_id": row.room_id,
                    "status": row.status,
                    "priority": row.priority,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )


@router.put("/admin/maintenance/tickets/{ticket_id}/assign", response_model=APIResponse[dict])
def assign_ticket(
    ticket_id: int,
    payload: AssignTicketRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.status not in {"assigned", "in_progress", "resolved"}:
        return error_response("Invalid ticket status")

    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.ticket_id == ticket_id).first()
    if not ticket:
        return error_response("Ticket not found")

    before = {"status": ticket.status, "assigned_admin_id": ticket.assigned_admin_id}
    ticket.status = payload.status
    if payload.assigned_admin_id is not None:
        ticket.assigned_admin_id = payload.assigned_admin_id
    if payload.status == "resolved":
        ticket.resolved_at = datetime.now(timezone.utc)
    ticket.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="maintenance_ticket_updated",
        entity_type="maintenance_ticket",
        entity_id=ticket.ticket_id,
        before_state=before,
        after_state={"status": ticket.status, "assigned_admin_id": ticket.assigned_admin_id},
    )
    db.commit()
    return success_response({"ticket_id": ticket.ticket_id, "status": ticket.status})


@router.post("/admin/maintenance/tickets/{ticket_id}/escalate", response_model=APIResponse[dict])
def escalate_ticket(
    ticket_id: int,
    payload: EscalateTicketRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.ticket_id == ticket_id).first()
    if not ticket:
        return error_response("Ticket not found")

    ticket.status = "escalated"
    ticket.escalation_reason = payload.reason
    ticket.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="maintenance_ticket_escalated",
        entity_type="maintenance_ticket",
        entity_id=ticket.ticket_id,
        after_state={"status": ticket.status, "reason": payload.reason},
    )
    db.commit()
    return success_response({"ticket_id": ticket.ticket_id, "status": ticket.status})
