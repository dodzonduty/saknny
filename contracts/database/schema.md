# Saknny Database Schema Contract

This document is the single source of truth for the database schema.
Role B (API Layer) must read this before writing any queries or repository code.

---

## Table: admins

| Column | Type | Constraints | Notes |
|---|---|---|---|
| admin_id | INTEGER | PK, AUTO INCREMENT | |
| name | VARCHAR(100) | NOT NULL | Full name of staff member |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Institutional email for login |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| role | VARCHAR(50) | NOT NULL | e.g. "Housing Manager", "Staff" |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit, auto-updated |

---

## Table: students

| Column | Type | Constraints | Notes |
|---|---|---|---|
| student_id | INTEGER | PK, AUTO INCREMENT | |
| faculty_id | VARCHAR(20) | UNIQUE, NOT NULL | Official university ID |
| name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(100) | UNIQUE, NOT NULL | For login + notifications |
| gender | CHAR(1) | NOT NULL | 'M' or 'F' |
| home_city | VARCHAR(50) | NOT NULL | Used for distance scoring |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| enroll_status | BOOLEAN | NOT NULL, DEFAULT FALSE | Set TRUE by Admin after verification |
| distance_score | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Priority score from home city |
| preferences | VARCHAR(200) | NULLABLE | For AI matching agent |
| firebase_uid | VARCHAR(128) | UNIQUE, NULLABLE | Firebase Auth UID linked to student |
| fcm_token | VARCHAR(512) | NULLABLE | Latest registered mobile FCM token |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit, auto-updated |

---

## Table: verification_documents

| Column | Type | Constraints | Notes |
|---|---|---|---|
| doc_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE) | Who uploaded |
| doc_type | VARCHAR(30) | NOT NULL | "college_id", "enrollment_letter", "national_id" |
| file_path | VARCHAR(500) | NOT NULL | Relative: `uploads/verification_docs/<student_id>/<file>` |
| original_filename | VARCHAR(255) | NOT NULL | Original name for display |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | "pending" → "approved" / "rejected" |
| reviewed_by | INTEGER | FK → admins (SET NULL), NULLABLE | Admin who reviewed |
| review_date | TIMESTAMPTZ | NULLABLE | When reviewed |
| rejection_reason | TEXT | NULLABLE | Filled on rejection |
| is_flagged | BOOLEAN | NOT NULL, DEFAULT FALSE | System fraud flag |
| flag_reason | VARCHAR(200) | NULLABLE | Why flagged |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Upload timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit, auto-updated |

### Verification Workflow

```
Student uploads document  →  status = 'pending'
    ↓
System may flag  →  is_flagged = true, flag_reason set
    ↓
Admin reviews  →  status = 'approved' | 'rejected'
               →  reviewed_by, review_date set
               →  rejection_reason set (if rejected)
    ↓
All submitted docs reviewed and at least one approved  →  Admin sets students.enroll_status = TRUE
```

### File Storage Convention

- Files stored at: `uploads/verification_docs/<student_id>/<uuid>_<original_filename>`
- The `file_path` column stores the relative path from the project root
- Accepted formats: JPEG, PNG, PDF (enforced by API layer)
- Max file size: 5 MB (enforced by API layer)

---

## Business Rules

1. **Gender Rule**: `students.gender` must match `buildings.gender_type` for allocation.
2. **Capacity Logic**: `rooms.available_beds > 0` for allocation to be valid.
3. **Enrollment Gate**: `enroll_status` must be `TRUE` before a student can submit an application.
4. **Password Hashing**: All passwords stored using bcrypt (via passlib or bcrypt library).
5. **IDs**: All entities use numeric auto-incrementing IDs (per `governance/api_patterns.md`).
6. **Verification Gate**: A student cannot be marked as enrolled until all currently submitted verification documents are reviewed and at least one is approved.
7. **Application Gate**: Students can only have one active application in (`submitted`, `under_review`, `approved`, `waitlisted`).
8. **Lease Gate**: Lease creation requires an existing allocation.
9. **Payment Gate**: Payment records are simulation-only in this phase (no external gateway dependency).
10. **Mobile Auth Link Gate**: `students.firebase_uid` must be unique when present.
11. **Attendance Eligibility Gate**: attendance check-in requires an active allocation.
12. **Attendance Time Policy**: attendance eligibility and duplicate checks use university-local day and server receive time.

---

## Table: buildings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| dorm_id | INTEGER | PK, AUTO INCREMENT | |
| building_name | VARCHAR(100) | NOT NULL | |
| gender_type | CHAR(1) | NOT NULL | `M` or `F` |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | `active`, `maintenance`, `inactive` |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: attendance_records

| Column | Type | Constraints | Notes |
|---|---|---|---|
| attendance_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| allocation_id | INTEGER | FK → allocations (SET NULL), NULLABLE | Allocation snapshot at check-in |
| dorm_id | INTEGER | FK → buildings (SET NULL), NULLABLE | Dorm snapshot at check-in |
| attendance_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Server receive time (authoritative) |
| attendance_date | DATE | NOT NULL | University-local date for dedup logic |
| client_timestamp | TIMESTAMPTZ | NULLABLE | Raw client-sent timestamp for audit only |
| latitude | DECIMAL(9,6) | NOT NULL | Student reported latitude |
| longitude | DECIMAL(9,6) | NOT NULL | Student reported longitude |
| distance_meters | DECIMAL(10,2) | NULLABLE | Distance from allocated room center |
| status | VARCHAR(20) | NOT NULL | `SUCCESS` or `REJECTED` |
| rejection_reason | VARCHAR(200) | NULLABLE | Reason when rejected |
| device_id | VARCHAR(120) | NULLABLE | Logged for suspicious attempts |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit |

### Attendance Constraints
- Unique daily success per student:
  - unique partial index on (`student_id`, `attendance_date`) where `status = 'SUCCESS'`
- Indexes:
  - (`attendance_date`)
  - (`status`)
  - (`student_id`)
  - (`rejection_reason`)

### Attendance Rejection Reasons (initial set)
- `No active allocation found for attendance`
- `Firebase identity mismatch`
- `Outside permitted attendance zone`
- `Attendance already marked for today`
- `Room geolocation is not configured`
- `Invalid coordinates provided`

---

## Table: rooms

| Column | Type | Constraints | Notes |
|---|---|---|---|
| room_id | INTEGER | PK, AUTO INCREMENT | |
| dorm_id | INTEGER | FK → buildings (CASCADE), NOT NULL | |
| room_number | VARCHAR(20) | NOT NULL | Unique per dorm |
| total_beds | INTEGER | NOT NULL | Must be > 0 |
| available_beds | INTEGER | NOT NULL | Must be between 0 and total_beds |
| dominant_preferences | VARCHAR(100) | NULLABLE | Derived/supportive field |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | `active`, `maintenance`, `inactive` |
| latitude | DECIMAL(9,6) | NULLABLE | Room latitude for geofence validation |
| longitude | DECIMAL(9,6) | NULLABLE | Room longitude for geofence validation |
| allowed_radius_meters | INTEGER | NOT NULL, DEFAULT 100 | Attendance radius in meters |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: applications

| Column | Type | Constraints | Notes |
|---|---|---|---|
| app_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| preferred_dorm_id | INTEGER | FK → buildings (SET NULL), NULLABLE | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'submitted' | `submitted`, `under_review`, `approved`, `rejected`, `waitlisted` |
| notes | TEXT | NULLABLE | |
| waitlist_position | INTEGER | NULLABLE | Filled for waitlisted apps |
| submission_date | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| reviewed_by | INTEGER | FK → admins (SET NULL), NULLABLE | Last reviewer |
| reviewed_at | TIMESTAMPTZ | NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: application_reviews

| Column | Type | Constraints | Notes |
|---|---|---|---|
| review_id | INTEGER | PK, AUTO INCREMENT | |
| app_id | INTEGER | FK → applications (CASCADE), NOT NULL | |
| admin_id | INTEGER | FK → admins (CASCADE), NOT NULL | |
| review_action | VARCHAR(50) | NOT NULL | e.g., `Eligibility checked` |
| comments | TEXT | NULLABLE | |
| review_time | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: allocations

| Column | Type | Constraints | Notes |
|---|---|---|---|
| allocation_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), UNIQUE, NOT NULL | One active allocation per student |
| room_id | INTEGER | FK → rooms (RESTRICT), NOT NULL | |
| admin_id | INTEGER | FK → admins (SET NULL), NULLABLE | Assignment owner |
| app_id | INTEGER | FK → applications (SET NULL), NULLABLE | Source application |
| plan | VARCHAR(30) | NOT NULL | `breakfast`, `full_board` |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'assigned' | `assigned`, `cancelled` |
| assigned_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: leases

| Column | Type | Constraints | Notes |
|---|---|---|---|
| lease_id | INTEGER | PK, AUTO INCREMENT | |
| allocation_id | INTEGER | FK → allocations (CASCADE), UNIQUE, NOT NULL | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| admin_id | INTEGER | FK → admins (SET NULL), NULLABLE | Issuing admin |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending_signature' | `pending_signature`, `signed`, `expired` |
| document_url | VARCHAR(255) | NULLABLE | Path to lease file/record |
| issued_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | NULLABLE | |
| signed_at | TIMESTAMPTZ | NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: payment_intents

| Column | Type | Constraints | Notes |
|---|---|---|---|
| payment_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| lease_id | INTEGER | FK → leases (SET NULL), NULLABLE | |
| payment_type | VARCHAR(20) | NOT NULL | `deposit`, `rent`, `refund` |
| amount | DECIMAL(12,2) | NOT NULL | |
| currency | VARCHAR(10) | NOT NULL, DEFAULT 'EGP' | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'initiated' | `initiated`, `paid`, `failed`, `refunded` |
| gateway_ref | VARCHAR(100) | NULLABLE | Simulated reference |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| confirmed_at | TIMESTAMPTZ | NULLABLE | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: checkins

| Column | Type | Constraints | Notes |
|---|---|---|---|
| checkin_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| allocation_id | INTEGER | FK → allocations (CASCADE), NOT NULL | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'initiated' | `initiated`, `checked_in`, `checked_out` |
| key_issued_by | INTEGER | FK → admins (SET NULL), NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| checked_in_at | TIMESTAMPTZ | NULLABLE | |
| checked_out_at | TIMESTAMPTZ | NULLABLE | |

---

## Table: maintenance_tickets

| Column | Type | Constraints | Notes |
|---|---|---|---|
| ticket_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| room_id | INTEGER | FK → rooms (SET NULL), NULLABLE | |
| title | VARCHAR(120) | NOT NULL | |
| description | TEXT | NOT NULL | |
| priority | VARCHAR(20) | NOT NULL, DEFAULT 'medium' | `low`, `medium`, `high`, `urgent` |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'open' | `open`, `assigned`, `in_progress`, `resolved`, `escalated` |
| assigned_admin_id | INTEGER | FK → admins (SET NULL), NULLABLE | |
| escalation_reason | VARCHAR(200) | NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| resolved_at | TIMESTAMPTZ | NULLABLE | |

---

## Table: room_change_requests

| Column | Type | Constraints | Notes |
|---|---|---|---|
| request_id | INTEGER | PK, AUTO INCREMENT | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| current_room_id | INTEGER | FK → rooms (SET NULL), NULLABLE | |
| target_building_id | INTEGER | FK → buildings (SET NULL), NULLABLE | |
| reason | TEXT | NOT NULL | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending_review' | `pending_review`, `approved`, `rejected` |
| reviewed_by | INTEGER | FK → admins (SET NULL), NULLABLE | |
| reviewed_at | TIMESTAMPTZ | NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: announcements

| Column | Type | Constraints | Notes |
|---|---|---|---|
| announcement_id | INTEGER | PK, AUTO INCREMENT | |
| title | VARCHAR(160) | NOT NULL | |
| content | TEXT | NOT NULL | |
| target_role | VARCHAR(20) | NOT NULL, DEFAULT 'student' | `student`, `admin`, `all` |
| published_by | INTEGER | FK → admins (SET NULL), NULLABLE | |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | |
| published_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: messages

| Column | Type | Constraints | Notes |
|---|---|---|---|
| message_id | INTEGER | PK, AUTO INCREMENT | |
| sender_role | VARCHAR(20) | NOT NULL | `student` or `admin` |
| sender_id | INTEGER | NOT NULL | FK-like by role |
| recipient_role | VARCHAR(20) | NOT NULL | `student` or `admin` |
| recipient_id | INTEGER | NOT NULL | FK-like by role |
| body | TEXT | NOT NULL | |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: audit_logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| audit_id | INTEGER | PK, AUTO INCREMENT | |
| actor_role | VARCHAR(20) | NOT NULL | `student`, `admin`, `system` |
| actor_id | INTEGER | NULLABLE | null when system actor |
| action | VARCHAR(80) | NOT NULL | e.g., `application_finalized` |
| entity_type | VARCHAR(80) | NOT NULL | |
| entity_id | INTEGER | NULLABLE | |
| before_state | JSON | NULLABLE | Snapshot before change |
| after_state | JSON | NULLABLE | Snapshot after change |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: surveys

| Column | Type | Constraints | Notes |
|---|---|---|---|
| survey_id | INTEGER | PK, AUTO INCREMENT | |
| title | VARCHAR(160) | NOT NULL | |
| description | TEXT | NULLABLE | |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | |
| created_by | INTEGER | FK → admins (SET NULL), NULLABLE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

## Table: survey_dispatches

| Column | Type | Constraints | Notes |
|---|---|---|---|
| dispatch_id | INTEGER | PK, AUTO INCREMENT | |
| survey_id | INTEGER | FK → surveys (CASCADE), NOT NULL | |
| student_id | INTEGER | FK → students (CASCADE), NOT NULL | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'sent' | `sent`, `completed` |
| response_payload | JSON | NULLABLE | Student answers |
| sent_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| completed_at | TIMESTAMPTZ | NULLABLE | |

---

## Version History

| Date | Change | Author |
|---|---|---|
| 2026-04-24 | Initial schema: admins, students tables | Role A (Data Layer) |
| 2026-04-24 | Added verification_documents table + file storage convention | Role A (Data Layer) |
| 2026-05-15 | Expanded schema contract to full Chapter 3 modules (applications, catalog, allocations, leases, payments, maintenance, lifecycle, communications, analytics/audit/surveys) | Backend implementation |
| 2026-05-26 | Added mobile attendance + Firebase linkage fields and attendance_records contract | Role A/B implementation |
