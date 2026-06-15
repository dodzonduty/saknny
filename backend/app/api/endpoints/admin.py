from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin
from backend.app.core.database import get_db
from backend.app.models.admin import Admin
from backend.app.models.student import Student
from backend.app.models.verification_document import VerificationDocument
from backend.app.models.verification_history import VerificationHistory
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.schemas.verification import VerificationReviewRequest, VerificationReviewResponse, VerificationHistoryResponse
from backend.app.services.audit import write_audit_log

router = APIRouter()


class EnrollmentUpdateRequest(BaseModel):
    enroll_status: bool


@router.get("/students/search", response_model=APIResponse[dict])
def search_students(q: str, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    if not q or len(q) < 2:
        return success_response({"students": []})
        
    students = db.query(Student).filter(Student.name.ilike(f"%{q}%")).limit(10).all()
    return success_response({
        "students": [
            {"student_id": s.student_id, "name": s.name} for s in students
        ]
    })

@router.get("/verifications", response_model=APIResponse[dict])
def list_verifications(status: str = "pending", db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    if status not in {"pending", "approved", "rejected", "incomplete"}:
        return error_response("Invalid verification status filter")

    docs = db.query(VerificationDocument, Student.name)\
        .join(Student, VerificationDocument.student_id == Student.student_id)\
        .filter(VerificationDocument.status == status)\
        .all()
        
    documents = []
    for doc, student_name in docs:
        documents.append({
            "doc_id": doc.doc_id,
            "student_id": doc.student_id,
            "student_name": student_name,
            "doc_type": doc.doc_type,
            "status": doc.status,
            "file_url": f"http://127.0.0.1:8000/api/v1/{doc.file_path}",
            "is_flagged": doc.is_flagged,
            "created_at": doc.created_at
        })
        
    return success_response({"documents": documents})

@router.put("/verifications/{doc_id}", response_model=APIResponse[VerificationReviewResponse])
def review_verification(
    doc_id: int, 
    review_in: VerificationReviewRequest, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    doc = db.query(VerificationDocument).filter(VerificationDocument.doc_id == doc_id).first()
    if not doc:
        return error_response("Document not found")

    if review_in.status not in {"approved", "rejected", "incomplete"}:
        return error_response("status must be approved, rejected, or incomplete")
    if review_in.status in {"rejected", "incomplete"} and not review_in.rejection_reason:
        return error_response("rejection_reason is required when status is rejected or incomplete")

    before_state = {"status": doc.status, "rejection_reason": doc.rejection_reason, "fields_to_edit": doc.fields_to_edit}
    doc.status = review_in.status
    doc.rejection_reason = review_in.rejection_reason
    
    if review_in.status == "incomplete":
        doc.fields_to_edit = review_in.fields_to_edit
        # Clear fields_updated so the student can start fresh
        doc.fields_updated = []
    elif review_in.status in {"approved", "rejected"}:
        doc.fields_to_edit = None
        doc.fields_updated = None

    doc.reviewed_by = current_admin.admin_id
    doc.review_date = datetime.now(timezone.utc)

    # Create history record
    history_record = VerificationHistory(
        doc_id=doc.doc_id,
        actor_role="admin",
        actor_id=current_admin.admin_id,
        action=review_in.status,
        comment=review_in.rejection_reason,
        fields_requested=review_in.fields_to_edit if review_in.status == "incomplete" else None
    )
    db.add(history_record)

    db.flush()

    student = db.query(Student).filter(Student.student_id == doc.student_id).first()

    pending_count = db.query(VerificationDocument).filter(
        VerificationDocument.student_id == doc.student_id,
        VerificationDocument.status == "pending",
    ).count()
    approved_count = db.query(VerificationDocument).filter(
        VerificationDocument.student_id == doc.student_id,
        VerificationDocument.status == "approved",
    ).count()
    if pending_count == 0 and approved_count > 0:
        student.enroll_status = True

    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=current_admin.admin_id,
        action="verification_document_reviewed",
        entity_type="verification_document",
        entity_id=doc.doc_id,
        before_state=before_state,
        after_state={
            "status": doc.status,
            "rejection_reason": doc.rejection_reason,
            "student_enroll_status": student.enroll_status,
        },
    )

    db.commit()
    db.refresh(doc)
    db.refresh(student)

    return success_response({
        "doc_id": doc.doc_id,
        "status": doc.status,
        "student_enroll_status": student.enroll_status
    })


@router.put("/students/{student_id}/enrollment", response_model=APIResponse[dict])
def set_enrollment_status(
    student_id: int,
    request: EnrollmentUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return error_response("Student not found")

    if request.enroll_status:
        doc_requirements_met = db.query(VerificationDocument).filter(
            and_(
                VerificationDocument.student_id == student_id,
                VerificationDocument.status == "approved",
            )
        ).count()
        if doc_requirements_met == 0:
            return error_response(
                "Cannot set enroll_status=true before at least one approved verification document"
            )

    before = {"enroll_status": student.enroll_status}
    student.enroll_status = request.enroll_status
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=current_admin.admin_id,
        action="student_enrollment_updated",
        entity_type="student",
        entity_id=student.student_id,
        before_state=before,
        after_state={"enroll_status": student.enroll_status},
    )
    db.commit()
    db.refresh(student)

    return success_response(
        {"student_id": student.student_id, "enroll_status": student.enroll_status}
    )

@router.get("/verifications/{doc_id}/history", response_model=APIResponse[dict])
def get_verification_history(
    doc_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    history = db.query(VerificationHistory).filter(VerificationHistory.doc_id == doc_id).order_by(VerificationHistory.created_at.desc()).all()
    
    return success_response({
        "history": [
            {
                "history_id": h.history_id,
                "doc_id": h.doc_id,
                "actor_role": h.actor_role,
                "actor_id": h.actor_id,
                "action": h.action,
                "comment": h.comment,
                "fields_requested": h.fields_requested,
                "fields_updated": h.fields_updated,
                "created_at": h.created_at
            }
            for h in history
        ]
    })
