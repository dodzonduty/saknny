from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class PaymentIntent(Base):
    __tablename__ = "payment_intents"
    __table_args__ = (
        CheckConstraint(
            "payment_type IN ('deposit', 'rent', 'refund')", name="ck_payment_intents_type"
        ),
        CheckConstraint(
            "status IN ('initiated', 'paid', 'failed', 'refunded')",
            name="ck_payment_intents_status",
        ),
        CheckConstraint("amount >= 0", name="ck_payment_intents_amount_non_negative"),
        Index("ix_payment_intents_student_id", "student_id"),
        Index("ix_payment_intents_lease_id", "lease_id"),
    )

    payment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    lease_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("leases.lease_id", ondelete="SET NULL"), nullable=True
    )
    payment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="EGP")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="initiated")
    gateway_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
