import os

from pydantic import model_validator
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            os.path.join(BACKEND_DIR, ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Saknny API"
    SECRET_KEY: str = "saknny_super_secret_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql://saknny_admin:saknny_secret_2026@localhost:5433/saknny"
    AUTO_CREATE_TABLES: bool = True
    
    # AI API Keys
    GEMINI_API_KEY: str | None = None

    # Uploads
    UPLOAD_DIR: str = "uploads/verification_docs"

    # Firebase
    FIREBASE_ENABLED: bool = False
    FIREBASE_PROJECT_ID: str | None = None
    FIREBASE_CREDENTIALS_PATH: str | None = None
    FIRESTORE_EVENTS_COLLECTION: str = "mobile_event_log"
    ATTENDANCE_SYNC_VIA_FIREBASE: bool = True

    # Attendance policy
    UNIVERSITY_TIMEZONE: str = "Africa/Cairo"

    @model_validator(mode="after")
    def validate_firebase_settings(self):
        if not self.FIREBASE_ENABLED:
            return self
        if not self.FIREBASE_PROJECT_ID:
            raise ValueError("FIREBASE_PROJECT_ID is required when FIREBASE_ENABLED=true")
        if not self.FIREBASE_CREDENTIALS_PATH:
            raise ValueError("FIREBASE_CREDENTIALS_PATH is required when FIREBASE_ENABLED=true")
        if not os.path.isfile(self.FIREBASE_CREDENTIALS_PATH):
            raise ValueError(
                f"FIREBASE_CREDENTIALS_PATH does not exist: {self.FIREBASE_CREDENTIALS_PATH}"
            )
        return self


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
