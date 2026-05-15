from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class CheckIn(Base):
    __tablename__ = "checkins"
    __table_args__ = (
        CheckConstraint(
            "status IN ('initiated', 'checked_in', 'checked_out')", name="ck_checkins_status"
        ),
        Index("ix_checkins_student_id", "student_id"),
    )

    checkin_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    allocation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("allocations.allocation_id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="initiated")
    key_issued_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    checked_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
