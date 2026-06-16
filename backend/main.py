import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, Request
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

# ---------------------------------------------------------------------------
# Active Defense: in-memory store of permanently banned attacker IPs
# ---------------------------------------------------------------------------
banned_ips: set = set()


@app.middleware("http")
async def ip_ban_middleware(request: Request, call_next):
    """Block any request whose origin IP is in the banned_ips set."""
    client_ip = request.client.host
    if client_ip in banned_ips:
        return JSONResponse(
            status_code=403,
            content={
                "error": "SECURITY ALERT",
                "message": (
                    "Your IP has been permanently banned due to suspicious activity. "
                    "Incident reported."
                ),
            },
        )
    return await call_next(request)


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

# Static file serving for uploads with CORS headers
from backend.app.core.config import BACKEND_DIR

class CORSStaticFiles(StaticFiles):
    async def __call__(self, scope, receive, send):
        async def respond(message):
            if message["type"] == "http.response.start":
                headers = dict(message.setdefault("headers", []))
                # Add CORS header
                message["headers"].append((b"access-control-allow-origin", b"*"))
            await send(message)
        await super().__call__(scope, receive, respond)

UPLOAD_DIR_ABS = os.path.join(BACKEND_DIR, settings.UPLOAD_DIR)
os.makedirs(UPLOAD_DIR_ABS, exist_ok=True)
app.mount(f"/api/v1/{settings.UPLOAD_DIR}", CORSStaticFiles(directory=UPLOAD_DIR_ABS), name="uploads")

PROFILES_DIR_ABS = os.path.join(BACKEND_DIR, "uploads", "profiles")
os.makedirs(PROFILES_DIR_ABS, exist_ok=True)
app.mount("/api/v1/uploads/profiles", CORSStaticFiles(directory=PROFILES_DIR_ABS), name="profiles")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Honeytoken Trap Endpoint — intentionally hidden from all frontend features.
# Any client that probes this path is immediately banned.
# ---------------------------------------------------------------------------
@app.get("/api/v1/system/config/db-backup", include_in_schema=False)
async def honeytoken_trap(request: Request):
    """Hidden trap endpoint. Accessing it triggers an automatic IP ban."""
    attacker_ip = request.client.host
    banned_ips.add(attacker_ip)
    return JSONResponse(
        status_code=401,
        content={"detail": "Trap triggered. You have been blocked."},
    )
