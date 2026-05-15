from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class RoomChangeRequest(Base):
    __tablename__ = "room_change_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending_review', 'approved', 'rejected')",
            name="ck_room_change_requests_status",
        ),
        Index("ix_room_change_requests_student_id", "student_id"),
        Index("ix_room_change_requests_status", "status"),
    )

    request_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    current_room_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rooms.room_id", ondelete="SET NULL"), nullable=True
    )
    target_building_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("buildings.dorm_id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending_review"
    )
    reviewed_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
