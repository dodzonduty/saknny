"""
Saknny – Verification Document Model (Role A: Data Layer)

Tracks documents uploaded by students for identity / enrollment verification.
Admins review these documents and approve or reject them before setting
the student's enroll_status to TRUE.

Workflow (from Report Event Tables):
    1. Student uploads college ID image  →  row inserted, status = 'pending'
    2. System may auto-flag suspicious uploads  →  is_flagged = True
    3. Admin reviews document  →  status = 'approved' / 'rejected'
    4. Once all docs approved  →  Admin sets students.enroll_status = TRUE

File storage: Filesystem (uploads/verification_docs/<student_id>/<filename>)
The file_path column stores the relative path from the project root.
"""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    # ── Primary Key ───────────────────────────────────────────────────
    doc_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── Ownership ─────────────────────────────────────────────────────
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.student_id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Document Info ─────────────────────────────────────────────────
    # e.g. "college_id", "enrollment_letter", "national_id"
    doc_type: Mapped[str] = mapped_column(String(30), nullable=False)

    # Relative path: uploads/verification_docs/<student_id>/<filename>
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)

    # Original filename the student uploaded (for display purposes)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Review Workflow ───────────────────────────────────────────────
    # 'pending' → 'approved' / 'rejected'
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    # Admin who reviewed this document (NULL until reviewed)
    reviewed_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("admins.admin_id", ondelete="SET NULL"),
        nullable=True,
    )

    # When the review decision was made
    review_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Reason for rejection (NULL if approved or still pending)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # JSON list of fields the admin requested the student to edit
    fields_to_edit: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # JSON list of fields the student actually updated
    fields_updated: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # ── Fraud Detection ───────────────────────────────────────────────
    # System (Policy Engine) can flag suspicious uploads for priority review
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    flag_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # ── Audit Timestamps ──────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<VerificationDocument(doc_id={self.doc_id}, student_id={self.student_id}, "
            f"doc_type='{self.doc_type}', status='{self.status}')>"
        )
