from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Building(Base):
    __tablename__ = "buildings"
    __table_args__ = (
        CheckConstraint("gender_type IN ('M', 'F')", name="ck_buildings_gender_type"),
        CheckConstraint(
            "status IN ('active', 'maintenance', 'inactive')",
            name="ck_buildings_status",
        ),
    )

    dorm_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    building_name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender_type: Mapped[str] = mapped_column(String(1), nullable=False)
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
