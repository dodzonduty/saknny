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
        },
        {
            "id": "announcement-generator",
            "name": "Announcement Generator",
            "description": "Expands short notes into formal administrative announcements using Gemini",
            "version": "1.0.0"
        }
    ]
    return success_response(models)


class AnnouncementDraftRequest(BaseModel):
    draft_text: str

class AnnouncementGeneratedResponse(BaseModel):
    formal_text: str

@router.post("/generate-announcement", response_model=APIResponse[AnnouncementGeneratedResponse])
async def generate_announcement(request: AnnouncementDraftRequest):
    """
    Expand a short draft note into a formal administrative announcement using Gemini AI.
    """
    from backend.app.services.ai.announcement import AnnouncementGenerator
    
    try:
        generator = AnnouncementGenerator()
        result = generator.process(request.draft_text)
        
        if not result.get("success"):
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=result.get("error", "AI generation failed"))
            
        return success_response({"formal_text": result["formal_text"]})
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=501, detail=str(e))

