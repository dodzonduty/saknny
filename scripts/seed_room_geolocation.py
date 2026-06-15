"""
Saknny – Room Geolocation Seed Script

Populates latitude, longitude, and allowed_radius_meters for all rooms
so that mobile attendance geofencing works correctly.

Coordinates are based on the Shoubra Faculty of Engineering – Benha University
campus area (approx 30.0825°N, 31.2515°E).

Each building is given a distinct but nearby position. All rooms in the same
building share that building's coordinates (since they're in the same physical
structure).

Usage:
    python -m scripts.seed_room_geolocation

Safe to re-run — it only UPDATEs existing rows.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal
from backend.app.models.building import Building
from backend.app.models.room import Room

# ──────────────────────────────────────────────────────────
# Building-level coordinates (around Shoubra campus area)
# Each building is offset ~50-150m from each other
# ──────────────────────────────────────────────────────────
BUILDING_COORDS = {
    # dorm_id: (latitude, longitude, description)
    1: (30.08250, 31.24520, "Credit – north side of campus"),
    2: (30.08310, 31.24580, "Mainstream – east wing"),
    3: (30.08200, 31.24480, "Credit 2 – south side"),
    4: (30.08280, 31.24630, "Building for men – northeast"),
}

# Default attendance radius in meters (100m is generous for dorm proximity)
DEFAULT_RADIUS_METERS = 100


def seed_room_geolocation():
    db = SessionLocal()
    try:
        buildings = db.query(Building).all()
        print(f"Found {len(buildings)} buildings\n")

        updated_count = 0

        for building in buildings:
            coords = BUILDING_COORDS.get(building.dorm_id)
            if not coords:
                print(f"  [SKIP] No coordinates defined for building dorm_id={building.dorm_id} ({building.building_name})")
                continue

            lat, lng, desc = coords
            print(f"  [BLDG] {building.building_name} (dorm_id={building.dorm_id})")
            print(f"     -> {lat:.6f}, {lng:.6f}  ({desc})")

            rooms = db.query(Room).filter(Room.dorm_id == building.dorm_id).all()
            if not rooms:
                print(f"     [SKIP] No rooms found for this building")
                continue

            for room in rooms:
                room.latitude = lat
                room.longitude = lng
                room.allowed_radius_meters = DEFAULT_RADIUS_METERS
                updated_count += 1
                print(f"     [OK] Room {room.room_number} (room_id={room.room_id}): lat={lat}, lng={lng}, radius={DEFAULT_RADIUS_METERS}m")

            print()

        db.commit()
        print(f"{'='*50}")
        print(f"  [DONE] Updated {updated_count} rooms with geolocation data")
        print(f"{'='*50}")

    except Exception as e:
        db.rollback()
        print(f"  [ERROR] {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_room_geolocation()
