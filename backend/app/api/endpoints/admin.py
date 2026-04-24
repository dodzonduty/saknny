from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.schemas.verification import VerificationReviewRequest, VerificationReviewResponse
from backend.app.models.verification_document import VerificationDocument
from backend.app.models.student import Student
from backend.app.models.admin import Admin
from backend.app.api.deps import get_current_admin

router = APIRouter()

@router.get("/verifications", response_model=APIResponse[dict])
def list_verifications(status: str = "pending", db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
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
            "file_url": f"/api/v1/{doc.file_path}",
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
        
    doc.status = review_in.status
    doc.rejection_reason = review_in.rejection_reason
    doc.reviewed_by = current_admin.admin_id
    doc.review_date = datetime.now(timezone.utc)
    
    # Check if student should be enrolled (has at least one approved doc)
    # The business rule says: "Once all docs approved -> Admin sets students.enroll_status = TRUE"
    # Or "cannot be marked as enrolled until at least one verification document is approved."
    student = db.query(Student).filter(Student.student_id == doc.student_id).first()
    
    if review_in.status == "approved":
        # Check if all pending docs are approved
        pending_docs = db.query(VerificationDocument).filter(
            VerificationDocument.student_id == doc.student_id,
            VerificationDocument.status == "pending"
        ).count()
        
        # If no more pending docs and at least one approved, set enroll_status
        if pending_docs == 0:
            student.enroll_status = True
            
    db.commit()
    db.refresh(doc)
    db.refresh(student)
    
    return success_response({
        "doc_id": doc.doc_id,
        "status": doc.status,
        "student_enroll_status": student.enroll_status
    })
