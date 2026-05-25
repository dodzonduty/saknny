from fastapi import APIRouter, Depends

from backend.app.api.deps import get_current_student
from backend.app.models.student import Student
from backend.app.schemas.auth import FirebaseTokenRequest, FirebaseTokenResponse
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.firebase import FirebaseServiceError, create_custom_token

router = APIRouter()


@router.post("/mobile/firebase-token", response_model=APIResponse[FirebaseTokenResponse])
def mobile_firebase_token(
    request: FirebaseTokenRequest,
    current_student: Student = Depends(get_current_student),
):
    if not current_student.firebase_uid:
        return error_response("Student account is not linked to Firebase")
    if current_student.firebase_uid != request.firebase_uid:
        return error_response("Firebase identity mismatch")

    try:
        token = create_custom_token(current_student.firebase_uid)
    except FirebaseServiceError as exc:
        return error_response(str(exc))

    return success_response(
        {
            "firebase_custom_token": token,
            "firebase_uid": current_student.firebase_uid,
        }
    )
