import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.api.router import api_router
from backend.app.schemas.response import error_response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.app.core.database import engine
from backend.app.models import Base

# Keep optional auto-create for local development; production should use Alembic.
if settings.AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # Restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to map standard FastAPI validation errors to our API pattern
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc):
    return JSONResponse(
        status_code=422,
        content=error_response(f"Validation error: {exc}").model_dump()
    )

# Exception handler for general exceptions to return standardized error format
@app.exception_handler(Exception)
async def general_exception_handler(_request, exc):
    return JSONResponse(
        status_code=500,
        content=error_response(f"Internal server error: {str(exc)}").model_dump()
    )

# Static file serving for uploads
from backend.app.core.config import BACKEND_DIR
UPLOAD_DIR_ABS = os.path.join(BACKEND_DIR, settings.UPLOAD_DIR)
os.makedirs(UPLOAD_DIR_ABS, exist_ok=True)
app.mount(f"/api/v1/{settings.UPLOAD_DIR}", StaticFiles(directory=UPLOAD_DIR_ABS), name="uploads")

PROFILES_DIR_ABS = os.path.join(BACKEND_DIR, "uploads", "profiles")
os.makedirs(PROFILES_DIR_ABS, exist_ok=True)
app.mount("/api/v1/uploads/profiles", StaticFiles(directory=PROFILES_DIR_ABS), name="profiles")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
