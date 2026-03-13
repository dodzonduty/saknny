# Saknny Development Log

This file records architectural changes and major development events.

---

# Log Format

[EVENT_TYPE]

Entity: <API | Module | Service | Component | Schema | Model>
Name: <name>
Role: <A|B|C|D>
Path: <file_path>
Status: MOCK | REAL
Action: CREATED | IMPLEMENTED | REPLACED | UPDATED
Owner: <developer>
Notes: <optional>
Date: <YYYY-MM-DD>

---

# Example Entry

[API]

Entity: API
Name: GET /students
Role: B
Path: backend/app/api/students.py
Status: REAL
Action: IMPLEMENTED
Owner: Backend Engineer
Notes: Replaced frontend mock
Date: 2026-03-13
