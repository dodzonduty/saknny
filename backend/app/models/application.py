from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint(
            "status IN ('submitted', 'under_review', 'approved', 'rejected', 'waitlisted')",
            name="ck_applications_status",
        ),
        Index("ix_applications_student_id", "student_id"),
        Index("ix_applications_status", "status"),
    )

    app_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    preferred_dorm_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("buildings.dorm_id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="submitted")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    waitlist_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    submission_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
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
