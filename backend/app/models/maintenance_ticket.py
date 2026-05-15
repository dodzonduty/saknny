from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"
    __table_args__ = (
        CheckConstraint(
            "priority IN ('low', 'medium', 'high', 'urgent')", name="ck_maintenance_priority"
        ),
        CheckConstraint(
            "status IN ('open', 'assigned', 'in_progress', 'resolved', 'escalated')",
            name="ck_maintenance_status",
        ),
        Index("ix_maintenance_tickets_student_id", "student_id"),
        Index("ix_maintenance_tickets_status", "status"),
    )

    ticket_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    room_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rooms.room_id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    assigned_admin_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True
    )
    escalation_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
