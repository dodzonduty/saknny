# Saknny API Design Patterns

This file defines global API conventions.

All backend APIs must follow these patterns.

---

# Standard Response Format

All responses must follow this structure:

{
"success": true,
"data": {},
"error": null
}

Example:

{
"success": true,
"data": {
"students": []
}
}

---

# Error Response Format

{
"success": false,
"data": null,
"error": "error message"
}

---

# REST Naming Convention

Use standard REST routes.

Examples:

GET /students
GET /students/{id}

POST /applications
PUT /applications/{id}

DELETE /tickets/{id}

---

# ID Convention

All entities must use numeric IDs.

Example:

student_id
room_id
application_id
