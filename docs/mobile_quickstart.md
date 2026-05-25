# Saknny Mobile Quickstart

Fast path to get the mobile attendance flow working end-to-end.

---

## 1) Prerequisites

- Backend running (`/api/v1` reachable)
- Firebase project created
- Firebase Auth + FCM enabled
- Service account JSON generated

Backend config required:
- `FIREBASE_ENABLED=true`
- `FIREBASE_PROJECT_ID=<project_id>`
- `FIREBASE_CREDENTIALS_PATH=<abs_path_to_json>`
- `UNIVERSITY_TIMEZONE=Africa/Cairo`

---

## 2) Core API sequence

1. Login student (backend JWT)
   - `POST /api/v1/auth/login`
2. Get Firebase custom token
   - `POST /api/v1/mobile/firebase-token`
3. Sign into Firebase SDK with custom token
4. Register FCM token
   - `POST /api/v1/devices/register`
5. Submit attendance
   - `POST /api/v1/attendance/check-in`
6. Fetch score
   - `GET /api/v1/attendance/score`

Admin checks:
- `GET /api/v1/admin/attendance/analytics`
- `POST /api/v1/admin/notifications/send`

---

## 3) Minimum request payloads

## Firebase token bridge
```json
{
  "firebase_uid": "firebase-uid-string"
}
```

## Device register
```json
{
  "fcm_token": "fcm-token-string",
  "device_id": "android-uuid",
  "platform": "android"
}
```

## Attendance check-in
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

---

## 4) Expected behavior

- Student with active allocation + inside radius -> `SUCCESS`
- Outside radius -> `Outside permitted attendance zone`
- Same-day second success attempt -> `Attendance already marked for today`
- No active allocation -> `No active allocation found for attendance`

Notes:
- Duplicate checks use **university local day**.
- Decision time is **server time**.

---

## 5) Demo checklist

- [ ] Student can login and obtain backend JWT
- [ ] Student gets Firebase custom token and signs into Firebase
- [ ] FCM token registration succeeds
- [ ] Inside-geofence check-in succeeds
- [ ] Outside-geofence check-in is rejected
- [ ] Duplicate same-day attempt is rejected
- [ ] Admin analytics reflects updates
- [ ] Admin push send returns sent/failed counts

