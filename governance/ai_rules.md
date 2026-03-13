# AI Development Rules

These rules apply to AI coding assistants such as Cursor and Antigravity.

---

# Mandatory Behavior

AI agents must:

1. Read governance files before implementing code
2. Declare their role before coding
3. Respect ownership boundaries
4. Follow API contracts
5. Log major changes in governance/changelog.md

---

# Prohibited Actions

AI agents must NOT:

- introduce new frameworks
- modify database schema
- change API contracts
- alter ML pipeline
- modify files owned by other roles

---

# Required Workflow

Before implementing a feature the AI must:

1. Declare its role
2. Verify ownership of the files it will modify
3. Check API contract definitions
4. Implement the change within its domain

If the change requires another role:

Log a request in governance/changelog.md.
