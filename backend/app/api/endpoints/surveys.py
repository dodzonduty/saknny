from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.student import Student
from backend.app.models.survey import Survey, SurveyDispatch
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class CreateSurveyRequest(BaseModel):
    title: str
    description: str | None = None
    is_active: bool = True


class DispatchSurveyRequest(BaseModel):
    student_ids: list[int] | None = None


class CompleteSurveyRequest(BaseModel):
    response_payload: dict


@router.post("/admin/surveys", response_model=APIResponse[dict])
def create_survey(
    payload: CreateSurveyRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    survey = Survey(
        title=payload.title,
        description=payload.description,
        is_active=payload.is_active,
        created_by=admin.admin_id,
    )
    db.add(survey)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="survey_created",
        entity_type="survey",
        entity_id=survey.survey_id,
    )
    db.commit()
    db.refresh(survey)
    return success_response({"survey_id": survey.survey_id})


@router.post("/admin/surveys/{survey_id}/dispatch", response_model=APIResponse[dict])
def dispatch_survey(
    survey_id: int,
    payload: DispatchSurveyRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    survey = db.query(Survey).filter(Survey.survey_id == survey_id).first()
    if not survey:
        return error_response("Survey not found")

    if payload.student_ids:
        students = db.query(Student).filter(Student.student_id.in_(payload.student_ids)).all()
    else:
        students = db.query(Student).all()

    created = 0
    for student in students:
        exists = (
            db.query(SurveyDispatch)
            .filter(
                SurveyDispatch.survey_id == survey.survey_id,
                SurveyDispatch.student_id == student.student_id,
            )
            .first()
        )
        if exists:
            continue
        db.add(
            SurveyDispatch(
                survey_id=survey.survey_id,
                student_id=student.student_id,
                status="sent",
            )
        )
        created += 1

    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="survey_dispatched",
        entity_type="survey",
        entity_id=survey.survey_id,
        after_state={"dispatched_count": created},
    )
    db.commit()
    return success_response({"survey_id": survey.survey_id, "dispatched_count": created})


@router.get("/surveys/me", response_model=APIResponse[dict])
def my_surveys(db: Session = Depends(get_db), student=Depends(get_current_student)):
    rows = (
        db.query(SurveyDispatch, Survey.title)
        .join(Survey, Survey.survey_id == SurveyDispatch.survey_id)
        .filter(SurveyDispatch.student_id == student.student_id)
        .order_by(SurveyDispatch.sent_at.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "dispatch_id": dispatch.dispatch_id,
                    "survey_id": dispatch.survey_id,
                    "title": title,
                    "status": dispatch.status,
                    "sent_at": dispatch.sent_at,
                    "completed_at": dispatch.completed_at,
                }
                for dispatch, title in rows
            ],
            "count": len(rows),
        }
    )


@router.post("/surveys/{dispatch_id}/complete", response_model=APIResponse[dict])
def complete_survey(
    dispatch_id: int,
    payload: CompleteSurveyRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    dispatch = (
        db.query(SurveyDispatch)
        .filter(
            SurveyDispatch.dispatch_id == dispatch_id,
            SurveyDispatch.student_id == student.student_id,
        )
        .first()
    )
    if not dispatch:
        return error_response("Survey dispatch not found")

    dispatch.status = "completed"
    dispatch.response_payload = payload.response_payload
    dispatch.completed_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="survey_completed",
        entity_type="survey_dispatch",
        entity_id=dispatch.dispatch_id,
        after_state={"status": dispatch.status},
    )
    db.commit()
    return success_response({"dispatch_id": dispatch.dispatch_id, "status": dispatch.status})
