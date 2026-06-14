from fastapi import APIRouter, UploadFile, File, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from backend.app.schemas.response import APIResponse, success_response
from backend.app.services.ai import DocumentQualityChecker

router = APIRouter()


class DocumentQualityResponse(BaseModel):
    is_acceptable: bool
    sharpness: float
    brightness: float
    issues: List[str]


@router.post("/document-quality", response_model=APIResponse[DocumentQualityResponse])
async def check_document_quality(file: UploadFile = File(...)):
    """
    Check the quality of an uploaded document image.
    Analyzes sharpness, brightness, and overall acceptability.
    """
    file_bytes = await file.read()
    checker = DocumentQualityChecker()
    result = checker.process(file_bytes)
    return success_response(result)


@router.get("/models", response_model=APIResponse[List[Dict[str, Any]]])
async def list_available_models():
    """
    List all available AI models in the system.
    """
    models = [
        {
            "id": "document-quality-checker",
            "name": "Document Quality Checker",
            "description": "Checks document image quality (sharpness, brightness, focus)",
            "version": "1.0.0"
        }
    ]
    return success_response(models)
