from pydantic import BaseModel, EmailStr
from typing import Optional

class StudentCreate(BaseModel):
    faculty_id: str
    name: str
    email: EmailStr
    gender: str
    home_city: str
    password: str
    preferences: Optional[str] = None

class StudentResponse(BaseModel):
    student_id: int
    faculty_id: str
    email: str
    enroll_status: bool
    firebase_uid: str | None = None
    profile_picture_url: str
    nationality_id: str
    nationality_id_photo_front: str
    nationality_id_photo_back: str
    faculty: str
