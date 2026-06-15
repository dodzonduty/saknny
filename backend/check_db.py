from backend.app.core.config import settings
from sqlalchemy import create_engine, inspect

engine = create_engine(str(settings.DATABASE_URL))
insp = inspect(engine)
for table_name in insp.get_table_names():
    print(f"Table: {table_name}")
    for column in insp.get_columns(table_name):
        print(f"  - {column['name']} ({column['type']})")
