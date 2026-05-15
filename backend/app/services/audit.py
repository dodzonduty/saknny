from sqlalchemy.orm import Session

from backend.app.models.audit_log import AuditLog


def get_actor_identity(current_user) -> tuple[str, int | None]:
    role = getattr(current_user, "role_type", "system")
    if role == "student":
        return role, getattr(current_user, "student_id", None)
    if role == "admin":
        return role, getattr(current_user, "admin_id", None)
    return "system", None


def write_audit_log(
    db: Session,
    actor_role: str,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    before_state: dict | None = None,
    after_state: dict | None = None,
) -> None:
    entry = AuditLog(
        actor_role=actor_role,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
    )
    db.add(entry)
