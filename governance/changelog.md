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
Owner: Frontend Engineer (Mohamed)
Notes: Added Benha Engineering Shoubra logo to Navbar and Footer. Completely refactored all components to support full bilingual English/Arabic toggling using a custom React Context provider without external dependencies. Added RTL styling automatically switching based on local config.
Date: 2026-04-17

[SCHEMA]

Entity: Model
Name: Admin (admins table)
Role: A
Path: backend/app/models/admin.py
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Mohamed)
Notes: SQLAlchemy model for university staff. Columns: admin_id, name, email, password_hash (bcrypt), role, created_at, updated_at. Enhanced from report with audit timestamps.
Date: 2026-04-24

[SCHEMA]

Entity: Model
Name: Student (students table)
Role: A
Path: backend/app/models/student.py
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Mohamed)
Notes: SQLAlchemy model for students. Columns: student_id, faculty_id, name, email, gender, home_city, password_hash (bcrypt), enroll_status, distance_score, preferences, created_at, updated_at. Enhanced from report with email, password_hash, and audit timestamps.
Date: 2026-04-24

[INFRASTRUCTURE]

Entity: Service
Name: PostgreSQL Docker Container (saknny_postgres)
Role: A
Path: docker/docker-compose.yml
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Mohamed)
Notes: PostgreSQL 15-alpine container on port 5433. Database name: saknny, user: saknny_admin. Port 5433 used to avoid conflict with existing vertex container on 5432.
Date: 2026-04-24

[SCHEMA]

Entity: Schema
Name: Database Schema Contract
Role: A
Path: contracts/database/schema.md
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Mohamed)
Notes: Source-of-truth document for all database tables. Role B must reference this before writing queries.
Date: 2026-04-24

[SCHEMA]

Entity: Model
Name: VerificationDocument (verification_documents table)
Role: A
Path: backend/app/models/verification_document.py
Status: REAL
Action: CREATED
Owner: Data Layer Engineer (Mohamed)
Notes: Tracks student document uploads for enrollment verification. Columns: doc_id, student_id (FK), doc_type, file_path, original_filename, status, reviewed_by (FK), review_date, rejection_reason, is_flagged, flag_reason, created_at, updated_at. Files stored on filesystem at uploads/verification_docs/<student_id>/. Schema contract updated.
Date: 2026-04-24

[API]

Entity: API Contract
Name: Auth and Verification API Contracts
Role: B
Path: contracts/api/contracts.md
Status: REAL
Action: CREATED
Owner: API Engineer (Mohamed)
Notes: Created the API contracts for Student Registration, Auth Login, Document Upload, Verification Queue, and Document Review following the API patterns.
Date: 2026-04-24

[API]

Entity: Backend Service
Name: Auth and Verification Endpoints
Role: B
Path: backend/app/api/
Status: REAL
Action: CREATED
Owner: API Engineer (Mohamed)
Notes: Bootstrapped FastAPI application (main.py) with standardized error handling. Created JWT security utilities, Pydantic schemas, and implemented endpoints for authentication (login, registration) and verification workflows according to the contract.
Date: 2026-04-24

[COMPONENT]

Entity: Component
Name: Frontend Auth Pages Implementation
Role: C
Path: frontend/src/components/auth/*, frontend/src/app/auth/page.tsx
Status: REAL
Action: IMPLEMENTED
Owner: Frontend Engineer (Mohamed)
Notes: Implemented the Login and Registration pages (`/auth`) and integrated with the backend API.
Date: 2026-05-03

[COMPONENT]

Entity: Component
Name: Student Dashboard Implementation
Role: C
Path: frontend/src/components/dashboard/*, frontend/src/app/dashboard/page.tsx
Status: REAL
Action: IMPLEMENTED
Owner: Frontend Engineer (Mohamed)
Notes: Implemented the Student Home Dashboard (`/dashboard`) including the document upload functionality (`POST /students/{id}/documents`). Built the UI stepper for document status but it currently relies on local state.
Date: 2026-05-04

[API REQUEST]

Entity: API Contract
Name: GET /api/v1/students/{id}/documents
Role: C -> B
Path: TBD
Status: REQUIRED
Action: REQUESTED
Owner: API Engineer (Mohamed)
Notes: We need a new endpoint `GET /api/v1/students/{id}/documents` to fetch the student's previously uploaded documents and their status (`pending`, `approved`, `rejected`). Without this, the dashboard stepper resets to "Upload Document" every time the page refreshes. Please implement this API so the frontend can properly reflect the persistent document status.
Date: 2026-05-04

[API]

Entity: API
Name: GET /notifications/count
Role: B
Path: backend/app/api/endpoints/communications.py
Status: REAL
Action: CREATED
Owner: Backend Engineer
Notes: Returns unread message count and active announcement count for the authenticated user. Used by frontend navbar notification badge.
Date: 2026-05-18

[BUGFIX]

Entity: API
Name: PUT /admin/verifications/{doc_id} – enroll_status fix
Role: B
Path: backend/app/api/endpoints/admin.py
Status: REAL
Action: UPDATED
Owner: Backend Engineer
Notes: Added db.flush() before pending/approved count queries in review_verification. Without the flush, SQLAlchemy aggregate queries could not see the in-session status change, so enroll_status was never set to true after document approval. Also manually fixed student_id=1 enroll_status in the database.
Date: 2026-05-18

[BUGFIX]

Entity: API
Name: Document file_url resolution
Role: B
Path: backend/app/api/endpoints/students.py, backend/app/api/endpoints/admin.py
Status: REAL
Action: UPDATED
Owner: Backend Engineer
Notes: Replaced relative file_url paths with absolute URL paths pointing to the backend static file server (http://localhost:8000/api/v1/uploads/...) to fix frontend document viewing 404s.
Date: 2026-05-18

[BUGFIX]

Entity: API
Name: POST /admin/catalog/rooms & PUT /admin/catalog/rooms/{id}
Role: B
Path: backend/app/api/endpoints/catalog.py
Status: REAL
Action: UPDATED
Owner: Backend Engineer
Notes: Added explicit checks for duplicate room numbers within the same building before adding/updating rooms to avoid 500 internal server errors caused by database unique constraint violations. Now returns a clean error response.
Date: 2026-05-18

[SCHEMA]

Entity: Schema
Name: Mobile Attendance + Firebase Linkage
Role: A
Path: contracts/database/schema.md, backend/app/models/student.py, backend/app/models/building.py, backend/app/models/attendance_record.py, backend/alembic/versions/20260526_01_mobile_attendance_firebase.py
Status: REAL
Action: UPDATED
Owner: Role A/B Implementation
Notes: Added students.firebase_uid and students.fcm_token, building geofence fields (latitude/longitude/allowed_radius_meters), and attendance_records table with local-day duplicate prevention and rejection tracking.
Date: 2026-05-26

Entity: Schema
Name: Room-Based Attendance Geofence
Role: A
Path: contracts/database/schema.md, backend/app/models/building.py, backend/app/models/room.py, backend/app/api/endpoints/catalog.py, backend/app/api/endpoints/attendance.py, backend/alembic/versions/20260601_01_room_geofence.py, frontend/src/app/admin/catalog/page.tsx
Status: REAL
Action: UPDATED
Owner: Role A/B Implementation
Notes: Moved latitude/longitude/allowed_radius_meters from buildings to rooms. Attendance check-in now validates against the student's allocated room. Migration copies existing building geofence values onto rooms in the same building.
Date: 2026-06-01

[API]

Entity: API Contract
Name: Mobile Attendance + Firebase Endpoints
Role: B
Path: contracts/api/contracts.md
Status: REAL
Action: UPDATED
Owner: Role A/B Implementation
Notes: Added contract coverage for /auth/mobile/firebase-token, /devices/register, /attendance/check-in, /attendance/score, /admin/attendance/analytics, /admin/notifications/send and authorization matrix policies.
Date: 2026-05-26

[API]

Entity: Backend Service
Name: Firebase bridge + Attendance APIs
Role: B
Path: backend/app/services/firebase.py, backend/app/services/geofence.py, backend/app/api/endpoints/auth.py, backend/app/api/endpoints/students.py, backend/app/api/endpoints/attendance.py, backend/app/api/endpoints/communications.py
Status: REAL
Action: CREATED
Owner: Role A/B Implementation
Notes: Implemented Firebase user provisioning with compensation rollback on signup, custom token issuance endpoint, device token registration, server-side Haversine geofence attendance checks, and admin push notification dispatch.
Date: 2026-05-26

[ARCHITECTURE]

Entity: System
Name: Biometric Attendance Architecture
Role: A/B/Mobile
Path: backend/app/models, backend/app/api/endpoints/attendance.py, mobile/lib/services
Status: REAL
Action: IMPLEMENTED
Owner: AI
Notes: Implemented OS biometric gates for app unlock and check-in. Migrated mobile sessions to encrypted storage. Refactored attendance endpoint to use Firebase event log for check-in sync, supporting offline-first design and maintaining PG as source of truth.
Date: 2026-06-13

[API REQUEST]

Entity: API Contract
Name: Missing Entity Names in Tables
Role: C -> B
Path: TBD
Status: REQUIRED
Action: REQUESTED
Owner: API Engineer
Notes: Frontend tables currently only receive IDs (student_id, room_id, building_id) from several endpoints, which hurts usability. Please add optional name fields (`student_name`, `room_number`, `building_name`) to the following endpoints so they can be displayed alongside the IDs:
- `GET /admin/allocations`
- `GET /admin/billing/payments`
- `GET /admin/maintenance/tickets`
- `GET /admin/lifecycle/room-change`
The frontend has been preemptively updated to render these names gracefully if they exist.
Date: 2026-06-13

[FEATURE]

Entity: API & Schema
Name: Roommate Auto-Assignment via Clustering
Role: A/B
Path: backend/app/models/compatibility.py, backend/app/api/endpoints/compatibility.py, backend/app/services/ai/clustering.py
Status: REAL
Action: IMPLEMENTED
Owner: AI (Role A/B)
Notes: Added database schema, API endpoints, and a service stub for KMeans clustering to automatically assign students to rooms based on a compatibility questionnaire. Produced a hand-off document (docs/role_d_clustering_handoff.md) for Role D to implement the clustering algorithm.
Date: 2026-06-14

[FEATURE]

Entity: API
Name: Admin Analytical Reports
Role: B
Path: backend/app/api/endpoints/reports.py, backend/app/api/router.py
Status: REAL
Action: CREATED
Owner: Backend Engineer
Notes: Added `GET /admin/reports/daily` and `GET /admin/reports/custom` to provide admin dashboard analytics for attendance. The APIs calculate total assigned vs attended rates dynamically with support for filtering by date range, student, building, and room.
Date: 2026-06-14

---

[FEATURE]

Entity: Service
Name: DormChatbot (Intelligence Layer - Role D)
Role: D
Path: backend/app/services/ai/dorm_chatbot.py
Status: REAL
Action: CREATED
Owner: AI (Role D)
Notes: Created a stateless RAG chatbot service that reads datasets/regulations.txt at import time and injects it as the strict system context for every Gemini API call. Out-of-scope questions receive a fixed Arabic/English fallback response. Reuses the existing GEMINI_API_KEY from settings and follows the BaseAIModel interface. No database interaction.
Date: 2026-06-15

[API]

Entity: API
Name: POST /chatbot/chat
Role: B
Path: backend/app/api/endpoints/chatbot.py, backend/app/api/router.py
Status: REAL
Action: CREATED
Owner: AI (Role B)
Notes: Stateless POST endpoint at /api/v1/chatbot/chat. Accepts message and returns Standard Response Format with answer field. No chat history persisted. Router registered with prefix /chatbot and tag chatbot. Also added dorm-chatbot-rag entry to the /ai/models catalog endpoint.
Date: 2026-06-15

[COMPONENT]

Entity: Component
Name: ChatWidget (UI Layer - Role C)
Role: C
Path: frontend/src/components/ChatWidget.tsx, frontend/src/app/layout.tsx
Status: REAL
Action: CREATED
Owner: AI (Role C)
Notes: Created a floating toggleable chat widget mounted in the root layout (visible site-wide). Uses exclusively the existing design tokens: primary, accent-yellow, surface-container tokens, outline-variant, material-symbols-outlined, and the font-headline/font-body/font-label families. RTL-safe using CSS logical properties. Sends messages to POST /chatbot/chat via the existing apiClient utility. Includes bilingual AR/EN welcome message, typing-dots indicator, and unread-notification pulse badge.
Date: 2026-06-15
