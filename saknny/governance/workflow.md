# Saknny Development Workflow

This file defines the engineering workflow for the Saknny system.

All human developers and AI agents must follow these rules.

The goal of this workflow is to prevent:

- API mismatches
- database corruption
- AI-generated architectural drift
- cross-role conflicts

---

# 1. Role Declaration

Before implementing any code, the agent must declare its role.

Available roles:

A → Data Layer (Database & Models)  
B → API Layer (Backend API)  
C → UI Layer (Frontend)  
D → Intelligence Layer (AI/ML)

The agent must operate ONLY within its role's domain.

---

# 2. Stack Awareness Rule

The project stack is fixed.

Frontend

- Next.js
- React
- TypeScript
- TailwindCSS

Backend

- FastAPI
- PostgreSQL
- SQLAlchemy

AI

- Python
- Scikit-learn / PyTorch

Agents must NOT introduce new frameworks without explicit approval.

---

# 3. Ownership Rule

Each directory belongs to a specific role.

Agents must NOT modify files owned by other roles.

If a change is required in another role’s domain:

1. Do NOT edit the file.
2. Add an entry to governance/changelog.md describing the requested change.

---

# 4. Contract-Driven Development

All APIs must follow the definitions in:

contracts/api/contracts.md

Rules:

- Frontend must call APIs exactly as defined in contracts.
- Backend must return responses exactly matching the contract.
- Contracts must be updated BEFORE changing API structure.

Contracts are the **single source of truth** for system communication.

---

# 5. Mocking Rule

Frontend may use local mocks located in:

frontend/mocks/

Rules:

- Mocks must follow the exact structure defined in contracts/api/contracts.md
- Mocks are temporary placeholders
- When backend APIs are implemented, mocks must be removed

Environment flag:

USE_MOCKS=true

---

# 6. Database Safety Rule

The database layer is sensitive.

Rules:

- Only Role A may modify database models
- Database schema changes must be logged in governance/changelog.md
- Existing columns must NOT be renamed without migration planning
- Backend must adapt to the database schema defined by Role A

---

# 7. AI Pipeline Rule

The ML pipeline must remain stable.

Only Role D may modify:

ml-model/
datasets/

Other roles must not alter the AI pipeline.

---

# 8. Logging Rule

Major development events must be recorded in:

governance/changelog.md

Examples:

- API implemented
- database schema change
- AI model update
- mock replaced with real API

---

# 9. Mock Lifecycle Protocol

Mocks follow this lifecycle:

CREATED → USED → REPLACED → REMOVED

When backend implements an endpoint:

1. Replace frontend mock
2. Log replacement in changelog.md
