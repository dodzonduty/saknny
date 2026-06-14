from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.application import Application
from backend.app.models.application_review import ApplicationReview
from backend.app.models.building import Building
from backend.app.models.student import Student
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class SubmitApplicationRequest(BaseModel):
    preferred_dorm_id: int | None = None
    notes: str | None = None


class ReviewApplicationRequest(BaseModel):
    status: str
    review_action: str
    comments: str | None = None


class FinalizeApplicationRequest(BaseModel):
    status: str
    comments: str | None = None


@router.post("/applications", response_model=APIResponse[dict])
def submit_application(
    payload: SubmitApplicationRequest,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    if not student.enroll_status:
        return error_response("Student must be enrollment-verified before applying")

    active_count = db.query(Application).filter(
        Application.student_id == student.student_id,
        Application.status.in_(["submitted", "under_review", "approved", "waitlisted"]),
    ).count()
    if active_count > 0:
        return error_response("Student already has an active application")

    if payload.preferred_dorm_id is not None:
        building = db.query(Building).filter(Building.dorm_id == payload.preferred_dorm_id).first()
        if not building:
            return error_response("Preferred building not found")
        if building.gender_type != student.gender:
            return error_response("Preferred building is not compatible with student gender")

    app = Application(
        student_id=student.student_id,
        preferred_dorm_id=payload.preferred_dorm_id,
        notes=payload.notes,
        status="submitted",
    )
    db.add(app)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="application_submitted",
        entity_type="application",
        entity_id=app.app_id,
        after_state={"status": app.status},
    )
    db.commit()
    db.refresh(app)
    return success_response({"app_id": app.app_id, "status": app.status})


@router.get("/applications/me", response_model=APIResponse[dict])
def my_applications(db: Session = Depends(get_db), student=Depends(get_current_student)):
    items = (
        db.query(Application, Building.building_name)
        .outerjoin(Building, Building.dorm_id == Application.preferred_dorm_id)
        .filter(Application.student_id == student.student_id)
        .order_by(Application.submission_date.desc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "app_id": app.app_id,
                    "preferred_dorm_id": app.preferred_dorm_id,
                    "preferred_dorm_name": building_name,
                    "status": app.status,
                    "waitlist_position": app.waitlist_position,
                    "submission_date": app.submission_date,
                    "next_actions": "await_admin_review"
                    if app.status in {"submitted", "under_review"}
                    else "see_decision",
                }
                for app, building_name in items
            ],
            "count": len(items),
        }
    )


@router.post("/applications/{app_id}/waitlist", response_model=APIResponse[dict])
def join_waitlist(app_id: int, db: Session = Depends(get_db), student=Depends(get_current_student)):
    app = (
        db.query(Application)
        .filter(Application.app_id == app_id, Application.student_id == student.student_id)
        .first()
    )
    if not app:
        return error_response("Application not found")

    if app.status in {"approved", "rejected"}:
        return error_response("Cannot waitlist finalized application")

    max_position = (
        db.query(func.max(Application.waitlist_position))
        .filter(Application.status == "waitlisted")
        .scalar()
    )
    app.status = "waitlisted"
    app.waitlist_position = (max_position or 0) + 1
    app.updated_at = datetime.now(timezone.utc)
    write_audit_log(
        db=db,
        actor_role="student",
        actor_id=student.student_id,
        action="application_waitlisted",
        entity_type="application",
        entity_id=app.app_id,
        after_state={"status": app.status, "waitlist_position": app.waitlist_position},
    )
    db.commit()
    return success_response(
        {"app_id": app.app_id, "status": app.status, "waitlist_position": app.waitlist_position}
    )


@router.get("/admin/applications", response_model=APIResponse[dict])
def list_admin_applications(
    status: str = "submitted",
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    items = (
        db.query(Application, Student.name, Building.building_name)
        .join(Student, Student.student_id == Application.student_id)
        .outerjoin(Building, Building.dorm_id == Application.preferred_dorm_id)
        .filter(Application.status == status)
        .order_by(Application.submission_date.asc())
        .all()
    )
    return success_response(
        {
            "items": [
                {
                    "app_id": app.app_id,
                    "student_id": app.student_id,
                    "student_name": student_name,
                    "status": app.status,
                    "preferred_dorm_id": app.preferred_dorm_id,
                    "preferred_dorm_name": building_name,
                    "submission_date": app.submission_date,
                }
                for app, student_name, building_name in items
            ],
            "count": len(items),
        }
    )


@router.get("/admin/applications/{app_id}", response_model=APIResponse[dict])
def get_admin_application(
    app_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    item = (
        db.query(Application, Student.name, Building.building_name)
        .join(Student, Student.student_id == Application.student_id)
        .outerjoin(Building, Building.dorm_id == Application.preferred_dorm_id)
        .filter(Application.app_id == app_id)
        .first()
    )
    if not item:
        return error_response("Application not found")
        
    app, student_name, building_name = item
    return success_response(
        {
            "application": {
                "app_id": app.app_id,
                "student_id": app.student_id,
                "student_name": student_name,
                "status": app.status,
                "preferred_dorm_id": app.preferred_dorm_id,
                "preferred_dorm_name": building_name,
                "submission_date": app.submission_date,
            }
        }
    )


@router.put("/admin/applications/{app_id}/review", response_model=APIResponse[dict])
def review_application(
    app_id: int,
    payload: ReviewApplicationRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.status not in {"under_review", "waitlisted"}:
        return error_response("Review status must be under_review or waitlisted")

    app = db.query(Application).filter(Application.app_id == app_id).first()
    if not app:
        return error_response("Application not found")

    before = {"status": app.status}
    app.status = payload.status
    app.reviewed_by = admin.admin_id
    app.reviewed_at = datetime.now(timezone.utc)
    app.updated_at = datetime.now(timezone.utc)
    review = ApplicationReview(
        app_id=app.app_id,
        admin_id=admin.admin_id,
        review_action=payload.review_action,
        comments=payload.comments,
    )
    db.add(review)
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="application_reviewed",
        entity_type="application",
        entity_id=app.app_id,
        before_state=before,
        after_state={"status": app.status},
    )
    db.commit()
    return success_response({"app_id": app.app_id, "status": app.status})


@router.put("/admin/applications/{app_id}/finalize", response_model=APIResponse[dict])
def finalize_application(
    app_id: int,
    payload: FinalizeApplicationRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.status not in {"approved", "rejected"}:
        return error_response("Final status must be approved or rejected")

    app = db.query(Application).filter(Application.app_id == app_id).first()
    if not app:
        return error_response("Application not found")

    before = {"status": app.status}
    app.status = payload.status
    app.reviewed_by = admin.admin_id
    app.reviewed_at = datetime.now(timezone.utc)
    app.updated_at = datetime.now(timezone.utc)
    db.add(
        ApplicationReview(
            app_id=app.app_id,
            admin_id=admin.admin_id,
            review_action="application_finalized",
            comments=payload.comments,
        )
    )
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="application_finalized",
        entity_type="application",
        entity_id=app.app_id,
        before_state=before,
        after_state={"status": app.status},
    )
    db.commit()
    return success_response({"app_id": app.app_id, "status": app.status})
