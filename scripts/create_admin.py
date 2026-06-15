import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal
from backend.app.models.admin import Admin
from backend.app.core.security import get_password_hash

def create_admin():
    print("Creating Admin User...")
    db = SessionLocal()
    
    email = "admin@sakkny.com"
    password = "admin123"
    name = "Super Admin"
    role = "Super Admin"
    
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == email).first()
        if existing_admin:
            print(f"⚠️ Admin '{email}' already exists in the database.")
            return
            
        hashed_password = get_password_hash(password)
        
        admin = Admin(
            name=name,
            email=email,
            password_hash=hashed_password,
            role=role
        )
        
        db.add(admin)
        db.commit()
        print(f"✅ Successfully created admin user!")
        print(f"   Email:    {email}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
