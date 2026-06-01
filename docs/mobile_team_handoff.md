# Saknny Mobile Team Handoff (Frontend + Backend)

This document is the starting point for the mobile team to integrate with the Saknny backend attendance subsystem.

It covers:
- Firebase project setup
- Backend environment wiring
- Mobile authentication flow
- Attendance and notification API usage
- Integration order and test checklist

---

## 1) Architecture Boundary (Important)

- **PostgreSQL is the single source of truth** for:
  - student identity linkage
  - allocations
  - attendance records
  - attendance analytics
  - notification/audit outputs
- **Firebase is infrastructure only** for:
  - mobile auth delegation/custom token flow
  - Firebase user identity (`firebase_uid`)
  - push delivery (FCM)

Do not build business reporting from Firebase Console data.

---

## 2) Firebase Project Setup (One-time)

1. Create a Firebase project (suggested):
   - `saknny-mobile-dev` (and later `saknny-mobile-prod`)
2. Enable:
   - Firebase Authentication
   - Cloud Messaging (FCM)
3. Generate a Service Account key JSON:
   - Project settings -> Service accounts -> Generate private key
4. Store the JSON securely (never commit to Git).

---

## 3) Backend Environment Setup

Set these backend config values:

- `FIREBASE_ENABLED=true`
- `FIREBASE_PROJECT_ID=<firebase-project-id>`
- `FIREBASE_CREDENTIALS_PATH=<absolute-path-to-service-account-json>`
- `UNIVERSITY_TIMEZONE=Africa/Cairo` (or your official timezone)

Notes:
- Attendance day-boundary uses `UNIVERSITY_TIMEZONE`.
- Attendance decision time uses **server time**, not client time.

---

## 4) Mobile Authentication Flow

## 4.1 Registration source of truth

Students register through web backend:
- `POST /api/v1/students/register`

Backend flow:
1. Create Firebase user
2. Receive `firebase_uid`
3. Insert PostgreSQL student row with `firebase_uid`
4. If PostgreSQL fails -> delete Firebase user (compensation rollback)

## 4.2 Mobile token bridge

After mobile has backend JWT (student session), call:
- `POST /api/v1/mobile/firebase-token`

Request:
```json
{
  "firebase_uid": "firebase-uid-string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "firebase_custom_token": "<token>",
    "firebase_uid": "firebase-uid-string"
  },
  "error": null
}
```

Then mobile signs into Firebase SDK using this custom token.

---

## 5) Attendance and Notification Endpoints

All responses follow:
```json
{
  "success": true|false,
  "data": {}|null,
  "error": null|"message"
}
```

## 5.1 Register FCM token

- `POST /api/v1/devices/register`

Request:
```json
{
  "fcm_token": "fcm-token-string",
  "device_id": "android-uuid",
  "platform": "android"
}
```

## 5.2 Attendance check-in (geofenced)

- `POST /api/v1/attendance/check-in`

Request:
```json
{
  "student_id": 15,
  "firebase_uid": "firebase-uid-string",
  "latitude": 30.123456,
  "longitude": 31.123456,
  "timestamp": "2026-05-26T08:42:00Z",
  "device_id": "android-uuid"
}
```

Rules:
- Student must have active allocation
- Firebase UID must match linked student
- Server computes Haversine distance to assigned dorm
- Accept if `distance <= allowed_radius_meters`
- Duplicate success same local day is rejected

Common rejection messages:
- `No active allocation found for attendance`
- `Firebase identity mismatch`
- `Outside permitted attendance zone`
- `Attendance already marked for today`
- `Dorm geolocation is not configured`
- `Invalid coordinates provided`

## 5.3 Student attendance score

- `GET /api/v1/attendance/score`

## 5.4 Admin attendance analytics

- `GET /api/v1/admin/attendance/analytics`

Returns:
- today success/rejected
- dorm attendance percentages
- absent students count
- suspicious attempts count

## 5.5 Admin push dispatch

- `POST /api/v1/admin/notifications/send`

Request:
```json
{
  "title": "Lunch Available",
  "body": "Lunch is now available in Dorm A cafeteria.",
  "target": "all_students",
  "data": {
    "type": "food_notice"
  }
}
```

`target` values:
- `all_students`
- `active_allocations`

---

## 6) Mobile Authorization Matrix

- Login to mobile: allowed for authenticated student accounts.
- Attendance check-in: only students with active allocations.
- Unassigned students: can login, but check-in must fail with standardized rejection.
- Attendance reminders: send to `active_allocations` target only.

---

## 7) Suggested Mobile Integration Order

1. Start from the functional Flutter skeleton in `mobile/`.
2. Implement or replace the placeholder UI while keeping the service layer contracts intact.
3. Use backend JWT login/session handling in app.
4. Integrate `POST /mobile/firebase-token` and Firebase custom-token sign-in.
5. Register FCM token with `POST /devices/register`.
6. Integrate attendance check-in UI with location capture.
7. Handle all rejection reasons with clear UX messages.
8. Add score view from `GET /attendance/score`.
9. Validate end-to-end push notifications.

Run the skeleton:

```bash
cd mobile
flutter pub get
flutter run --dart-define=SAKNNY_API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Use `http://localhost:8000/api/v1` instead when running outside Android emulator.

---

## 8) QA Smoke Checklist

- Student can sign in mobile and obtain Firebase custom token.
- Student with no allocation gets attendance rejection.
- Student inside geofence gets `SUCCESS`.
- Student outside geofence gets `Outside permitted attendance zone`.
- Second same-day attempt gets duplicate rejection.
- Admin analytics updates after successful/rejected attempts.
- Push notification send returns sent/failed counts.

---

## 9) Troubleshooting Quick Notes

- If Firebase endpoints fail:
  - verify `FIREBASE_ENABLED=true`
  - verify credentials file path is correct and readable
  - verify `FIREBASE_PROJECT_ID`
- If attendance always rejects:
  - confirm student has active allocation
  - confirm building geolocation fields are populated
  - confirm timezone configuration and server clock

