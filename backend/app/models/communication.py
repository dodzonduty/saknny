from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Announcement(Base):
    __tablename__ = "announcements"
    __table_args__ = (
        CheckConstraint(
            "target_role IN ('student', 'admin', 'all')", name="ck_announcements_target_role"
        ),
        Index("ix_announcements_is_active", "is_active"),
    )

    announcement_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    target_role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    published_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint("sender_role IN ('student', 'admin')", name="ck_messages_sender_role"),
        CheckConstraint(
            "recipient_role IN ('student', 'admin')", name="ck_messages_recipient_role"
        ),
        Index("ix_messages_sender", "sender_role", "sender_id"),
        Index("ix_messages_recipient", "recipient_role", "recipient_id"),
    )

    message_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sender_role: Mapped[str] = mapped_column(String(20), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, nullable=False)
    recipient_role: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_id: Mapped[int] = mapped_column(Integer, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
