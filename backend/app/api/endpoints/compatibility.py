from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_student
from backend.app.core.database import get_db
from backend.app.models.compatibility import (
    CompatibilityQuestionnaire,
    CompatibilityResponse,
    ClusteringSession,
    ClusteringResult,
)
from backend.app.models.student import Student
from backend.app.models.application import Application
from backend.app.models.allocation import Allocation
from backend.app.models.room import Room
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.schemas.compatibility import (
    CompatibilityQuestionnaireCreate,
    CompatibilityResponseCreate,
    ClusterRequest,
    AutoAssignRequest,
)
from backend.app.services.questionnaire_definitions import COMPATIBILITY_QUESTIONS, get_valid_choices
from backend.app.services.ai.clustering import RoommateClusteringService
from backend.app.services.audit import write_audit_log

router = APIRouter()


@router.post("/admin/compatibility/questionnaires", response_model=APIResponse[dict])
def create_questionnaire(
    payload: CompatibilityQuestionnaireCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    obj = CompatibilityQuestionnaire(
        title=payload.title,
        description=payload.description,
        target_gender=payload.target_gender,
        target_dorm_id=payload.target_dorm_id,
        created_by=admin.admin_id,
    )
    db.add(obj)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="compatibility_questionnaire_created",
        entity_type="compatibility_questionnaire",
        entity_id=obj.questionnaire_id,
    )
    db.commit()
    db.refresh(obj)
    return success_response({"questionnaire_id": obj.questionnaire_id})


@router.get("/admin/compatibility/questionnaires", response_model=APIResponse[dict])
def list_questionnaires(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    qs = db.query(CompatibilityQuestionnaire).order_by(CompatibilityQuestionnaire.created_at.desc()).all()
    items = [
        {
            "questionnaire_id": q.questionnaire_id,
            "title": q.title,
            "target_gender": q.target_gender,
            "target_dorm_id": q.target_dorm_id,
            "is_active": q.is_active,
            "created_at": q.created_at,
        } for q in qs
    ]
    return success_response({"items": items, "count": len(items)})


@router.get("/admin/compatibility/questionnaires/{questionnaire_id}", response_model=APIResponse[dict])
def get_questionnaire_admin(questionnaire_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    q = db.query(CompatibilityQuestionnaire).filter(CompatibilityQuestionnaire.questionnaire_id == questionnaire_id).first()
    if not q:
        return error_response("Questionnaire not found")
    
    responses_count = db.query(CompatibilityResponse).filter(CompatibilityResponse.questionnaire_id == questionnaire_id).count()
    return success_response({
        "questionnaire_id": q.questionnaire_id,
        "title": q.title,
        "description": q.description,
        "target_gender": q.target_gender,
        "target_dorm_id": q.target_dorm_id,
        "is_active": q.is_active,
        "responses_count": responses_count,
        "created_at": q.created_at,
    })


@router.post("/admin/compatibility/questionnaires/{questionnaire_id}/dispatch", response_model=APIResponse[dict])
def dispatch_questionnaire(questionnaire_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    q = db.query(CompatibilityQuestionnaire).filter(CompatibilityQuestionnaire.questionnaire_id == questionnaire_id).first()
    if not q:
        return error_response("Questionnaire not found")

    # This creates a log that dispatch happened. No dispatch rows are strictly needed for responses 
    # since eligible students can just fetch it directly, but we write an audit log.
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="compatibility_questionnaire_dispatched",
        entity_type="compatibility_questionnaire",
        entity_id=q.questionnaire_id,
    )
    db.commit()
    return success_response({"status": "dispatched"})


@router.get("/compatibility/questionnaires/me", response_model=APIResponse[dict])
def get_student_questionnaires(db: Session = Depends(get_db), student=Depends(get_current_student)):
    # Find active questionnaire matching student gender
    q = db.query(CompatibilityQuestionnaire).filter(
        CompatibilityQuestionnaire.is_active == True,
        (CompatibilityQuestionnaire.target_gender == None) | (CompatibilityQuestionnaire.target_gender == student.gender)
    ).order_by(CompatibilityQuestionnaire.created_at.desc()).first()
    
    if not q:
        return success_response({"questionnaire": None})

    # Return the hardcoded questions
    return success_response({
        "questionnaire": {
            "questionnaire_id": q.questionnaire_id,
            "title": q.title,
            "description": q.description,
            "questions": COMPATIBILITY_QUESTIONS
        }
    })


@router.post("/compatibility/responses", response_model=APIResponse[dict])
def submit_response(payload: CompatibilityResponseCreate, db: Session = Depends(get_db), student=Depends(get_current_student)):
    q = db.query(CompatibilityQuestionnaire).filter(CompatibilityQuestionnaire.questionnaire_id == payload.questionnaire_id).first()
    if not q:
        return error_response("Questionnaire not found")
    
    # Check if existing
    existing = db.query(CompatibilityResponse).filter(
        CompatibilityResponse.questionnaire_id == payload.questionnaire_id,
        CompatibilityResponse.student_id == student.student_id
    ).first()
    if existing:
        return error_response("Response already submitted")

    # Validate answers
    valid_choices = get_valid_choices()
    for q_code, val_set in valid_choices.items():
        if q_code not in payload.answers:
            return error_response(f"Missing answer for {q_code}")
        if payload.answers[q_code] not in val_set:
            return error_response(f"Invalid answer for {q_code}")

    # Compute feature vector (call Role D service, currently stubbed)
    service = RoommateClusteringService()
    try:
        feature_vector = service.vectorize_answers(payload.answers)
        status = "vectorized"
    except NotImplementedError:
        # Fallback if Role D hasn't implemented it yet
        feature_vector = None
        status = "submitted"

    resp = CompatibilityResponse(
        questionnaire_id=payload.questionnaire_id,
        student_id=student.student_id,
        answers=payload.answers,
        feature_vector=feature_vector,
        status=status
    )
    db.add(resp)
    db.commit()
    db.refresh(resp)
    return success_response({"response_id": resp.response_id, "status": resp.status})


@router.get("/compatibility/responses/me", response_model=APIResponse[dict])
def get_my_responses(db: Session = Depends(get_db), student=Depends(get_current_student)):
    responses = db.query(CompatibilityResponse).filter(CompatibilityResponse.student_id == student.student_id).all()
    items = [
        {
            "response_id": r.response_id,
            "questionnaire_id": r.questionnaire_id,
            "answers": r.answers,
            "status": r.status,
            "submitted_at": r.submitted_at,
        } for r in responses
    ]
    return success_response({"items": items, "count": len(items)})


@router.post("/admin/compatibility/cluster", response_model=APIResponse[dict])
def trigger_clustering(payload: ClusterRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    service = RoommateClusteringService()
    
    responses = db.query(CompatibilityResponse).filter(
        CompatibilityResponse.questionnaire_id == payload.questionnaire_id,
        CompatibilityResponse.feature_vector != None
    ).all()

    if not responses:
        return error_response("No vectorized responses found to cluster")

    vectors = [r.feature_vector for r in responses]
    k = payload.k or 5  # Replace with actual logic or Role D handling

    try:
        result = service.run_clustering(vectors, k)
    except NotImplementedError:
        return error_response("Clustering service not yet implemented")

    # Assuming result contains labels matching the order of vectors
    session = ClusteringSession(
        questionnaire_id=payload.questionnaire_id,
        dorm_id=payload.dorm_id,
        k_value=k,
        total_students=len(responses),
        run_by=admin.admin_id
    )
    db.add(session)
    db.flush()

    for idx, r in enumerate(responses):
        label = result["labels"][idx]
        distance = result["distances"][idx]
        c_res = ClusteringResult(
            session_id=session.session_id,
            student_id=r.student_id,
            cluster_label=label,
            distance_to_centroid=distance
        )
        db.add(c_res)
    
    db.commit()
    db.refresh(session)
    return success_response({"session_id": session.session_id})


@router.get("/admin/compatibility/sessions", response_model=APIResponse[dict])
def list_sessions(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    sessions = db.query(ClusteringSession).order_by(ClusteringSession.created_at.desc()).all()
    items = [
        {
            "session_id": s.session_id,
            "questionnaire_id": s.questionnaire_id,
            "dorm_id": s.dorm_id,
            "k_value": s.k_value,
            "total_students": s.total_students,
            "status": s.status,
            "created_at": s.created_at,
        } for s in sessions
    ]
    return success_response({"items": items, "count": len(items)})


@router.get("/admin/compatibility/sessions/{session_id}", response_model=APIResponse[dict])
def get_session(session_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    session = db.query(ClusteringSession).filter(ClusteringSession.session_id == session_id).first()
    if not session:
        return error_response("Session not found")
    
    results = db.query(ClusteringResult).filter(ClusteringResult.session_id == session_id).all()
    clusters = {}
    for r in results:
        if r.cluster_label not in clusters:
            clusters[r.cluster_label] = {"size": 0, "students": []}
        clusters[r.cluster_label]["size"] += 1
        clusters[r.cluster_label]["students"].append({
            "student_id": r.student_id,
            "distance_to_centroid": r.distance_to_centroid,
            "assigned_room_id": r.assigned_room_id
        })
    
    return success_response({
        "session_id": session.session_id,
        "k_value": session.k_value,
        "total_students": session.total_students,
        "status": session.status,
        "clusters": [{"cluster_label": k, **v} for k, v in clusters.items()]
    })


@router.get("/admin/compatibility/sessions/{session_id}/preview", response_model=APIResponse[dict])
def preview_assignments(session_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    session = db.query(ClusteringSession).filter(ClusteringSession.session_id == session_id).first()
    if not session:
        return error_response("Session not found")

    service = RoommateClusteringService()
    try:
        # Fetch actual cluster sizes
        results = db.query(ClusteringResult).filter(ClusteringResult.session_id == session_id).all()
        cluster_sizes = {}
        for r in results:
            cluster_sizes[r.cluster_label] = cluster_sizes.get(r.cluster_label, 0) + 1
            
        # Fetch actual room capacities for the target dorm
        rooms = db.query(Room).filter(Room.dorm_id == session.dorm_id, Room.available_beds > 0, Room.status == 'active').all()
        available_rooms = [
            {"room_id": room.room_id, "available_beds": room.available_beds}
            for room in rooms
        ]
        
        return success_response({"suggested_assignments": service.suggest_room_assignments(cluster_sizes, available_rooms)})
    except NotImplementedError:
        return error_response("Clustering service not yet implemented")


@router.post("/admin/compatibility/sessions/{session_id}/auto-assign", response_model=APIResponse[dict])
def execute_auto_assign(session_id: int, payload: AutoAssignRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    session = db.query(ClusteringSession).filter(ClusteringSession.session_id == session_id).first()
    if not session:
        return error_response("Session not found")
    
    if session.status == "assigned":
        return error_response("Session already assigned")
    
    results = db.query(ClusteringResult).filter(ClusteringResult.session_id == session_id).all()
    allocations_created = 0
    
    for r in results:
        label_str = str(r.cluster_label)
        if label_str in payload.room_assignments:
            room_id = payload.room_assignments[label_str]
            room = db.query(Room).filter(Room.room_id == room_id).first()
            if not room or room.available_beds <= 0:
                continue # Skip if room full or invalid
            
            # Check if student already has allocation
            existing_alloc = db.query(Allocation).filter(Allocation.student_id == r.student_id).first()
            if existing_alloc:
                continue
                
            alloc = Allocation(
                student_id=r.student_id,
                room_id=room.room_id,
                admin_id=admin.admin_id,
                plan=payload.plan,
                status="assigned"
            )
            db.add(alloc)
            room.available_beds -= 1
            room.updated_at = datetime.now(timezone.utc)
            r.assigned_room_id = room.room_id
            allocations_created += 1

    session.status = "assigned"
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="compatibility_auto_assigned",
        entity_type="clustering_session",
        entity_id=session.session_id,
        after_state={"allocations_created": allocations_created}
    )
    db.commit()
    
    return success_response({"allocations_created": allocations_created})
