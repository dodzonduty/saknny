# Saknny Development Log

This file records architectural changes and major development events.

---

# Log Format

[EVENT_TYPE]

Entity: <API | Module | Service | Component | Schema | Model>
Name: <name>
Role: <A|B|C|D>
Path: <file_path>
Status: MOCK | REAL
Action: CREATED | IMPLEMENTED | REPLACED | UPDATED
Owner: <developer>
Notes: <optional>
Date: <YYYY-MM-DD>

---

# Example Entry

[API]

Entity: API
Name: GET /students
Role: B
Path: backend/app/api/students.py
Status: REAL
Action: IMPLEMENTED
Owner: Backend Engineer
Notes: Replaced frontend mock
Date: 2026-03-13

[COMPONENT]

Entity: Component
Name: Sakny Intelligent Housing Portal Landing Page
Role: C
Path: frontend/src/app/page.tsx
Status: REAL
Action: IMPLEMENTED
Owner: Frontend Engineer
Notes: Initialized Next.js project and fully implemented landing page components from Stitch design.
Date: 2026-04-17

[FEATURE]

Entity: Component
Name: i18n and Logo Integration
Role: C
Path: frontend/src/i18n, frontend/src/components
Status: REAL
Action: UPDATED
Owner: Frontend Engineer (Antigravity)
Notes: Added Benha Engineering Shoubra logo to Navbar and Footer. Completely refactored all components to support full bilingual English/Arabic toggling using a custom React Context provider without external dependencies. Added RTL styling automatically switching based on local config.
Date: 2026-04-17

[SCHEMA]

Entity: Model
Name: Admin (admins table)
Role: A
Path: backend/app/models/admin.py
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Antigravity)
Notes: SQLAlchemy model for university staff. Columns: admin_id, name, email, password_hash (bcrypt), role, created_at, updated_at. Enhanced from report with audit timestamps.
Date: 2026-04-24

[SCHEMA]

Entity: Model
Name: Student (students table)
Role: A
Path: backend/app/models/student.py
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Antigravity)
Notes: SQLAlchemy model for students. Columns: student_id, faculty_id, name, email, gender, home_city, password_hash (bcrypt), enroll_status, distance_score, preferences, created_at, updated_at. Enhanced from report with email, password_hash, and audit timestamps.
Date: 2026-04-24

[INFRASTRUCTURE]

Entity: Service
Name: PostgreSQL Docker Container (saknny_postgres)
Role: A
Path: docker/docker-compose.yml
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Antigravity)
Notes: PostgreSQL 15-alpine container on port 5433. Database name: saknny, user: saknny_admin. Port 5433 used to avoid conflict with existing vertex container on 5432.
Date: 2026-04-24

[SCHEMA]

Entity: Schema
Name: Database Schema Contract
Role: A
Path: contracts/database/schema.md
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Antigravity)
Notes: Source-of-truth document for all database tables. Role B must reference this before writing queries.
Date: 2026-04-24

[SCHEMA]

Entity: Model
Name: VerificationDocument (verification_documents table)
Role: A
Path: backend/app/models/verification_document.py
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Antigravity)
Notes: Tracks student document uploads for enrollment verification. Columns: doc_id, student_id (FK), doc_type, file_path, original_filename, status, reviewed_by (FK), review_date, rejection_reason, is_flagged, flag_reason, created_at, updated_at. Files stored on filesystem at uploads/verification_docs/<student_id>/. Schema contract updated.
Date: 2026-04-24
