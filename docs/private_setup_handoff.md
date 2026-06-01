# Private Setup Handoff

These files and values are required for teammates to run the backend/mobile Firebase integration, but they must be shared privately and must not be committed to git.

---

## Required Private Backend Files

### 1. Firebase Admin service account JSON

Download from Firebase Console:

`saknny-dev` -> Project settings -> Service accounts -> Generate new private key

Share privately with backend developers only.

Recommended local location example:

```text
C:\Users\<name>\secrets\saknny-dev-service-account.json
```

Never place this file inside git.

### 2. Backend `.env`

Each backend developer should create:

```text
backend/.env
```

Use `backend/.env.example` as the template.

Required values:

```text
DATABASE_URL=postgresql://saknny_admin:saknny_secret_2026@localhost:5433/saknny
AUTO_CREATE_TABLES=false
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=saknny-dev
FIREBASE_CREDENTIALS_PATH=C:\absolute\path\to\saknny-dev-service-account.json
UNIVERSITY_TIMEZONE=Africa/Cairo
```

`backend/.env` is ignored by git.

---

## Required Private Mobile Files

These come from FlutterFire / Firebase project `saknny-dev`:

```text
mobile/android/app/google-services.json
mobile/ios/Runner/GoogleService-Info.plist
mobile/lib/firebase_options.dart
```

Current repo rules ignore these files so they will not be committed.

Mobile developers can regenerate them with:

```bash
cd mobile
flutterfire configure --project=saknny-dev
```

---

## Database Setup Commands

Run migrations:

```bash
python -m scripts.init_db
```

If Alembic is unavailable because dependencies are not installed:

```bash
python -m pip install alembic
```

If the machine is out of disk space, free space first. Migration cannot install dependencies without space.

---

## Existing Student Firebase Backfill

Current database inspection found existing students without `firebase_uid`.

After configuring `backend/.env` with the Firebase service account JSON, run:

```bash
python -m scripts.backfill_firebase_users --dry-run
python -m scripts.backfill_firebase_users
```

Behavior:

- If a Firebase user already exists by email, reuse its UID.
- If not, create a Firebase user using the PostgreSQL email/name.
- Store the generated/reused UID in `students.firebase_uid`.

This keeps PostgreSQL as the source of truth while linking existing rows to Firebase Auth.

---

## Data Still Needed For Attendance Demo

Before testing attendance, admins must configure each dorm building with:

- `latitude`
- `longitude`
- `allowed_radius_meters`

Students must also have active allocations.

Without building geofence data or active allocation, attendance will correctly reject.

