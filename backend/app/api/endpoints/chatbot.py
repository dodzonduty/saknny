import traceback

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.schemas.response import APIResponse, success_response

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=APIResponse[ChatResponse])
async def dorm_chat(request: ChatRequest):
    """
    Stateless RAG chatbot for student housing regulations.

    Accepts a user message and returns an answer grounded exclusively in the
    official university housing regulations document.  No chat history is
    stored or required — every request is independent.
    """
    # Lazy import so server startup is not blocked if the regulations file
    # is temporarily unavailable.
    try:
        from backend.app.services.ai.dorm_chatbot import DormChatbot
    except Exception as exc:
        print("[chatbot endpoint] Failed to import DormChatbot:")
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail=f"Chatbot service unavailable: {exc}",
        )

    # Instantiate — __init__ validates API key and regulations load
    try:
        chatbot = DormChatbot()
    except (ValueError, RuntimeError) as exc:
        print(f"[chatbot endpoint] DormChatbot init error: {exc}")
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        print("[chatbot endpoint] Unexpected error during DormChatbot init:")
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="Chatbot service could not start. Please try again later.",
        )

    # Call the model
    try:
        result = chatbot.process(request.message)
    except Exception as exc:
        print("[chatbot endpoint] Unexpected error during chatbot.process():")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your request.",
        )

    if not result.get("success"):
        # Model returned a controlled failure (e.g. empty input, Gemini error)
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Chatbot service failed."),
        )

    return success_response({"answer": result["answer"]})
