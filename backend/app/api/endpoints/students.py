import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_student, get_current_user
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models.student import Student
from backend.app.models.verification_document import VerificationDocument
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.schemas.student import StudentCreate, StudentResponse
from backend.app.schemas.verification import VerificationDocumentResponse
from backend.app.services.audit import get_actor_identity, write_audit_log

router = APIRouter()


class StudentProfileUpdate(BaseModel):
    name: str | None = None
    home_city: str | None = None
    preferences: str | None = None


@router.post("/register", response_model=APIResponse[StudentResponse], status_code=201)
def register_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Check if student exists
    if db.query(Student).filter(Student.email == student_in.email).first():
        return error_response("Email already registered")
    if db.query(Student).filter(Student.faculty_id == student_in.faculty_id).first():
        return error_response("Faculty ID already registered")
        
    db_student = Student(
        faculty_id=student_in.faculty_id,
        name=student_in.name,
        email=student_in.email,
        gender=student_in.gender,
        home_city=student_in.home_city,
        password_hash=get_password_hash(student_in.password),
        preferences=student_in.preferences
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return success_response(
        {
            "student_id": db_student.student_id,
            "email": db_student.email,
            "enroll_status": db_student.enroll_status,
        }
    )


@router.put("/{student_id}/profile", response_model=APIResponse[dict])
def update_profile(
    student_id: int,
    profile_in: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    if current_student.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return error_response("Student not found")

    before_state = {
        "name": student.name,
        "home_city": student.home_city,
        "preferences": student.preferences,
    }
    if profile_in.name is not None:
        student.name = profile_in.name
    if profile_in.home_city is not None:
        student.home_city = profile_in.home_city
    if profile_in.preferences is not None:
        student.preferences = profile_in.preferences
    student.updated_at = datetime.now(timezone.utc)

    actor_role, actor_id = get_actor_identity(current_student)
    write_audit_log(
        db=db,
        actor_role=actor_role,
        actor_id=actor_id,
        action="student_profile_updated",
        entity_type="student",
        entity_id=student.student_id,
        before_state=before_state,
        after_state={
            "name": student.name,
            "home_city": student.home_city,
            "preferences": student.preferences,
        },
    )
    db.commit()
    db.refresh(student)

    return success_response(
        {
            "student_id": student.student_id,
            "name": student.name,
            "home_city": student.home_city,
            "preferences": student.preferences,
        }
    )


@router.post("/{student_id}/documents", response_model=APIResponse[VerificationDocumentResponse], status_code=201)
def upload_document(
    student_id: int, 
    doc_type: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    if current_student.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for this user")
        
    allowed_content_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_content_types:
        return error_response("Invalid file type. Only JPEG, PNG, and PDF are allowed.")

    file_bytes = file.file.read()
    max_size = 5 * 1024 * 1024
    if len(file_bytes) > max_size:
        return error_response("File too large. Maximum size is 5 MB.")

    filename = f"{uuid.uuid4()}_{file.filename}"
    student_dir = os.path.join(settings.UPLOAD_DIR, str(student_id))
    os.makedirs(student_dir, exist_ok=True)

    file_path_relative = f"uploads/verification_docs/{student_id}/{filename}"
    file_path_absolute = os.path.join(student_dir, filename)

    with open(file_path_absolute, "wb") as f:
        f.write(file_bytes)

    db_doc = VerificationDocument(
        student_id=student_id,
        doc_type=doc_type,
        file_path=file_path_relative,
        original_filename=file.filename,
        status="pending"
    )
    
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    actor_role, actor_id = get_actor_identity(current_student)
    write_audit_log(
        db=db,
        actor_role=actor_role,
        actor_id=actor_id,
        action="verification_document_uploaded",
        entity_type="verification_document",
        entity_id=db_doc.doc_id,
        after_state={"status": db_doc.status, "doc_type": db_doc.doc_type},
    )
    db.commit()

    return success_response(
        {
            "doc_id": db_doc.doc_id,
            "doc_type": db_doc.doc_type,
            "status": db_doc.status,
            "file_path": db_doc.file_path,
        }
    )


@router.get("/{student_id}/documents", response_model=APIResponse[dict])
def list_documents(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = getattr(current_user, "role_type", None)
    if role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to access these documents")

    docs = (
        db.query(VerificationDocument)
        .filter(VerificationDocument.student_id == student_id)
        .order_by(VerificationDocument.created_at.desc())
        .all()
    )

    return success_response(
        {
            "documents": [
                {
                    "doc_id": doc.doc_id,
                    "doc_type": doc.doc_type,
                    "status": doc.status,
                    "file_url": f"/api/v1/{doc.file_path}",
                    "is_flagged": doc.is_flagged,
                    "rejection_reason": doc.rejection_reason,
                    "created_at": doc.created_at,
                }
                for doc in docs
            ]
        }
    )
