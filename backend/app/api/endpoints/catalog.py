from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_admin, get_current_user
from backend.app.core.database import get_db
from backend.app.models.building import Building
from backend.app.models.room import Room
from backend.app.schemas.response import APIResponse, error_response, success_response
from backend.app.services.audit import write_audit_log

router = APIRouter()


class BuildingCreateRequest(BaseModel):
    building_name: str
    gender_type: str
    status: str = "active"


class BuildingUpdateRequest(BaseModel):
    building_name: str | None = None
    gender_type: str | None = None
    status: str | None = None


class RoomCreateRequest(BaseModel):
    dorm_id: int
    room_number: str
    total_beds: int
    available_beds: int
    dominant_preferences: str | None = None
    status: str = "active"


class RoomUpdateRequest(BaseModel):
    room_number: str | None = None
    total_beds: int | None = None
    available_beds: int | None = None
    dominant_preferences: str | None = None
    status: str | None = None


@router.get("/catalog/buildings", response_model=APIResponse[dict])
def list_buildings(
    gender_type: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Building)
    if gender_type:
        query = query.filter(Building.gender_type == gender_type)
    if status:
        query = query.filter(Building.status == status)
    items = query.order_by(Building.dorm_id.desc()).all()
    return success_response(
        {
            "items": [
                {
                    "dorm_id": b.dorm_id,
                    "building_name": b.building_name,
                    "gender_type": b.gender_type,
                    "status": b.status,
                }
                for b in items
            ],
            "count": len(items),
        }
    )


@router.post("/admin/catalog/buildings", response_model=APIResponse[dict])
def create_building(
    payload: BuildingCreateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.gender_type not in {"M", "F"}:
        return error_response("gender_type must be M or F")
    if payload.status not in {"active", "maintenance", "inactive"}:
        return error_response("Invalid building status")

    building = Building(
        building_name=payload.building_name,
        gender_type=payload.gender_type,
        status=payload.status,
    )
    db.add(building)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="building_created",
        entity_type="building",
        entity_id=building.dorm_id,
        after_state={"status": building.status, "gender_type": building.gender_type},
    )
    db.commit()
    db.refresh(building)
    return success_response({"dorm_id": building.dorm_id})


@router.put("/admin/catalog/buildings/{dorm_id}", response_model=APIResponse[dict])
def update_building(
    dorm_id: int,
    payload: BuildingUpdateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    building = db.query(Building).filter(Building.dorm_id == dorm_id).first()
    if not building:
        return error_response("Building not found")

    before = {
        "building_name": building.building_name,
        "gender_type": building.gender_type,
        "status": building.status,
    }
    if payload.building_name is not None:
        building.building_name = payload.building_name
    if payload.gender_type is not None:
        if payload.gender_type not in {"M", "F"}:
            return error_response("gender_type must be M or F")
        building.gender_type = payload.gender_type
    if payload.status is not None:
        if payload.status not in {"active", "maintenance", "inactive"}:
            return error_response("Invalid building status")
        building.status = payload.status
    building.updated_at = datetime.now(timezone.utc)

    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="building_updated",
        entity_type="building",
        entity_id=building.dorm_id,
        before_state=before,
        after_state={
            "building_name": building.building_name,
            "gender_type": building.gender_type,
            "status": building.status,
        },
    )
    db.commit()
    return success_response({"dorm_id": building.dorm_id, "status": building.status})


@router.get("/catalog/rooms", response_model=APIResponse[dict])
def list_rooms(
    dorm_id: int | None = None,
    available_only: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Room)
    if dorm_id is not None:
        query = query.filter(Room.dorm_id == dorm_id)
    if available_only:
        query = query.filter(Room.available_beds > 0)
    items = query.order_by(Room.room_id.desc()).all()
    return success_response(
        {
            "items": [
                {
                    "room_id": room.room_id,
                    "dorm_id": room.dorm_id,
                    "room_number": room.room_number,
                    "total_beds": room.total_beds,
                    "available_beds": room.available_beds,
                    "status": room.status,
                }
                for room in items
            ],
            "count": len(items),
        }
    )


@router.post("/admin/catalog/rooms", response_model=APIResponse[dict])
def create_room(
    payload: RoomCreateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if payload.total_beds <= 0:
        return error_response("total_beds must be greater than zero")
    if payload.available_beds < 0 or payload.available_beds > payload.total_beds:
        return error_response("available_beds must be between 0 and total_beds")

    building = db.query(Building).filter(Building.dorm_id == payload.dorm_id).first()
    if not building:
        return error_response("Building not found")

    existing_room = db.query(Room).filter(
        Room.dorm_id == payload.dorm_id, Room.room_number == payload.room_number
    ).first()
    if existing_room:
        return error_response(f"Room {payload.room_number} already exists in this building")

    room = Room(
        dorm_id=payload.dorm_id,
        room_number=payload.room_number,
        total_beds=payload.total_beds,
        available_beds=payload.available_beds,
        dominant_preferences=payload.dominant_preferences,
        status=payload.status,
    )
    db.add(room)
    db.flush()
    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="room_created",
        entity_type="room",
        entity_id=room.room_id,
        after_state={
            "dorm_id": room.dorm_id,
            "total_beds": room.total_beds,
            "available_beds": room.available_beds,
        },
    )
    db.commit()
    db.refresh(room)
    return success_response({"room_id": room.room_id})


@router.put("/admin/catalog/rooms/{room_id}", response_model=APIResponse[dict])
def update_room(
    room_id: int,
    payload: RoomUpdateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        return error_response("Room not found")

    before = {
        "room_number": room.room_number,
        "total_beds": room.total_beds,
        "available_beds": room.available_beds,
        "status": room.status,
    }
    if payload.room_number is not None:
        if payload.room_number != room.room_number:
            existing = db.query(Room).filter(
                Room.dorm_id == room.dorm_id, Room.room_number == payload.room_number
            ).first()
            if existing:
                return error_response(f"Room {payload.room_number} already exists in this building")
        room.room_number = payload.room_number
    if payload.total_beds is not None:
        if payload.total_beds <= 0:
            return error_response("total_beds must be greater than zero")
        room.total_beds = payload.total_beds
        if room.available_beds > room.total_beds:
            room.available_beds = room.total_beds
    if payload.available_beds is not None:
        if payload.available_beds < 0:
            return error_response("available_beds cannot be negative")
        room.available_beds = payload.available_beds
    if payload.dominant_preferences is not None:
        room.dominant_preferences = payload.dominant_preferences
    if payload.status is not None:
        room.status = payload.status
    room.updated_at = datetime.now(timezone.utc)

    write_audit_log(
        db=db,
        actor_role="admin",
        actor_id=admin.admin_id,
        action="room_updated",
        entity_type="room",
        entity_id=room.room_id,
        before_state=before,
        after_state={
            "room_number": room.room_number,
            "total_beds": room.total_beds,
            "available_beds": room.available_beds,
            "status": room.status,
        },
    )
    db.commit()
    return success_response({"room_id": room.room_id})
