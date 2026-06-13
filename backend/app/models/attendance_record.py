from datetime import date, datetime, timezone

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Boolean,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        CheckConstraint(
            "status IN ('SUCCESS', 'REJECTED')",
            name="ck_attendance_records_status",
        ),
        Index("ix_attendance_records_student_id", "student_id"),
        Index("ix_attendance_records_attendance_date", "attendance_date"),
        Index("ix_attendance_records_status", "status"),
        Index("ix_attendance_records_rejection_reason", "rejection_reason"),
    )

    attendance_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.student_id", ondelete="CASCADE"),
        nullable=False,
    )
    allocation_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("allocations.allocation_id", ondelete="SET NULL"),
        nullable=True,
    )
    dorm_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("buildings.dorm_id", ondelete="SET NULL"),
        nullable=True,
    )
    attendance_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False)
    client_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    distance_meters: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    firebase_event_id: Mapped[str | None] = mapped_column(String(36), unique=True, nullable=True)
    biometric_verified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
