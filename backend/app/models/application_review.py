from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class ApplicationReview(Base):
    __tablename__ = "application_reviews"
    __table_args__ = (
        Index("ix_application_reviews_app_id", "app_id"),
        Index("ix_application_reviews_admin_id", "admin_id"),
    )

    review_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    app_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("applications.app_id", ondelete="CASCADE"), nullable=False
    )
    admin_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="CASCADE"), nullable=False
    )
    review_action: Mapped[str] = mapped_column(String(50), nullable=False)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
