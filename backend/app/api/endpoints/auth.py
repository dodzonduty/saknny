from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.schemas.auth import LoginRequest, LoginResponse
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.models.student import Student
from backend.app.models.admin import Admin

router = APIRouter()

@router.post("/login", response_model=APIResponse[LoginResponse])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Check student first
    student = db.query(Student).filter(Student.email == request.email).first()
    if student and verify_password(request.password, student.password_hash):
        token = create_access_token(subject=student.student_id, role="student")
        return success_response({
            "access_token": token,
            "token_type": "bearer",
            "role": "student",
            "user_id": student.student_id,
            "name": student.name,
            "firebase_uid": student.firebase_uid,
        })
    
    # Check admin
    admin = db.query(Admin).filter(Admin.email == request.email).first()
    if admin and verify_password(request.password, admin.password_hash):
        token = create_access_token(subject=admin.admin_id, role="admin")
        return success_response({
            "access_token": token,
            "token_type": "bearer",
            "role": "admin",
            "user_id": admin.admin_id,
            "name": admin.name,
            "firebase_uid": None,
        })
        
    return error_response("Incorrect email or password")


