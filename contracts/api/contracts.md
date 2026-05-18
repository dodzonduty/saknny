# API Contracts (Chapter 3 Backend Scope)

This file defines the API contracts for the full Chapter 3 university-dorm workflow.
All backend APIs must implement these endpoints exactly as described.
All frontend integration and mocks must follow this structure.

## Base URL
`/api/v1`

## Standard Response Format
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "error": "error message"
}
```

## Auth and roles
- JWT bearer token for all protected endpoints.
- Role claim values: `"student"`, `"admin"`.
- Header: `Authorization: Bearer <access_token>`.

## Status enums
- Verification: `pending`, `approved`, `rejected`
- Application: `submitted`, `under_review`, `approved`, `rejected`, `waitlisted`
- Allocation: `assigned`, `cancelled`
- Lease: `pending_signature`, `signed`, `expired`
- Payment: `initiated`, `paid`, `failed`, `refunded`
- Ticket: `open`, `assigned`, `in_progress`, `resolved`, `escalated`
- Room change request: `pending_review`, `approved`, `rejected`
- Check-in flow: `initiated`, `checked_in`, `checked_out`

---

## 1) Identity and Profile

### `POST /students/register`
Creates a student account.

### `POST /auth/login`
Authenticates student or admin and returns token + role.

### `PUT /students/{student_id}/profile`
Updates student profile fields (`name`, `home_city`, `preferences`).
Requires student owns this profile.

---

## 2) Verification

### `POST /students/{student_id}/documents`
Upload verification document (JPEG/PNG/PDF, max 5 MB).
Multipart fields:
- `file`
- `doc_type` (`college_id`, `enrollment_letter`, `national_id`)

### `GET /students/{student_id}/documents`
List student verification documents.
Student sees own docs; admin can view any student docs.



### `GET /admin/verifications?status=pending`
Admin queue for verification review.

### `PUT /admin/verifications/{doc_id}`
Admin approves/rejects a verification document.
Request:
```json
{
  "status": "approved",
  "rejection_reason": null
}
```

### `PUT /admin/students/{student_id}/enrollment`
Manually set enrollment status (admin action, audited).
Request:
```json
{
  "enroll_status": true
}
```

---

## 3) Catalog (Buildings and Rooms)

### `GET /catalog/buildings`
Student/admin list of buildings with optional filters:
- `gender_type`
- `status`

### `POST /admin/catalog/buildings`
Admin creates building.

### `PUT /admin/catalog/buildings/{dorm_id}`
Admin updates building.

### `GET /catalog/rooms`
Student/admin list of rooms with optional filters:
- `dorm_id`
- `available_only` (boolean)

### `POST /admin/catalog/rooms`
Admin creates room.

### `PUT /admin/catalog/rooms/{room_id}`
Admin updates room metadata/beds.

---

## 4) Applications and Waitlist

### `POST /applications`
Student submits application.
Request:
```json
{
  "preferred_dorm_id": 1,
  "notes": "Near faculty preferred"
}
```

### `GET /applications/me`
Student tracks own applications and next actions.

### `GET /admin/applications?status=submitted`
Admin lists applications.

### `PUT /admin/applications/{app_id}/review`
Admin reviews application.
Request:
```json
{
  "status": "under_review",
  "review_action": "Eligibility checked",
  "comments": "Enrollment verified"
}
```

### `PUT /admin/applications/{app_id}/finalize`
Admin final decision.
Request:
```json
{
  "status": "approved",
  "comments": "Priority accepted"
}
```

### `POST /applications/{app_id}/waitlist`
Student joins waitlist for application when no beds are available.

---

## 5) Allocation

### `POST /admin/allocations`
Admin assigns bed to approved application.
Request:
```json
{
  "app_id": 10,
  "room_id": 5,
  "plan": "full_board"
}
```

### `GET /admin/allocations`
Admin list allocations.

### `GET /allocations/me`
Student current allocation.

---

## 6) Contracts (Lease)

### `POST /admin/contracts/leases`
Admin issues lease for allocation.
Request:
```json
{
  "allocation_id": 12,
  "expires_at": "2026-10-01T00:00:00Z"
}
```

### `GET /contracts/leases/me`
Student list of leases.

### `PUT /contracts/leases/{lease_id}/sign`
Student signs lease.

### `POST /admin/contracts/leases/{lease_id}/expire`
Admin/scheduler marks lease expired.

---

## 7) Billing (Simulated Payment)

### `POST /billing/payments/initiate`
Student initiates simulated payment.
Request:
```json
{
  "lease_id": 3,
  "amount": 2500,
  "payment_type": "deposit"
}
```

### `POST /billing/payments/{payment_id}/confirm`
Marks payment successful/failed (simulated gateway callback).
Request:
```json
{
  "status": "paid"
}
```

### `GET /billing/payments/me`
Student payment history.

### `GET /admin/billing/payments`
Admin payment dashboard list.

### `POST /admin/billing/payments/{payment_id}/refund`
Admin approves/rejects refund simulation.

---

## 8) Check-in and Residency Lifecycle

### `POST /checkins/initiate`
Student initiates check-in request.

### `PUT /admin/checkins/{checkin_id}/issue-key`
Admin issues key and marks checked in.

### `POST /lifecycle/room-change`
Student requests room change.

### `GET /admin/lifecycle/room-change`
Admin list room change requests.

### `PUT /admin/lifecycle/room-change/{request_id}/review`
Admin approves/rejects room change.

### `POST /lifecycle/checkout`
Student initiates checkout.

---

## 9) Maintenance

### `POST /maintenance/tickets`
Student creates maintenance ticket.

### `GET /maintenance/tickets/me`
Student tickets.

### `GET /admin/maintenance/tickets?status=open`
Admin ticket queue.

### `PUT /admin/maintenance/tickets/{ticket_id}/assign`
Admin assigns ticket / changes status.

### `POST /admin/maintenance/tickets/{ticket_id}/escalate`
Admin/scheduler escalates ticket.

---

## 10) Messaging and Announcements

### `POST /messages`
Student/admin sends in-app message.

### `GET /messages`
Get conversation list or thread via query params.

### `POST /admin/announcements`
Admin publishes announcement.

### `GET /announcements`
Students/admin retrieve active announcements.

### `GET /notifications/count`
Returns notification counts for the authenticated user.
Response:
```json
{
  "unread_messages": 3,
  "announcements": 2,
  "total": 5
}
```
Auth: Bearer token required.

---

## 11) Analytics, Audit, Surveys

### `GET /admin/analytics/dashboard`
Returns occupancy, inventory availability, payment status metrics, and ticket SLA indicators.

### `GET /admin/audit/logs`
Returns sensitive action logs with optional filters (`action`, `entity_type`, `actor_role`).

### `POST /admin/surveys`
Admin creates survey.

### `POST /admin/surveys/{survey_id}/dispatch`
Dispatches survey to target students.

### `GET /surveys/me`
Student assigned surveys.

### `POST /surveys/{dispatch_id}/complete`
Student submits survey response.

---

## Notes for Frontend integration
- Keep request/response envelope exactly as defined.
- IDs in route paths are numeric.
- Date-time fields use ISO-8601 UTC format.
- For all list endpoints, expect `data.items` and optional `data.count`.
