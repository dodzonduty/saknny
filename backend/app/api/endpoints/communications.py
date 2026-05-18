from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_user
from backend.app.core.database import get_db
from backend.app.models.communication import Announcement, Message
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import get_actor_identity, write_audit_log

router = APIRouter()


class SendMessageRequest(BaseModel):
    recipient_role: str
    recipient_id: int
    body: str


class AnnouncementRequest(BaseModel):
    title: str
    content: str
    target_role: str = "student"


@router.post("/messages", response_model=APIResponse[dict])
def send_message(
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sender_role, sender_id = get_actor_identity(current_user)
    if payload.recipient_role not in {"student", "admin"}:
        return error_response("recipient_role must be student or admin")

    msg = Message(
        sender_role=sender_role,
        sender_id=sender_id,
        recipient_role=payload.recipient_role,
        recipient_id=payload.recipient_id,
        body=payload.body,
    )
    db.add(msg)
    db.flush()
    write_audit_log(
        db=db,
        actor_role=sender_role,
        actor_id=sender_id,
        action="message_sent",
        entity_type="message",
        entity_id=msg.message_id,
        after_state={"recipient_role": msg.recipient_role, "recipient_id": msg.recipient_id},
    )
    db.commit()
    db.refresh(msg)
    return success_response({"message_id": msg.message_id, "created_at": msg.created_at})


@router.get("/messages", response_model=APIResponse[dict])
def list_messages(
    with_role: str | None = None,
    with_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role, actor_id = get_actor_identity(current_user)
    query = db.query(Message).filter(
        or_(
            (Message.sender_role == role) & (Message.sender_id == actor_id),
            (Message.recipient_role == role) & (Message.recipient_id == actor_id),
        )
    )
    if with_role is not None and with_id is not None:
        query = query.filter(
            or_(
                (Message.sender_role == with_role) & (Message.sender_id == with_id),
                (Message.recipient_role == with_role) & (Message.recipient_id == with_id),
            )
        )
    rows = query.order_by(Message.created_at.desc()).limit(100).all()
    return success_response(
        {
            "items": [
                {
                    "message_id": row.message_id,
                    "sender_role": row.sender_role,
                    "sender_id": row.sender_id,
                    "recipient_role": row.recipient_role,
                    "recipient_id": row.recipient_id,
                    "body": row.body,
                    "created_at": row.created_at,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )


@router.post("/admin/announcements", response_model=APIResponse[dict])
def publish_announcement(
    payload: AnnouncementRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.target_role not in {"student", "admin", "all"}:
        return error_response("target_role must be student, admin, or all")
    ann = Announcement(
        title=payload.title,
        content=payload.content,
        target_role=payload.target_role,
        published_by=admin.admin_id,
    )
    db.add(ann)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="announcement_published",
        entity_type="announcement",
        entity_id=ann.announcement_id,
        after_state={"target_role": ann.target_role},
    )
    db.commit()
    db.refresh(ann)
    return success_response({"announcement_id": ann.announcement_id, "published_at": ann.published_at})


@router.get("/notifications/count", response_model=APIResponse[dict])
def notification_count(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    role, actor_id = get_actor_identity(current_user)
    unread_messages = db.query(Message).filter(
        Message.recipient_role == role,
        Message.recipient_id == actor_id,
        Message.is_read.is_(False),
    ).count()
    announcements = db.query(Announcement).filter(
        Announcement.is_active.is_(True),
        Announcement.target_role.in_([role, "all"]),
    ).count()
    return success_response({
        "unread_messages": unread_messages,
        "announcements": announcements,
        "total": unread_messages + announcements,
    })


@router.get("/announcements", response_model=APIResponse[dict])
def list_announcements(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    role, _ = get_actor_identity(current_user)
    rows = (
        db.query(Announcement)
        .filter(
            Announcement.is_active.is_(True),
            Announcement.target_role.in_([role, "all"]),
        )
        .order_by(Announcement.published_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "announcement_id": row.announcement_id,
                    "title": row.title,
                    "content": row.content,
                    "target_role": row.target_role,
                    "published_at": row.published_at,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )
