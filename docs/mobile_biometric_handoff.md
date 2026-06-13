# Mobile Biometric Architecture Handoff

This document provides a comprehensive summary of the Biometric Attendance Architecture implemented for the Saknny system, serving as a handoff and reference guide for mobile and backend developers.

## 1. Architectural Overview

The goal of this update was to introduce **OS-level Biometric Gates** (App Unlock & Check-in) while maintaining a highly secure, offline-tolerant, and single-source-of-truth backend. 

Key changes include:
1. **Encrypted Sessions:** Migrating from plain-text `SharedPreferences` to `FlutterSecureStorage`.
2. **Biometric Gates:** Forcing OS-level authentication (Fingerprint/FaceID) when opening the app and when confirming attendance.
3. **Trusted Device Lockdown:** Ensuring a student can only check-in from their registered, primary device.
4. **Event Sourcing via Firebase:** Backend `/attendance/check-in` logs to a locked-down Firestore collection (`mobile_event_log`). A background Python worker syncs these events into PostgreSQL.

---

## 2. Backend & Database Edits

### Schema Updates
- Added `trusted_device_id` and `trusted_device_registered_at` to the `students` table.
- Added `biometric_verified` (boolean) to the `attendance_records` table.
- Created new synchronization models: `firebase_sync_cursors` and `firebase_sync_failures`.
- Generated and applied Alembic migration for these schema changes.

### FastAPI Endpoints (`attendance.py`)
- **Device Registration (`POST /devices/register`)**: Now saves the `device_id` to the student's profile as their trusted device and logs a `device_registered` event to Firebase.
- **Attendance Check-in (`POST /attendance/check-in`)**:
  - Validates `trusted_device_id`. Hard rejects with `"Trusted device mismatch"` if the student attempts to check in from a different device.
  - `student_id` in the request payload was made optional to prevent identity mismatches; the backend relies strictly on the token-derived identity.
  - **Firebase Routing**: Instead of writing directly to PostgreSQL, successful checks (and rejections) are logged to Firestore using `append_mobile_event` when `ATTENDANCE_SYNC_VIA_FIREBASE` is active.

### Background Sync Worker
- Created `scripts/sync_firebase_events.py`.
- Uses the Firebase Admin SDK `on_snapshot` listener to immediately process pending events from `mobile_event_log` and commit them to PostgreSQL (`attendance_records`).
- Features a robust cursor and failure retry system.

### Configuration & Security Rules
- Added `mobile_event_log` denial rules to `firestore.rules` preventing direct mobile reads/writes (only the Backend Admin SDK has access).
- Added `FIRESTORE_EVENTS_COLLECTION=mobile_event_log` and `ATTENDANCE_SYNC_VIA_FIREBASE=true` to `.env` and `config.py`.

---

## 3. Mobile App Edits

### Session Security (`session_store.dart`)
- Migrated token, student ID, and Firebase UID storage to `FlutterSecureStorage`.
- Includes an automatic one-time migration step that safely moves legacy `SharedPreferences` data to the secure enclave.

### Biometric Gates (`biometric_service.dart`)
- Implemented `authenticateForAppUnlock()` and `authenticateForAttendance()` leveraging the `local_auth` package.

### Authentication Flow (`auth_service.dart` & `main.dart`)
- Added `tryRestoreSession()` to offline-validate existing JWT tokens if Firebase indicates the user is logged in.
- **App Unlock Logic (`main.dart`)**: The app routing now checks for biometric enrollment. If enrolled, the user is immediately prompted for biometrics on app start. Success drops them directly onto the Home Screen without entering a password.

### Attendance Service (`attendance_service.dart`)
- Removed direct `cloud_firestore` writes.
- `checkInWithCurrentLocation()` now securely calls the backend `POST /attendance/check-in` endpoint, passing `biometric_verified: true` alongside GPS coordinates.

---

## 4. Frontend Developer Testing Checklist

To fully test these changes in a local/staging environment, the mobile developer should follow these steps:

1. **Shift to Production Mode**: 
   - Ensure `main.dart` is booting the real `SaknnyApp` routing (not the UI demo).
   - Ensure the app is connected to the real backend `ApiClient`.
2. **Start Backend Services**:
   - Run the FastAPI server: `uvicorn backend.app.main:app --reload`
   - Run the background sync worker: `python scripts/sync_firebase_events.py`
3. **Execute Test Flows**:
   - **Login & Enroll**: Log in via email/password. Ensure the biometric enrollment prompt appears and functions.
   - **App Unlock**: Force close the app and reopen it. Validate that the OS biometric prompt appears and successfully restores the session.
   - **Check-in Gate**: Go to the check-in screen and tap "Attend". Pass the biometric prompt. Verify that the check-in passes.
   - **Data Validation**: Check Firestore `mobile_event_log` for the event, then check PostgreSQL `attendance_records` to ensure the worker picked it up.
   - **Trusted Device**: Wipe the app data (or use a secondary emulator), log in with the same student account, and attempt to check in. Verify that the backend rejects the attempt with a `"Trusted device mismatch"` error.
