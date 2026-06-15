from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class VerificationHistory(Base):
    __tablename__ = "verification_history"

    history_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    doc_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("verification_documents.doc_id", ondelete="CASCADE"),
        nullable=False,
    )

    actor_role: Mapped[str] = mapped_column(String(20), nullable=False) # 'admin' or 'student'
    actor_id: Mapped[int] = mapped_column(Integer, nullable=False)

    action: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'marked_incomplete', 'resubmitted', 'approved', 'rejected'
    
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    fields_requested: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    fields_updated: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<VerificationHistory(history_id={self.history_id}, doc_id={self.doc_id}, action='{self.action}')>"
