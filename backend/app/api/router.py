from fastapi import APIRouter
from backend.app.api.endpoints import (
    admin,
    ai,
    attendance,
    applications,
    allocations,
    auth,
    billing,
    catalog,
    communications,
    insights,
    leases,
    maintenance,
    mobile_auth,
    residency,
    students,
    surveys,
    compatibility,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(attendance.router, tags=["attendance"])
api_router.include_router(mobile_auth.router, tags=["mobile-auth"])
api_router.include_router(catalog.router, tags=["catalog"])
api_router.include_router(applications.router, tags=["applications"])
api_router.include_router(allocations.router, tags=["allocations"])
api_router.include_router(leases.router, tags=["contracts"])
api_router.include_router(billing.router, tags=["billing"])
api_router.include_router(maintenance.router, tags=["maintenance"])
api_router.include_router(residency.router, tags=["residency"])
api_router.include_router(communications.router, tags=["communications"])
api_router.include_router(insights.router, tags=["insights"])
api_router.include_router(surveys.router, tags=["surveys"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(compatibility.router, tags=["compatibility"])
