# Backend Issue: Student Registration Failing (HTTP 500)

## Summary of the Issue
During frontend testing, the "Create Account" (student registration) flow was failing. Initially, this presented as a "failed to fetch" network error on Windows (due to `localhost` resolving to IPv6 `::1` while Uvicorn was listening on IPv4 `127.0.0.1`). This frontend configuration was resolved.

Once the frontend successfully reached the backend API (`POST /api/v1/students/register`), the backend server crashed with an **HTTP 500 Internal Server Error**.

## The Error Log
The backend terminal outputs the following fatal exception:
```
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedColumn) column students.biometric_unlock_enabled does not exist
LINE 1: ...se_uid, students.fcm_token AS students_fcm_token, students.b...
```

## Root Cause
The `Student` model in SQLAlchemy (`backend/app/models/student.py`) has been updated to include new fields, notably:
- `biometric_unlock_enabled`
- `trusted_device_id`
- `trusted_device_registered_at`

However, the local database schema has not been updated to reflect these new columns. Since `Base.metadata.create_all()` in `main.py` does not alter existing tables to add missing columns, any database query attempting to interact with the `students` table fails.

## Requirements for the Backend Developer
Please resolve this database schema synchronization issue so the frontend team can continue testing the registration flow. 

**Action Items:**
1. **Database Migration:** Generate and apply the necessary database migrations (e.g., via Alembic) to add the missing columns (`biometric_unlock_enabled`, etc.) to the `students` table.
2. **Schema Update:** If Alembic migrations are already present in the codebase, please ensure the team is instructed on how to properly sync their local databases, or update the database initialization scripts accordingly.
