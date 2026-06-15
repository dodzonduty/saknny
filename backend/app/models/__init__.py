"""
Saknny – Models Package (Role A: Data Layer)

Central import point for all SQLAlchemy ORM models.
Import `Base` from here to create / drop tables.
"""

from backend.app.core.database import Base  # noqa: F401

# ── Models ────────────────────────────────────────────────────────────
from backend.app.models.admin import Admin  # noqa: F401
from backend.app.models.student import Student  # noqa: F401
from backend.app.models.verification_document import VerificationDocument  # noqa: F401
from backend.app.models.building import Building  # noqa: F401
from backend.app.models.room import Room  # noqa: F401
from backend.app.models.application import Application  # noqa: F401
from backend.app.models.application_review import ApplicationReview  # noqa: F401
from backend.app.models.allocation import Allocation  # noqa: F401
from backend.app.models.lease import Lease  # noqa: F401
from backend.app.models.payment_intent import PaymentIntent  # noqa: F401
from backend.app.models.checkin import CheckIn  # noqa: F401
from backend.app.models.maintenance_ticket import MaintenanceTicket  # noqa: F401
from backend.app.models.verification_history import VerificationHistory  # noqa: F401
from backend.app.models.room_change_request import RoomChangeRequest  # noqa: F401
from backend.app.models.communication import Announcement, Message  # noqa: F401
from backend.app.models.audit_log import AuditLog  # noqa: F401
from backend.app.models.survey import Survey, SurveyDispatch  # noqa: F401
from backend.app.models.attendance_record import AttendanceRecord  # noqa: F401
from backend.app.models.firebase_sync import FirebaseSyncCursor, FirebaseSyncFailure  # noqa: F401
from backend.app.models.compatibility import (  # noqa: F401
    CompatibilityQuestionnaire,
    CompatibilityResponse,
    ClusteringSession,
    ClusteringResult,
)
