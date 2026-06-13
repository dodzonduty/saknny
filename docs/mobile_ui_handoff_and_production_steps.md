# Saknny Mobile — UI Handoff & Transition to Production

This document summarizes the frontend UI demo developed for the Saknny Mobile Attendance app, documents the login API contract for production, and outlines the step-by-step path to shift the client app from Demo Mode to Production Mode.

---

## 1) Summary of What Was Built (UI/UX Demo)

We built a self-contained, fully interactive UI playground that bypasses Firebase and backend connections so the design can be reviewed immediately.

* **Design Tokens & Theme**:
  * Brand colors mapped from the web portal: Navy (`#1A365D`), Gold (`#FBBF24`), Off-white background, and rounded cards with soft borders/shadows.
  * Dynamic localization support: Swapping between Arabic (using **Cairo** font with RTL layout) and English (using **Manrope / Public Sans** font with LTR layout).
* **6 Attendance State Visualizations**:
  1. **Before Window**: Show clock icon and dynamic countdown timer (e.g. `1h 23m`). Attend button is disabled.
  2. **Inside Geofence & Open (Best Case)**: Pulses a green status indicator and enables the gold **ATTEND** fingerprint button. Tapping triggers a smooth biometric mockup and redirects to the Checked In state.
  3. **Outside Geofence & Open**: Displays an amber warning card showing the distance from the dorm room (e.g. `347m`) and disables the button.
  4. **Mock Location Detected**: Displays a red warning banner prompting the user to disable developer mock tools and disables the button.
  5. **Window Closed**: Mutes colors and displays next schedule (e.g. `9:45 PM tomorrow`).
  6. **Checked In**: Displays a green success container with a scaling checkmark animation and formatted current date.
* **Developer Debug Tool**:
  * A small Floating Action Button (**🔧**) is accessible on the screen. Tapping it opens a bottom sheet to manually toggle between all 6 UI states, change mock distance via a slider (50m to 2000m), and toggle languages on-the-fly.

---

## 2) Login API (Backend — Done)

**Endpoint:** `POST /api/v1/auth/login`

The backend now returns `name` and `firebase_uid` for students (and `name` for admins). Contract source: `contracts/api/contracts.md`.

### Student login response
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhb...",
    "token_type": "bearer",
    "role": "student",
    "user_id": 15,
    "name": "Ahmed Mohamed",
    "firebase_uid": "firebase-uid-string-or-null"
  },
  "error": null
}
```

### Admin login response
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhb...",
    "token_type": "bearer",
    "role": "admin",
    "user_id": 3,
    "name": "Housing Manager",
    "firebase_uid": null
  },
  "error": null
}
```

**Backend implementation:**
- `backend/app/schemas/auth.py` — `LoginResponse` includes `name`, `firebase_uid`
- `backend/app/api/endpoints/auth.py` — student login returns `student.name` and `student.firebase_uid`; admin login returns `admin.name` and `firebase_uid: null`

**Notes:**
- `firebase_uid` is populated when the student was registered with `FIREBASE_ENABLED=true`. If `null`, mobile must block Firebase/FCM steps and show a clear error (account not linked).
- No login request body change — still `email` + `password` only.

---

## 3) Frontend Updates Required

### Mobile app (required for production)

| File | Change |
|------|--------|
| `mobile/lib/services/auth_service.dart` | Read `name` and `firebase_uid` from login `data`. Stop requiring a manual `firebaseUid` parameter — use `data['firebase_uid']`. Persist both in session store. |
| `mobile/lib/services/session_store.dart` | Add optional `user_name` key; save/load on login. |
| `mobile/lib/screens/login_screen.dart` | Remove the temporary **Firebase UID** text field. Login = email + password only. |
| Attendance / home UI | Use stored `name` for welcome copy (e.g. "Welcome, Ahmed"). |
| Post-login flow | If `firebase_uid` is non-null → `POST /mobile/firebase-token` → FCM `POST /devices/register`. If null → show error that the account is not linked to Firebase. |

### Web app (optional — no breaking change)

The Next.js app **does not need changes** to keep working. `LoginForm` only uses `access_token`, `role`, and `user_id`; extra fields are ignored.

**Optional improvements** (web frontend teammate):

| File | Suggested change |
|------|------------------|
| `frontend/src/components/auth/LoginForm.tsx` | After successful login, if `response.data.name` is present, `localStorage.setItem("user_name", response.data.name)` to avoid an extra profile round-trip. |
| `frontend/src/components/dashboard/DashboardNavbar.tsx` | Can rely on cached `user_name` from login first; keep `GET /students/{user_id}` as refresh fallback. |
| `frontend/src/components/dashboard/WelcomeBanner.tsx` | Optional: personalize title using `user_name` from localStorage (currently generic i18n only). |

Admin web login also receives `name` in the same payload; no Firebase fields apply.

---

## 4) Path from Demo to Production (For the Agent/Teammates)

When you are ready to connect the frontend to the backend and restore real functionality, follow these steps:

### Step 0: Backend login contract (done)
Login returns `name` and `firebase_uid` as documented in section 2. Deploy/restart backend after pulling latest `main`.

### Step 1: Revert Main Route & Firebase Configuration
Restore the original `main.dart` entry point (currently set to load the demo directly):
```bash
git checkout lib/main.dart
```
Ensure that the Firebase initialization commands (`Firebase.initializeApp`) are uncommented inside `main.dart`.

### Step 2: Swap the Root Widget
Ensure the application starts with the `LoginScreen` instead of `AttendanceDemoScreen` inside the app router.

### Step 3: Connect the Real Service Layer
In `lib/saknny_mobile_app.dart`, wire up the services using the actual endpoints defined in `lib/services/api_client.dart` rather than mock values.

Update `auth_service.dart` to consume login `name` and `firebase_uid` (see section 3).

### Step 4: Bind Geolocation to Check-in
Inside `lib/services/attendance_service.dart`, replace the mock coordinates with real-time hardware location fetching using the `geolocator` package:
```dart
Position position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.high,
);
```

### Step 5: Enable Biometrics & FCM Registration
* Uncomment the FCM token registration inside `lib/services/device_service.dart`.
* Enable the biometric prompt (`local_auth` check) on first successful login and save credentials securely in `flutter_secure_storage` for future automatic login.
* Use `firebase_uid` from login response (not manual input) before calling `/mobile/firebase-token`.

### Step 6: Backend Background Workers
* The background worker `scripts/sync_firebase_events.py` must be running to synchronize mobile attendance events from Firestore into PostgreSQL.
* Keep `scripts/sync_attendance_listener.py` running if legacy behavior is still required.
