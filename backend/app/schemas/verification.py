from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VerificationDocumentResponse(BaseModel):
    doc_id: int
    doc_type: str
    status: str
    file_path: str

class VerificationDocumentListResponse(BaseModel):
    doc_id: int
    student_id: int
    student_name: str
    doc_type: str
    status: str
    file_url: str
    is_flagged: bool
    created_at: datetime

class VerificationReviewRequest(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class VerificationReviewResponse(BaseModel):
    doc_id: int
    status: str
    student_enroll_status: bool
