import os
from pydantic_settings import BaseSettings

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Saknny API"
    SECRET_KEY: str = "saknny_super_secret_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql://saknny_admin:saknny_secret_2026@localhost:5433/saknny"
    AUTO_CREATE_TABLES: bool = True
    
    # Uploads
    UPLOAD_DIR: str = "uploads/verification_docs"

    # Firebase
    FIREBASE_ENABLED: bool = False
    FIREBASE_PROJECT_ID: str | None = None
    FIREBASE_CREDENTIALS_PATH: str | None = None

    # Attendance policy
    UNIVERSITY_TIMEZONE: str = "Africa/Cairo"
    
settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
