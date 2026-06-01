# Saknny Mobile

Functional Flutter skeleton for Saknny mobile attendance.

This app intentionally keeps UI simple. It is designed to let the mobile/frontend team validate:

- backend JWT login
- Firebase custom-token bridge
- FCM token registration
- geofenced attendance check-in
- attendance score retrieval

## Run

```bash
cd mobile
flutter pub get
flutter run --dart-define=SAKNNY_API_BASE_URL=http://localhost:8000/api/v1
```

For Android emulator talking to a backend running on the host machine, use:

```bash
flutter run --dart-define=SAKNNY_API_BASE_URL=http://10.0.2.2:8000/api/v1
```

## Firebase

Use project: `saknny-dev`.

See `FIREBASE_SETUP.md` for where to place `google-services.json` and `GoogleService-Info.plist`.

## Contract rule

All business data flows through the FastAPI backend under `/api/v1`.
Do not use Firestore or Realtime Database for attendance, student, dorm, allocation, score, or analytics data.

# saknny_mobile

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
