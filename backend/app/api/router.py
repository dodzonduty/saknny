from fastapi import APIRouter
from backend.app.api.endpoints import auth, students, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
