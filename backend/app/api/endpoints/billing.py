from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.lease import Lease
from backend.app.models.payment_intent import PaymentIntent
from backend.app.models.student import Student
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class InitiatePaymentRequest(BaseModel):
    lease_id: int | None = None
    amount: float
    payment_type: str


class ConfirmPaymentRequest(BaseModel):
    status: str


class RefundPaymentRequest(BaseModel):
    approved: bool


@router.post("/billing/payments/initiate", response_model=APIResponse[dict])
def initiate_payment(
    payload: InitiatePaymentRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    if payload.payment_type not in {"deposit", "rent"}:
        return error_response("payment_type must be deposit or rent")
    if payload.amount < 0:
        return error_response("amount must be non-negative")

    if payload.lease_id is not None:
        lease = db.query(Lease).filter(Lease.lease_id == payload.lease_id).first()
        if not lease or lease.student_id != student.student_id:
            return error_response("Lease not found for student")

    payment = PaymentIntent(
        student_id=student.student_id,
        lease_id=payload.lease_id,
        payment_type=payload.payment_type,
        amount=payload.amount,
        status="initiated",
        gateway_ref=f"sim_{uuid.uuid4().hex[:16]}",
    )
    db.add(payment)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="payment_initiated",
        entity_type="payment_intent",
        entity_id=payment.payment_id,
        after_state={"status": payment.status, "amount": float(payment.amount)},
    )
    db.commit()
    db.refresh(payment)
    return success_response(
        {
            "payment_id": payment.payment_id,
            "status": payment.status,
            "gateway_ref": payment.gateway_ref,
        }
    )


@router.post("/billing/payments/{payment_id}/confirm", response_model=APIResponse[dict])
def confirm_payment(
    payment_id: int,
    payload: ConfirmPaymentRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    payment = (
        db.query(PaymentIntent)
        .filter(PaymentIntent.payment_id == payment_id, PaymentIntent.student_id == student.student_id)
        .first()
    )
    if not payment:
        return error_response("Payment not found")
    if payload.status not in {"paid", "failed"}:
        return error_response("status must be paid or failed")

    before = {"status": payment.status}
    payment.status = payload.status
    payment.confirmed_at = datetime.now(timezone.utc)
    payment.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="payment_confirmed",
        entity_type="payment_intent",
        entity_id=payment.payment_id,
        before_state=before,
        after_state={"status": payment.status},
    )
    db.commit()
    return success_response({"payment_id": payment.payment_id, "status": payment.status})


@router.get("/billing/payments/me", response_model=APIResponse[dict])
def my_payments(db: Session = Depends(get_db), student=Depends(get_current_student)):
    rows = (
        db.query(PaymentIntent)
        .filter(PaymentIntent.student_id == student.student_id)
        .order_by(PaymentIntent.created_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "payment_id": row.payment_id,
                    "status": row.status,
                    "payment_type": row.payment_type,
                    "amount": float(row.amount),
                    "currency": row.currency,
                    "created_at": row.created_at,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )


@router.get("/admin/billing/payments", response_model=APIResponse[dict])
def admin_payments(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    rows = (
        db.query(PaymentIntent, Student)
        .outerjoin(Student, PaymentIntent.student_id == Student.student_id)
        .order_by(PaymentIntent.created_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "payment_id": row.PaymentIntent.payment_id,
                    "student_id": row.PaymentIntent.student_id,
                    "student_name": row.Student.name if row.Student else None,
                    "status": row.PaymentIntent.status,
                    "payment_type": row.PaymentIntent.payment_type,
                    "amount": float(row.PaymentIntent.amount),
                    "created_at": row.PaymentIntent.created_at,
                }
                for row in rows
            ],
            "count": len(rows),
        }
    )


@router.post("/admin/billing/payments/{payment_id}/refund", response_model=APIResponse[dict])
def refund_payment(
    payment_id: int,
    payload: RefundPaymentRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    payment = db.query(PaymentIntent).filter(PaymentIntent.payment_id == payment_id).first()
    if not payment:
        return error_response("Payment not found")
    if not payload.approved:
        return success_response({"payment_id": payment.payment_id, "status": payment.status})

    before = {"status": payment.status}
    payment.status = "refunded"
    payment.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="payment_refunded",
        entity_type="payment_intent",
        entity_id=payment.payment_id,
        before_state=before,
        after_state={"status": payment.status},
    )
    db.commit()
    return success_response({"payment_id": payment.payment_id, "status": payment.status})
