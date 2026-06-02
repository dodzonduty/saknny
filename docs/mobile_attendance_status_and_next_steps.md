# Mobile Attendance Status and Next Steps

This document summarizes what has been completed for the Saknny mobile attendance subsystem and what remains before demo or production use.

---

## Completed Work

### Backend and Database

- PostgreSQL remains the single source of truth.
- Firebase is used only for authentication delegation, Firebase custom tokens, and FCM push notifications.
- Added Firebase linkage fields to students:
  - `firebase_uid`
  - `fcm_token`
- Added geofence fields to **room** records (attendance validates against the allocated room):
  - `latitude`
  - `longitude`
  - `allowed_radius_meters`
- Added `attendance_records` model/table for:
  - successful attendance
  - rejected attempts
  - rejection reasons
  - distance from allocated room
  - device logging
  - local-day duplicate prevention
- Added Alembic migration for the mobile attendance schema.

### Backend APIs

Implemented mobile attendance and Firebase-related APIs:

- `POST /api/v1/mobile/firebase-token`
- `POST /api/v1/devices/register`
- `POST /api/v1/attendance/check-in`
- `GET /api/v1/attendance/score`
- `GET /api/v1/admin/attendance/analytics`
- `POST /api/v1/admin/notifications/send`

Attendance rules implemented:

- Student can log in to mobile even without allocation.
- Attendance check-in requires active allocation.
- Server calculates geofence using Haversine formula.
- Server uses university-local day for duplicate checks.
- Server receive time is authoritative.
- Rejected attempts are logged in PostgreSQL.

### Contracts and Documentation

Updated:

- `contracts/api/contracts.md`
- `contracts/database/schema.md`
- `docs/mobile_team_handoff.md`
- `docs/mobile_quickstart.md`
- `docs/functional_traceability_matrix.md`
- `governance/changelog.md`

### Flutter Mobile Skeleton

Created new Flutter app in:

- `mobile/`

Implemented:

- backend JWT login flow
- Firebase custom-token bridge call
- Firebase sign-in placeholder flow
- FCM token registration
- GPS-based attendance check-in
- attendance score fetch
- minimal login/debug screens
- Firebase setup notes

Firebase project:

- `saknny-dev`

FlutterFire configuration was generated successfully for:

- Android
- iOS
- Web

Generated Firebase files are ignored by git and should not be committed.

---

## Current Validation Status

Backend:

- Python compile check passed.
- Backend traceability tests passed.

Mobile:

- `flutter analyze` passed.
- `dart format` completed.
- `flutter test` previously failed due to local disk-space error, not a code analysis error.

---

## What Is Left

### 1. Firebase Backend Environment

Configure backend runtime variables:

```text
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=saknny-dev
FIREBASE_CREDENTIALS_PATH=<absolute path to Firebase service account JSON>
UNIVERSITY_TIMEZONE=Africa/Cairo
```

The Firebase service account JSON must stay outside git.

### 2. Database Migration and Seed Data

Run the new Alembic migration.

Then seed or manually set:

- room latitude
- room longitude
- allowed radius (per room)
- student allocation
- student Firebase UID linkage, if testing existing students

Without room coordinates on the allocated room and an active allocation, attendance will correctly reject.

### 3. End-to-End Demo Testing

Test these scenarios:

- successful attendance inside dorm radius
- rejection outside geofence
- duplicate same-day attendance rejection
- unassigned student rejection
- attendance score update
- admin analytics update
- FCM token registration
- admin push notification dispatch

### 4. Mobile UI Work

The current Flutter UI is functional/debug-oriented only.

The mobile/frontend team still needs to build polished screens for:

- login
- home/dashboard
- attendance button
- attendance status
- score display
- notification display
- error states and loading states

### 5. Security and Hardening

Recommended before production:

- replace temporary Firebase UID text input with backend-provided profile data
- add better mobile token refresh handling
- add rate limiting for attendance attempts
- add more detailed tests for Firebase rollback and geofence edge cases
- verify Android/iOS runtime permissions on real devices
- confirm service account storage and deployment secrets strategy

---

## Recommended Next Execution Order

1. Clean git state and ensure large/generated files are not tracked.
2. Run database migration.
3. Configure backend Firebase environment.
4. Populate room geolocation and test allocation data.
5. Run backend locally.
6. Run Flutter app against local backend.
7. Test attendance scenarios.
8. Hand off Flutter screens to the UI/mobile frontend team.
9. Polish mobile UX while preserving the service layer and contracts.

