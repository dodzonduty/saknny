from __future__ import annotations

from dataclasses import dataclass

from backend.app.core.config import settings


class FirebaseServiceError(Exception):
    pass


@dataclass
class FirebaseUserPayload:
    email: str
    password: str
    display_name: str | None = None


_firebase_initialized = False


def _ensure_firebase_initialized():
    global _firebase_initialized

    if not settings.FIREBASE_ENABLED:
        raise FirebaseServiceError("Firebase integration is disabled")

    if _firebase_initialized:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError as exc:
        raise FirebaseServiceError("firebase-admin package is not installed") from exc

    if not settings.FIREBASE_CREDENTIALS_PATH:
        raise FirebaseServiceError("FIREBASE_CREDENTIALS_PATH is not configured")

    try:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
    except ValueError:
        # Already initialized in this process
        pass
    except Exception as exc:
        raise FirebaseServiceError(f"Failed to initialize Firebase Admin SDK: {exc}") from exc

    _firebase_initialized = True


def create_firebase_user(payload: FirebaseUserPayload) -> str:
    _ensure_firebase_initialized()
    from firebase_admin import auth

    try:
        user = auth.create_user(
            email=payload.email,
            password=payload.password,
            display_name=payload.display_name,
        )
        return user.uid
    except Exception as exc:
        raise FirebaseServiceError(f"Failed to create Firebase user: {exc}") from exc


def delete_firebase_user(uid: str) -> None:
    _ensure_firebase_initialized()
    from firebase_admin import auth

    try:
        auth.delete_user(uid)
    except Exception as exc:
        raise FirebaseServiceError(f"Failed to delete Firebase user '{uid}': {exc}") from exc


def create_custom_token(uid: str) -> str:
    _ensure_firebase_initialized()
    from firebase_admin import auth

    try:
        token = auth.create_custom_token(uid)
        return token.decode("utf-8")
    except Exception as exc:
        raise FirebaseServiceError(f"Failed to create Firebase custom token: {exc}") from exc


def send_push_notification(token: str, title: str, body: str, data: dict | None = None) -> str:
    _ensure_firebase_initialized()
    from firebase_admin import messaging

    try:
        message = messaging.Message(
            token=token,
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
        )
        return messaging.send(message)
    except Exception as exc:
        raise FirebaseServiceError(f"Failed to send FCM notification: {exc}") from exc
