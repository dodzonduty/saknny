from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

def success_response(data: Any) -> APIResponse:
    return APIResponse(success=True, data=data, error=None)

def error_response(error_msg: str) -> APIResponse:
    return APIResponse(success=False, data=None, error=error_msg)
