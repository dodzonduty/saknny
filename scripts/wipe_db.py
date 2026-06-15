import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text, MetaData
from backend.app.core.database import SessionLocal, engine

def wipe_db():
    print("Wiping all data from PostgreSQL database...")
    db = SessionLocal()
    try:
        # Reflect all tables currently in the database
        metadata = MetaData()
        metadata.reflect(bind=engine)
        
        # Get all table names, excluding the alembic_version table so we don't break migrations
        table_names = [table.name for table in metadata.sorted_tables if table.name != 'alembic_version']
        
        if table_names:
            tables_str = ", ".join(table_names)
            # Use CASCADE to handle foreign key dependencies automatically
            print(f"Executing: TRUNCATE TABLE {tables_str} CASCADE;")
            db.execute(text(f"TRUNCATE TABLE {tables_str} CASCADE;"))
            db.commit()
            print(f"\n✅ Successfully wiped all data from {len(table_names)} tables!")
        else:
            print("No tables found to wipe.")
            
    except Exception as e:
        print(f"❌ Error wiping database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    wipe_db()
