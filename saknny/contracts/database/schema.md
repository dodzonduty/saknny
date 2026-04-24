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
All docs approved  →  Admin sets students.enroll_status = TRUE
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
6. **Verification Gate**: A student cannot be marked as enrolled until at least one verification document is approved.

---

## Upcoming Tables (not yet implemented)

- `applications` — Housing application submissions
- `application_reviews` — M:N link between admins and applications
- `buildings` — Dormitory buildings
- `rooms` — Individual rooms within buildings
- `allocations` — Bed assignments

---

## Version History

| Date | Change | Author |
|---|---|---|
| 2026-04-24 | Initial schema: admins, students tables | Role A (Data Layer) |
| 2026-04-24 | Added verification_documents table + file storage convention | Role A (Data Layer) |
