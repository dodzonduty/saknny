# Saknny Code Ownership

This file defines system ownership boundaries.

Each file in the repository must belong to exactly one role.

Roles must NOT modify files owned by other roles.

---

# Role Definitions

A → Data Layer  
B → API Layer  
C → UI Layer  
D → Intelligence Layer

---

# Role A — Data Layer

Owns:

backend/app/models/
contracts/database/
scripts/
datasets/
Responsibilities:

- database schema design
- SQLAlchemy models
- migrations
- seed scripts
- data integrity

Role A is the only role allowed to modify database models.

---

# Role B — API Layer

Owns:

backend/app/api/
backend/app/services/
backend/app/repositories/
backend/app/schemas/

Responsibilities:

- REST API endpoints
- authentication
- request validation
- business logic
- API integration with database

Role B must use database models defined by Role A.

Role B may not modify database schema.

---

# Role C — UI Layer

Owns:

frontend/

Responsibilities:

- UI components
- API consumption
- state management
- frontend routing
- local API mocks

Role C must follow API contracts defined in contracts/api/contracts.md.

---

# Role D — Intelligence Layer

Owns:

ml-model/
contracts/ai/
datasets/

Responsibilities:

- feature engineering
- dataset processing
- ML model training
- clustering algorithms
- AI inference logic

Only Role D may modify ML pipeline code.

---

# Cross-Role Rule

If a role requires changes in another role’s domain:

1. DO NOT modify the file
2. Add a request entry in governance/changelog.md
3. The owning role will implement the change
