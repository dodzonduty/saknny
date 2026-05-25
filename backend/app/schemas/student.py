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
    email: str
    enroll_status: bool
    firebase_uid: str | None = None
