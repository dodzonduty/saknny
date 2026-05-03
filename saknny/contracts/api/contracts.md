# API Contracts (Authentication & Verification)

This file defines the API contracts for the Authentication and Verification modules.
All backend APIs must implement these endpoints exactly as described.
Frontend mocks must also follow this structure.

## Base URL
`/api/v1`

## Standard Response Format
```json
{
  "success": true|false,
  "data": { ... },
  "error": null | "error message"
}
```

---

## 1. Student Registration
`POST /students/register`

### Request (JSON)
```json
{
  "faculty_id": "231903608",
  "name": "Mohamed Ibrahem",
  "email": "mohamed@example.com",
  "gender": "M",
  "home_city": "Cairo",
  "password": "securepassword",
  "preferences": "Quiet room"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "email": "mohamed@example.com",
    "enroll_status": false
  },
  "error": null
}
```

---

## 2. Authentication Login
`POST /auth/login`

### Request (JSON)
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhb...",
    "token_type": "bearer",
    "role": "student",  // or "admin"
    "user_id": 1
  },
  "error": null
}
```

---

## 3. Upload Verification Document
`POST /students/{id}/documents`

### Headers
`Authorization: Bearer <access_token>`

### Request (multipart/form-data)
- `file`: (binary file data - JPEG, PNG, PDF max 5MB)
- `doc_type`: "college_id"

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "doc_id": 1,
    "doc_type": "college_id",
    "status": "pending",
    "file_path": "uploads/verification_docs/1/uuid_filename.jpg"
  },
  "error": null
}
```

---

## 4. List Verification Queue (Admin)
`GET /admin/verifications?status=pending`

### Headers
`Authorization: Bearer <admin_access_token>`

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "doc_id": 1,
        "student_id": 1,
        "student_name": "Mohamed Ibrahem",
        "doc_type": "college_id",
        "status": "pending",
        "file_url": "/api/v1/uploads/verification_docs/1/uuid_filename.jpg",
        "is_flagged": false,
        "created_at": "2026-04-24T18:00:00Z"
      }
    ]
  },
  "error": null
}
```

---

## 5. Review Verification Document (Admin)
`PUT /admin/verifications/{doc_id}`

### Headers
`Authorization: Bearer <admin_access_token>`

### Request (JSON)
```json
{
  "status": "approved", // or "rejected"
  "rejection_reason": null // or string if rejected
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "doc_id": 1,
    "status": "approved",
    "student_enroll_status": true // updated to true if this was the final approval
  },
  "error": null
}
```
