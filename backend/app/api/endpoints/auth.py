from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.schemas.auth import LoginRequest, LoginResponse, FirebaseLoginRequest
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.models.student import Student
from backend.app.models.admin import Admin
from backend.app.services.firebase import verify_firebase_token, FirebaseServiceError

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


@router.post("/firebase-login", response_model=APIResponse[LoginResponse])
def firebase_login(request: FirebaseLoginRequest, db: Session = Depends(get_db)):
    try:
        decoded_token = verify_firebase_token(request.token)
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=401, detail=f"Could not validate Firebase token: {exc}")
    
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Firebase token has no UID")
        
    # Find student by firebase_uid
    student = db.query(Student).filter(Student.firebase_uid == uid).first()
    
    # If not found, perhaps they were created in Firebase but not synced to Postgres?
    # For now, we reject if they don't exist in our Postgres DB.
    if not student:
        raise HTTPException(status_code=404, detail="User not found in local database")
        
    # Issue a high-performance local FastAPI token
    token = create_access_token(subject=student.student_id, role="student")
    return success_response({
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "user_id": student.student_id,
        "name": student.name,
        "firebase_uid": student.firebase_uid,
    })
    