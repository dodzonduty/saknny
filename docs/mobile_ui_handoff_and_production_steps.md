# Saknny Mobile — UI Handoff & Transition to Production

This document summarizes the frontend UI demo developed for the Saknny Mobile Attendance app, details the missing backend login API payload requirements for your teammate, and outlines the step-by-step path to shift the client app from Demo Mode to Production Mode.

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

## 2) Missing Backend API Features

To move to a functional production app, the backend developer needs to add the following fields to the login response:

### JWT Login Endpoint (`POST /api/v1/auth/login`)
Currently, the backend login response returns only:
```json
{
  "access_token": "eyJhb...",
  "token_type": "bearer",
  "role": "student",
  "user_id": 15
}
```

**Required Addition:**
The mobile app needs **`name`** (to greet the student) and **`firebase_uid`** (to bridge Firebase custom authentication) in the payload:
```json
{
  "access_token": "eyJhb...",
  "token_type": "bearer",
  "role": "student",
  "user_id": 15,
  "name": "Ahmed Mohamed",
  "firebase_uid": "firebase-uid-string"
}
```
*Why this is needed:* Without `firebase_uid` returned directly on login, the student would have to manually type their Firebase UID inside the mobile client to link FCM push tokens and Firebase services. Returning the name allows the app's dashboard to say "Welcome, Ahmed".

---

## 3) Path from Demo to Production (For the Agent/Teammates)

When you are ready to connect the frontend to the backend and restore real functionality, follow these steps:

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
