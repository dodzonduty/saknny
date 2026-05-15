from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    CheckConstraint,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"
    __table_args__ = (
        UniqueConstraint("dorm_id", "room_number", name="uq_rooms_dorm_room_number"),
        CheckConstraint("total_beds > 0", name="ck_rooms_total_beds_positive"),
        CheckConstraint(
            "available_beds >= 0 AND available_beds <= total_beds",
            name="ck_rooms_available_beds_range",
        ),
        CheckConstraint(
            "status IN ('active', 'maintenance', 'inactive')", name="ck_rooms_status"
        ),
        Index("ix_rooms_dorm_id", "dorm_id"),
    )

    room_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dorm_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("buildings.dorm_id", ondelete="CASCADE"), nullable=False
    )
    room_number: Mapped[str] = mapped_column(String(20), nullable=False)
    total_beds: Mapped[int] = mapped_column(Integer, nullable=False)
    available_beds: Mapped[int] = mapped_column(Integer, nullable=False)
    dominant_preferences: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
