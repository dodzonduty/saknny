import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.core.config import settings
from backend.app.schemas.student import StudentCreate, StudentResponse
from backend.app.schemas.verification import VerificationDocumentResponse
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.models.student import Student
from backend.app.models.verification_document import VerificationDocument
from backend.app.api.deps import get_current_student

router = APIRouter()

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
    
    return success_response({
        "student_id": db_student.student_id,
        "email": db_student.email,
        "enroll_status": db_student.enroll_status
    })

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
        
    # File size validation requires reading chunks, but FastAPI UploadFile allows it.
    # We will enforce size limits at a higher level (like Nginx) or via SpooledTemporaryFile size checks.
    
    filename = f"{uuid.uuid4()}_{file.filename}"
    student_dir = os.path.join(settings.UPLOAD_DIR, str(student_id))
    os.makedirs(student_dir, exist_ok=True)
    
    file_path_relative = f"uploads/verification_docs/{student_id}/{filename}"
    file_path_absolute = os.path.join(student_dir, filename)
    
    with open(file_path_absolute, "wb") as f:
        f.write(file.file.read())
        
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
    
    return success_response({
        "doc_id": db_doc.doc_id,
        "doc_type": db_doc.doc_type,
        "status": db_doc.status,
        "file_path": db_doc.file_path
    })
