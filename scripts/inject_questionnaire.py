import sys
from backend.app.core.database import SessionLocal
from backend.app.models.compatibility import CompatibilityQuestionnaire
from backend.app.models.admin import Admin

def inject():
    db = SessionLocal()
    try:
        # Check if already exists
        q = db.query(CompatibilityQuestionnaire).filter_by(is_active=True).first()
        if q:
            print(f"Active questionnaire already exists with ID: {q.questionnaire_id}")
            return
            
        admin = db.query(Admin).first()
        admin_id = admin.admin_id if admin else 1

        new_q = CompatibilityQuestionnaire(
            title="Fall Term Roommate Matching",
            description="Please answer honestly so we can match you with the best roommate.",
            is_active=True,
            created_by=admin_id
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        print(f"Successfully injected active questionnaire ID {new_q.questionnaire_id} into the database.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inject()
