"""
Saknny – Compatibility Schemas (Role B: API Layer)
"""

from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any, List, Optional


class CompatibilityQuestionnaireCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_gender: Optional[str] = None
    target_dorm_id: Optional[int] = None


class CompatibilityResponseCreate(BaseModel):
    questionnaire_id: int
    answers: Dict[str, str]


class ClusterRequest(BaseModel):
    questionnaire_id: int
    dorm_id: Optional[int] = None
    k: Optional[int] = None


class AutoAssignRequest(BaseModel):
    room_assignments: Dict[str, int]
    plan: str
