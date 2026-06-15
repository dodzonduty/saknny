from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VerificationDocumentResponse(BaseModel):
    doc_id: int
    doc_type: str
    status: str
    file_path: str
    fields_to_edit: Optional[List[str]] = None
    fields_updated: Optional[List[str]] = None

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
    fields_to_edit: Optional[List[str]] = None

class VerificationHistoryResponse(BaseModel):
    history_id: int
    doc_id: int
    actor_role: str
    actor_id: int
    action: str
    comment: Optional[str] = None
    fields_requested: Optional[List[str]] = None
    fields_updated: Optional[List[str]] = None
    created_at: datetime

class VerificationReviewResponse(BaseModel):
    doc_id: int
    status: str
    student_enroll_status: bool
