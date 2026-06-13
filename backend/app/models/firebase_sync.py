from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class FirebaseSyncCursor(Base):
    __tablename__ = "firebase_sync_cursors"

    cursor_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    last_processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class FirebaseSyncFailure(Base):
    __tablename__ = "firebase_sync_failures"

    failure_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
