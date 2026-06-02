# Functional Traceability Matrix (Chapter 3)

This matrix maps Chapter 3 functional requirements/events to implementation artifacts.

| Functional area | Report event(s) | API endpoint(s) | Data model(s) | Validation / business rule |
|---|---|---|---|---|
| Identity and Access | Authentication | `POST /api/v1/auth/login` | `students`, `admins` | JWT role claim and RBAC guard |
| Student profile | Profile setup/update | `POST /api/v1/students/register`, `PUT /api/v1/students/{student_id}/profile` | `students` | Unique email/faculty_id |
| Verification upload | Proof of enrollment upload | `POST /api/v1/students/{student_id}/documents` | `verification_documents` | file type + size limit, owner-only upload |
| Verification queue | Verification queue review | `GET /api/v1/admin/verifications` | `verification_documents`, `students` | admin-only access |
| Verification decision | Document approve/reject | `PUT /api/v1/admin/verifications/{doc_id}` | `verification_documents`, `students` | approved/rejected only, rejection reason for rejected |
| Enrollment validation | Student eligibility set | `PUT /api/v1/admin/students/{student_id}/enrollment` | `students` | cannot set true before approved doc |
| Catalog browsing | Browse/filter housing | `GET /api/v1/catalog/buildings`, `GET /api/v1/catalog/rooms` | `buildings`, `rooms` | optional filters |
| Catalog admin | Inventory edit/manage | `POST/PUT /api/v1/admin/catalog/buildings*`, `POST/PUT /api/v1/admin/catalog/rooms*` | `buildings`, `rooms` | bed constraints, enum constraints |
| Application submit | Submit request | `POST /api/v1/applications` | `applications` | enrollment gate + single active application |
| Application tracking | Status tracking | `GET /api/v1/applications/me` | `applications` | student scope |
| Application review | Admin review start | `PUT /api/v1/admin/applications/{app_id}/review` | `applications`, `application_reviews` | review status validation |
| Application finalization | Final approval/rejection | `PUT /api/v1/admin/applications/{app_id}/finalize` | `applications`, `application_reviews` | final status validation |
| Waitlist | No beds available | `POST /api/v1/applications/{app_id}/waitlist` | `applications` | auto waitlist position |
| Allocation | Bed assignment | `POST /api/v1/admin/allocations` | `allocations`, `rooms`, `applications` | gender + capacity enforcement |
| Allocation view | Student/admin allocation views | `GET /api/v1/allocations/me`, `GET /api/v1/admin/allocations` | `allocations` | role-based filtering |
| Contract issuance | Issue lease | `POST /api/v1/admin/contracts/leases` | `leases`, `allocations` | one lease per allocation |
| Contract signing | Digital signature | `PUT /api/v1/contracts/leases/{lease_id}/sign` | `leases` | student ownership + pending_signature gate |
| Contract expiry | Deadline passes | `POST /api/v1/admin/contracts/leases/{lease_id}/expire` | `leases` | admin controlled lifecycle |
| Payment initiation | Pay deposit/rent | `POST /api/v1/billing/payments/initiate` | `payment_intents` | simulation-only gateway ref |
| Payment confirmation | Gateway confirms status | `POST /api/v1/billing/payments/{payment_id}/confirm` | `payment_intents` | paid/failed transitions |
| Billing admin | Monitor/refund | `GET /api/v1/admin/billing/payments`, `POST /api/v1/admin/billing/payments/{payment_id}/refund` | `payment_intents` | admin-only refund flow |
| Check-in | Check-in execution/key issue | `POST /api/v1/checkins/initiate`, `PUT /api/v1/admin/checkins/{checkin_id}/issue-key` | `checkins`, `allocations` | active allocation required |
| Lifecycle changes | Room change request/review | `POST /api/v1/lifecycle/room-change`, `GET/PUT /api/v1/admin/lifecycle/room-change*` | `room_change_requests` | pending_review -> approved/rejected |
| Checkout | Checkout initiation | `POST /api/v1/lifecycle/checkout` | `checkins` | checked_in -> checked_out |
| Maintenance submit | Submit ticket | `POST /api/v1/maintenance/tickets` | `maintenance_tickets` | priority validation |
| Maintenance ops | Assign/escalate/resolve | `GET/PUT/POST /api/v1/admin/maintenance/tickets*` | `maintenance_tickets` | admin-only status transitions |
| Messaging | In-app message channel | `POST/GET /api/v1/messages` | `messages` | student/admin actor role enforcement |
| Announcements | Publish and read announcements | `POST /api/v1/admin/announcements`, `GET /api/v1/announcements` | `announcements` | targeted delivery by role |
| Mobile token bridge | Issue Firebase custom token | `POST /api/v1/mobile/firebase-token` | `students` | requires JWT student auth + firebase_uid match |
| Device registration | Register FCM token | `POST /api/v1/devices/register` | `students` | authenticated student updates own token |
| Attendance check-in | Geofenced daily attendance | `POST /api/v1/attendance/check-in` | `attendance_records`, `allocations`, `rooms`, `students` | server-time policy, local-day dedup, geofence via Haversine against allocated room, active allocation required |
| Attendance score | Student attendance score | `GET /api/v1/attendance/score` | `attendance_records` | score derived from successful/total attempts |
| Attendance analytics | Admin attendance metrics | `GET /api/v1/admin/attendance/analytics` | `attendance_records`, `allocations`, `buildings` | today success/rejection, dorm distribution, absent and suspicious counts |
| Push dispatch | Admin send FCM notification | `POST /api/v1/admin/notifications/send` | `students`, `allocations`, `audit_logs` | admin-only dispatch and auditable send outcomes |
| Analytics dashboard | Dashboard metrics | `GET /api/v1/admin/analytics/dashboard` | rooms/applications/payments/tickets/allocations | aggregated metrics from relational data |
| Auditability | Sensitive changes log | `GET /api/v1/admin/audit/logs` + internal audit writes | `audit_logs` | who/what/when/before-after |
| Surveys | Dispatch + complete | `POST /api/v1/admin/surveys`, `POST /api/v1/admin/surveys/{survey_id}/dispatch`, `GET /api/v1/surveys/me`, `POST /api/v1/surveys/{dispatch_id}/complete` | `surveys`, `survey_dispatches` | admin dispatch and student completion flow |

## Automated coverage artifact

- Route/contract presence and envelope tests are implemented in `backend/tests/test_traceability.py`.
