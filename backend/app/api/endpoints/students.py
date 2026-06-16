import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from datetime import date, datetime, timedelta
from typing import Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_student, get_current_user
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models.student import Student
from backend.app.models.verification_document import VerificationDocument
from backend.app.models.verification_history import VerificationHistory
from backend.app.schemas.response import APIResponse, success_response, error_response
from backend.app.schemas.student import StudentCreate, StudentResponse
from backend.app.schemas.verification import VerificationDocumentResponse
from backend.app.services.audit import get_actor_identity, write_audit_log
from backend.app.models.allocation import Allocation
from backend.app.models.room import Room
from backend.app.models.building import Building
from backend.app.models.attendance_record import AttendanceRecord
from backend.app.services.firebase import (
    FirebaseServiceError,
    FirebaseUserPayload,
    create_firebase_user,
    delete_firebase_user,
)

router = APIRouter()


class StudentProfileUpdate(BaseModel):
    name: str | None = None
    home_city: str | None = None
    preferences: str | None = None
    email: str | None = None
    faculty_id: str | None = None
    gender: str | None = None
    nationality_id: str | None = None
    faculty: str | None = None


@router.post("/register", response_model=APIResponse[StudentResponse], status_code=201)
def register_student(
    faculty_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    gender: str = Form(...),
    home_city: str = Form(...),
    password: str = Form(...),
    nationality_id: str = Form(...),
    faculty: str = Form(...),
    preferences: str | None = Form(None),
    profile_picture: UploadFile = File(...),
    nationality_id_photo_front: UploadFile = File(...),
    nationality_id_photo_back: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if student exists
    if db.query(Student).filter(Student.email == email).first():
        return error_response("Email already registered")
    if db.query(Student).filter(Student.faculty_id == faculty_id).first():
        return error_response("Faculty ID already registered")
    if db.query(Student).filter(Student.nationality_id == nationality_id).first():
        return error_response("Nationality ID already registered")
        
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    for file in [profile_picture, nationality_id_photo_front, nationality_id_photo_back]:
        if file.content_type not in allowed_types:
            return error_response(f"Invalid file type for {file.filename}. Only images are allowed.")

    from backend.app.core.config import BACKEND_DIR
    student_uuid = str(uuid.uuid4())
    student_dir = os.path.join(BACKEND_DIR, "uploads", "profiles", student_uuid)
    os.makedirs(student_dir, exist_ok=True)

    def save_file(f: UploadFile, prefix: str) -> str:
        ext = os.path.splitext(f.filename)[1]
        fname = f"{prefix}_{student_uuid}{ext}"
        fpath = os.path.join(student_dir, fname)
        with open(fpath, "wb") as buffer:
            buffer.write(f.file.read())
        return f"uploads/profiles/{student_uuid}/{fname}"

    profile_path = save_file(profile_picture, "profile")
    front_path = save_file(nationality_id_photo_front, "id_front")
    back_path = save_file(nationality_id_photo_back, "id_back")

    firebase_uid = None
    if settings.FIREBASE_ENABLED:
        try:
            firebase_uid = create_firebase_user(
                FirebaseUserPayload(
                    email=email,
                    password=password,
                    display_name=name,
                )
            )
        except FirebaseServiceError as exc:
            return error_response(str(exc))
        if not firebase_uid:
            return error_response("Firebase user creation failed")

    db_student = Student(
        faculty_id=faculty_id,
        name=name,
        email=email,
        gender=gender,
        home_city=home_city,
        password_hash=get_password_hash(password),
        preferences=preferences,
        firebase_uid=firebase_uid,
        nationality_id=nationality_id,
        faculty=faculty,
        profile_picture_url=profile_path,
        nationality_id_photo_front=front_path,
        nationality_id_photo_back=back_path,
    )
    db.add(db_student)
    try:
        db.commit()
        db.refresh(db_student)
    except Exception as exc:
        db.rollback()
        rollback_error = None
        if firebase_uid:
            try:
                delete_firebase_user(firebase_uid)
            except FirebaseServiceError as rollback_exc:
                rollback_error = str(rollback_exc)
        if rollback_error:
            return error_response(
                f"Failed to persist student record and failed Firebase rollback: {rollback_error}"
            )
        return error_response(f"Failed to persist student record: {exc}")
    
    return success_response(
        {
            "student_id": db_student.student_id,
            "faculty_id": db_student.faculty_id,
            "email": db_student.email,
            "enroll_status": db_student.enroll_status,
            "firebase_uid": db_student.firebase_uid,
            "profile_picture_url": f"http://127.0.0.1:8000/api/v1/{db_student.profile_picture_url}",
            "nationality_id": db_student.nationality_id,
            "faculty": db_student.faculty,
            "nationality_id_photo_front": f"http://127.0.0.1:8000/api/v1/{db_student.nationality_id_photo_front}",
            "nationality_id_photo_back": f"http://127.0.0.1:8000/api/v1/{db_student.nationality_id_photo_back}",
        }
    )


@router.get("/{student_id}", response_model=APIResponse[dict])
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = getattr(current_user, "role_type", None)
    if role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this profile")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return error_response("Student not found")

    return success_response(
        {
            "student_id": student.student_id,
            "faculty_id": student.faculty_id,
            "name": student.name,
            "email": student.email,
            "home_city": student.home_city,
            "preferences": student.preferences,
            "gender": student.gender,
            "enroll_status": student.enroll_status,
            "profile_picture_url": f"http://127.0.0.1:8000/api/v1/{student.profile_picture_url}" if student.profile_picture_url else None,
            "nationality_id": student.nationality_id,
            "faculty": student.faculty,
            "nationality_id_photo_front": f"http://127.0.0.1:8000/api/v1/{student.nationality_id_photo_front}" if student.nationality_id_photo_front else None,
            "nationality_id_photo_back": f"http://127.0.0.1:8000/api/v1/{student.nationality_id_photo_back}" if student.nationality_id_photo_back else None,
        }
    )


@router.put("/{student_id}/profile", response_model=APIResponse[dict])
def update_profile(
    student_id: int,
    profile_in: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = getattr(current_user, "role_type", None)
    if role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return error_response("Student not found")

    doc = db.query(VerificationDocument).filter(VerificationDocument.student_id == student_id).order_by(VerificationDocument.created_at.desc()).first()
    
    is_approved = student.enroll_status is True
    is_rejected = doc and doc.status == "rejected"
    is_pending = doc and doc.status == "pending"
    is_incomplete = doc and doc.status == "incomplete"
    
    # What fields is the student allowed to edit?
    allowed_fields = set(["preferences"]) # Always allowed
    if not doc:
        # Before any upload, they can edit anything
        allowed_fields.update(["name", "home_city", "email", "faculty_id", "gender", "nationality_id", "faculty"])
    elif is_incomplete and doc.fields_to_edit:
        # If incomplete, they can edit whatever admin requested
        allowed_fields.update(doc.fields_to_edit)
        # Add related fields for ease if admin just said "basic_info" or something, but we assume exact field names
    
    # Extract attempted updates
    attempted_updates = {k: v for k, v in profile_in.model_dump(exclude_unset=True).items() if v is not None}
    
    # Ensure they aren't updating restricted fields
    if role != "admin":
        for field in attempted_updates.keys():
            if field not in allowed_fields:
                return error_response(f"You do not have permission to edit {field} at this time.")

    before_state = {
        "name": student.name,
        "home_city": student.home_city,
        "preferences": student.preferences,
        "email": student.email,
        "faculty_id": student.faculty_id,
        "gender": student.gender,
        "nationality_id": student.nationality_id,
        "faculty": student.faculty,
    }
    
    fields_updated_now = []

    if profile_in.name is not None and profile_in.name != student.name:
        student.name = profile_in.name
        fields_updated_now.append("name")
    if profile_in.home_city is not None and profile_in.home_city != student.home_city:
        student.home_city = profile_in.home_city
        fields_updated_now.append("home_city")
    if profile_in.preferences is not None and profile_in.preferences != student.preferences:
        student.preferences = profile_in.preferences
        fields_updated_now.append("preferences")
    if profile_in.email is not None and profile_in.email != student.email:
        if db.query(Student).filter(Student.email == profile_in.email).first():
            return error_response("Email already registered")
        student.email = profile_in.email
        fields_updated_now.append("email")
    if profile_in.faculty_id is not None and profile_in.faculty_id != student.faculty_id:
        if db.query(Student).filter(Student.faculty_id == profile_in.faculty_id).first():
            return error_response("Faculty ID already registered")
        student.faculty_id = profile_in.faculty_id
        fields_updated_now.append("faculty_id")
    if profile_in.gender is not None and profile_in.gender != student.gender:
        student.gender = profile_in.gender
        fields_updated_now.append("gender")
    if profile_in.nationality_id is not None and profile_in.nationality_id != student.nationality_id:
        if db.query(Student).filter(Student.nationality_id == profile_in.nationality_id).first():
            return error_response("Nationality ID already registered")
        student.nationality_id = profile_in.nationality_id
        fields_updated_now.append("nationality_id")
    if profile_in.faculty is not None and profile_in.faculty != student.faculty:
        student.faculty = profile_in.faculty
        fields_updated_now.append("faculty")

    student.updated_at = datetime.now(timezone.utc)
    
    # If the student edited fields that the admin requested, track them
    if is_incomplete and fields_updated_now:
        current_updated = list(doc.fields_updated or [])
        for f in fields_updated_now:
            if f in (doc.fields_to_edit or []) and f not in current_updated:
                current_updated.append(f)
        doc.fields_updated = current_updated

    actor_role, actor_id = get_actor_identity(current_user)
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
            "email": student.email,
            "faculty_id": student.faculty_id,
            "gender": student.gender,
            "nationality_id": student.nationality_id,
            "faculty": student.faculty,
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


@router.post("/{student_id}/profile-picture", response_model=APIResponse[dict])
def upload_profile_picture(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    if current_student.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload for this profile")

    allowed_content_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_content_types:
        return error_response("Invalid file type. Only images are allowed.")

    file_bytes = file.file.read()
    max_size = 5 * 1024 * 1024
    if len(file_bytes) > max_size:
        return error_response("File too large. Maximum size is 5 MB.")

    from backend.app.core.config import BACKEND_DIR
    filename = f"profile_{student_id}_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    
    # Store in uploads/profiles
    student_dir = os.path.join(BACKEND_DIR, "uploads", "profiles", str(student_id))
    os.makedirs(student_dir, exist_ok=True)

    file_path_relative = f"uploads/profiles/{student_id}/{filename}"
    file_path_absolute = os.path.join(student_dir, filename)

    with open(file_path_absolute, "wb") as f:
        f.write(file_bytes)

    student = db.query(Student).filter(Student.student_id == student_id).first()
    
    # Delete old profile picture if exists
    if student.profile_picture_url:
        old_path = os.path.join(BACKEND_DIR, student.profile_picture_url)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
                
    student.profile_picture_url = file_path_relative
    student.updated_at = datetime.now(timezone.utc)
    
    doc = db.query(VerificationDocument).filter(VerificationDocument.student_id == student_id).order_by(VerificationDocument.created_at.desc()).first()
    if doc and doc.status == "incomplete" and "profile_picture" in (doc.fields_to_edit or []):
        current_updated = doc.fields_updated or []
        if "profile_picture" not in current_updated:
            current_updated.append("profile_picture")
            doc.fields_updated = current_updated
    
    db.commit()

    return success_response(
        {
            "profile_picture_url": f"http://127.0.0.1:8000/api/v1/{file_path_relative}"
        }
    )

@router.post("/{student_id}/nationality-photo-front", response_model=APIResponse[dict])
def upload_nationality_photo_front(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    if current_student.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    allowed_content_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_content_types:
        return error_response("Invalid file type")

    file_bytes = file.file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        return error_response("File too large")

    from backend.app.core.config import BACKEND_DIR
    filename = f"id_front_{student_id}_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    student_dir = os.path.join(BACKEND_DIR, "uploads", "profiles", str(student_id))
    os.makedirs(student_dir, exist_ok=True)
    file_path_relative = f"uploads/profiles/{student_id}/{filename}"
    
    with open(os.path.join(student_dir, filename), "wb") as f:
        f.write(file_bytes)

    student = db.query(Student).filter(Student.student_id == student_id).first()
    student.nationality_id_photo_front = file_path_relative
    student.updated_at = datetime.now(timezone.utc)
    
    doc = db.query(VerificationDocument).filter(VerificationDocument.student_id == student_id).order_by(VerificationDocument.created_at.desc()).first()
    if doc and doc.status == "incomplete" and "nationality_id_photo_front" in (doc.fields_to_edit or []):
        current_updated = doc.fields_updated or []
        if "nationality_id_photo_front" not in current_updated:
            current_updated.append("nationality_id_photo_front")
            doc.fields_updated = current_updated
    db.commit()
    return success_response({"nationality_id_photo_front": f"http://127.0.0.1:8000/api/v1/{file_path_relative}"})

@router.post("/{student_id}/nationality-photo-back", response_model=APIResponse[dict])
def upload_nationality_photo_back(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    if current_student.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    allowed_content_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_content_types:
        return error_response("Invalid file type")

    file_bytes = file.file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        return error_response("File too large")

    from backend.app.core.config import BACKEND_DIR
    filename = f"id_back_{student_id}_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    student_dir = os.path.join(BACKEND_DIR, "uploads", "profiles", str(student_id))
    os.makedirs(student_dir, exist_ok=True)
    file_path_relative = f"uploads/profiles/{student_id}/{filename}"
    
    with open(os.path.join(student_dir, filename), "wb") as f:
        f.write(file_bytes)

    student = db.query(Student).filter(Student.student_id == student_id).first()
    student.nationality_id_photo_back = file_path_relative
    student.updated_at = datetime.now(timezone.utc)
    
    doc = db.query(VerificationDocument).filter(VerificationDocument.student_id == student_id).order_by(VerificationDocument.created_at.desc()).first()
    if doc and doc.status == "incomplete" and "nationality_id_photo_back" in (doc.fields_to_edit or []):
        current_updated = doc.fields_updated or []
        if "nationality_id_photo_back" not in current_updated:
            current_updated.append("nationality_id_photo_back")
            doc.fields_updated = current_updated
    db.commit()
    return success_response({"nationality_id_photo_back": f"http://127.0.0.1:8000/api/v1/{file_path_relative}"})


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

    from backend.app.core.config import BACKEND_DIR
    filename = f"{uuid.uuid4()}_{file.filename}"
    student_dir = os.path.join(BACKEND_DIR, settings.UPLOAD_DIR, str(student_id))
    os.makedirs(student_dir, exist_ok=True)

    file_path_relative = f"uploads/verification_docs/{student_id}/{filename}"
    file_path_absolute = os.path.join(student_dir, filename)

    with open(file_path_absolute, "wb") as f:
        f.write(file_bytes)

    # Find the latest document
    latest_doc = db.query(VerificationDocument).filter(
        VerificationDocument.student_id == student_id
    ).order_by(VerificationDocument.created_at.desc()).first()

    if latest_doc and latest_doc.status == "incomplete":
        # Update existing incomplete document
        latest_doc.file_path = file_path_relative
        latest_doc.original_filename = file.filename
        
        current_updated = list(latest_doc.fields_updated or [])
        if "verification_document" not in current_updated:
            current_updated.append("verification_document")
        latest_doc.fields_updated = current_updated
        latest_doc.updated_at = datetime.now(timezone.utc)
        
        db_doc = latest_doc
    else:
        # Create new document
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
                    "file_url": f"http://127.0.0.1:8000/api/v1/{doc.file_path}",
                    "is_flagged": doc.is_flagged,
                    "rejection_reason": doc.rejection_reason,
                    "fields_to_edit": doc.fields_to_edit,
                    "fields_updated": doc.fields_updated,
                    "created_at": doc.created_at,
                }
                for doc in docs
            ]
        }
    )

@router.post("/{student_id}/verification-resubmit", response_model=APIResponse[dict])
def resubmit_verification(
    student_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    if current_student.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    doc = db.query(VerificationDocument).filter(
        VerificationDocument.student_id == student_id,
        VerificationDocument.status == "incomplete"
    ).order_by(VerificationDocument.created_at.desc()).first()
    
    if not doc:
        return error_response("No incomplete verification document found to resubmit.")

    if "verification_document" in (doc.fields_to_edit or []) and "verification_document" not in (doc.fields_updated or []):
        return error_response("You must upload a new verification document from your Home dashboard before resubmitting.")

    doc.status = "pending"
    doc.updated_at = datetime.now(timezone.utc)
    
    history_record = VerificationHistory(
        doc_id=doc.doc_id,
        actor_role="student",
        actor_id=current_student.student_id,
        action="resubmitted",
        comment="Student has updated the requested fields and resubmitted the profile.",
        fields_updated=doc.fields_updated
    )
    db.add(history_record)
    db.commit()

    return success_response({"message": "Verification resubmitted successfully"})


@router.get("/{student_id}/allocation", response_model=APIResponse[dict])
def get_student_allocation(
    student_id: int, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    role = getattr(current_user, "role_type", None)
    if role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this allocation")

    row = (
        db.query(Allocation, Room, Building)
        .outerjoin(Room, Allocation.room_id == Room.room_id)
        .outerjoin(Building, Room.dorm_id == Building.dorm_id)
        .filter(Allocation.student_id == student_id, Allocation.status == "assigned")
        .first()
    )
    if not row:
        return success_response({"allocation": None})
    alloc, room, building = row.Allocation, row.Room, row.Building
    return success_response(
        {
            "allocation": {
                "allocation_id": alloc.allocation_id,
                "room_id": alloc.room_id,
                "plan": alloc.plan,
                "status": alloc.status,
                "assigned_at": alloc.assigned_at,
                "room_number": room.room_number if room else None,
                "building_name": building.building_name if building else None,
                "dorm_id": room.dorm_id if room else None,
                "latitude": float(room.latitude) if room and room.latitude is not None else None,
                "longitude": float(room.longitude) if room and room.longitude is not None else None,
                "allowed_radius_meters": room.allowed_radius_meters if room else None,
            }
        }
    )


@router.get("/{student_id}/attendance-log", response_model=APIResponse[dict])
def get_student_attendance_log(
    student_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    role = getattr(current_user, "role_type", None)
    if role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this log")

    today = datetime.now().date()
    if end_date is None:
        end_date = today
    if start_date is None:
        start_date = today.replace(day=1)
        
    period_days = (end_date - start_date).days + 1
    
    # Query Active Allocations for this student
    allocations = (
        db.query(Allocation, Student, Room, Building)
        .join(Student, Allocation.student_id == Student.student_id)
        .join(Room, Allocation.room_id == Room.room_id)
        .join(Building, Room.dorm_id == Building.dorm_id)
        .filter(Allocation.status == "assigned", Allocation.student_id == student_id)
        .all()
    )
    
    if not allocations:
        return success_response({
            "summary": {
                "period_days": period_days,
                "attended": 0,
                "missed": 0,
                "overall_rate": 0.0,
                "is_allocated": False
            },
            "logs": []
        })
        
    # Query Successful Attendances in date range
    attendances = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.attendance_date >= start_date,
            AttendanceRecord.attendance_date <= end_date,
            AttendanceRecord.status == "SUCCESS"
        )
        .all()
    )
    
    # Create lookup dict: (student_id, date) -> record
    att_dict = {(r.student_id, r.attendance_date): r for r in attendances}
    
    total_attended = 0
    logs = []
    
    # Generate log for every day in the period
    for alloc, student, room, building in allocations:
        for i in range(period_days):
            current_day = start_date + timedelta(days=i)
            
            # Check if attended
            record = att_dict.get((student.student_id, current_day))
            is_attended = record is not None
            if is_attended:
                total_attended += 1
                
            logs.append({
                "student_name": student.name,
                "student_id": student.student_id,
                "building_name": building.building_name,
                "room_number": room.room_number,
                "day": current_day.isoformat(),
                "attendance_time": record.attendance_at.isoformat() if is_attended else None,
                "status": "attended" if is_attended else "missed"
            })
            
    total_possible = period_days * len(allocations)
    total_missed = total_possible - total_attended
    
    response_data = {
        "summary": {
            "period_days": period_days,
            "attended": total_attended,
            "missed": total_missed,
            "overall_rate": round((total_attended / total_possible) * 100, 2) if total_possible > 0 else 0.0,
            "is_allocated": True
        },
        "logs": logs
    }
    
    return success_response(response_data)


