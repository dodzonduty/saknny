# Firebase Setup for Saknny Mobile

Use the existing Firebase project: `saknny-dev`.

## Required Firebase services

- Firebase Authentication
- Firebase Cloud Messaging

## Config files

Download mobile config files from `saknny-dev` and place them here:

- Android: `mobile/android/app/google-services.json`
- iOS: `mobile/ios/Runner/GoogleService-Info.plist`

These files are ignored by git and must not be committed.

## FlutterFire note

When the Firebase CLI / FlutterFire CLI is available, run from `mobile/`:

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=saknny-dev
```

If this generates `lib/firebase_options.dart`, keep it local unless the team decides to commit non-secret Firebase app options.

## Current app behavior

`main.dart` attempts `Firebase.initializeApp()` safely. If Firebase config files are missing, the app still opens and shows the Firebase initialization error in the login screen so backend API work can continue.

