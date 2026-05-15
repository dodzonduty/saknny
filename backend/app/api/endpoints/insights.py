from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin
from backend.app.core.database import get_db
from backend.app.models.allocation import Allocation
from backend.app.models.application import Application
from backend.app.models.audit_log import AuditLog
from backend.app.models.maintenance_ticket import MaintenanceTicket
from backend.app.models.payment_intent import PaymentIntent
from backend.app.models.room import Room
from backend.app.schemas.response import APIResponse, success_response

router = APIRouter()


@router.get("/admin/analytics/dashboard", response_model=APIResponse[dict])
def analytics_dashboard(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total_rooms = db.query(Room).count()
    total_available_beds = db.query(func.coalesce(func.sum(Room.available_beds), 0)).scalar() or 0
    total_beds = db.query(func.coalesce(func.sum(Room.total_beds), 0)).scalar() or 0
    occupancy_rate = 0.0
    if total_beds:
        occupancy_rate = round(((total_beds - total_available_beds) / total_beds) * 100, 2)

    application_breakdown = {
        status: count
        for status, count in db.query(Application.status, func.count(Application.app_id))
        .group_by(Application.status)
        .all()
    }
    payment_breakdown = {
        status: count
        for status, count in db.query(PaymentIntent.status, func.count(PaymentIntent.payment_id))
        .group_by(PaymentIntent.status)
        .all()
    }
    ticket_breakdown = {
        status: count
        for status, count in db.query(MaintenanceTicket.status, func.count(MaintenanceTicket.ticket_id))
        .group_by(MaintenanceTicket.status)
        .all()
    }
    return success_response(
        {
            "occupancy_rate": occupancy_rate,
            "total_rooms": total_rooms,
            "total_beds": int(total_beds),
            "total_available_beds": int(total_available_beds),
            "applications": application_breakdown,
            "payments": payment_breakdown,
            "tickets": ticket_breakdown,
            "active_allocations": db.query(Allocation).filter(Allocation.status == "assigned").count(),
        }
    )


@router.get("/admin/audit/logs", response_model=APIResponse[dict])
def audit_logs(
    action: str | None = None,
    entity_type: str | None = None,
    actor_role: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if actor_role:
        query = query.filter(AuditLog.actor_role == actor_role)
    rows = query.order_by(AuditLog.created_at.desc()).limit(500).all()
    return success_response(
        {
            "items": [
                {
                    "audit_id": row.audit_id,
                    "actor_role": row.actor_role,
                    "actor_id": row.actor_id,
                    "action": row.action,
                    "entity_type": row.entity_type,
                    "entity_id": row.entity_id,
                    "before_state": row.before_state,
                    "after_state": row.after_state,
                    "created_at": row.created_at,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )
