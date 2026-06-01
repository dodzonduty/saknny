"""
Backfill Firebase users for existing PostgreSQL students.

Use after configuring backend/.env with:
    FIREBASE_ENABLED=true
    FIREBASE_PROJECT_ID=saknny-dev
    FIREBASE_CREDENTIALS_PATH=<absolute path to service account JSON>

Run:
    python -m scripts.backfill_firebase_users --dry-run
    python -m scripts.backfill_firebase_users
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from firebase_admin import auth  # noqa: E402

from backend.app.core.database import SessionLocal  # noqa: E402
from backend.app.models.student import Student  # noqa: E402
from backend.app.services.firebase import FirebaseServiceError, _ensure_firebase_initialized  # noqa: E402


def get_or_create_firebase_uid(email: str, display_name: str | None) -> str:
    try:
        existing_user = auth.get_user_by_email(email)
        return existing_user.uid
    except auth.UserNotFoundError:
        created_user = auth.create_user(email=email, display_name=display_name)
        return created_user.uid


def backfill(dry_run: bool) -> int:
    _ensure_firebase_initialized()
    db = SessionLocal()
    updated_count = 0

    try:
        students = (
            db.query(Student)
            .filter(Student.firebase_uid.is_(None))
            .order_by(Student.student_id.asc())
            .all()
        )

        for student in students:
            firebase_uid = get_or_create_firebase_uid(student.email, student.name)
            print(f"{student.student_id}: {student.email} -> {firebase_uid}")

            if not dry_run:
                student.firebase_uid = firebase_uid
                updated_count += 1

        if dry_run:
            db.rollback()
        else:
            db.commit()

        return updated_count
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        updated_count = backfill(dry_run=args.dry_run)
    except FirebaseServiceError as exc:
        print(f"Firebase configuration error: {exc}")
        raise SystemExit(1) from exc

    if args.dry_run:
        print("Dry run complete. No PostgreSQL rows were updated.")
    else:
        print(f"Backfill complete. Updated {updated_count} PostgreSQL student rows.")


if __name__ == "__main__":
    main()
