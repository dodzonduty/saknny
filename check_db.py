import psycopg2

conn = psycopg2.connect('postgresql://saknny_admin:saknny_secret_2026@localhost:5433/saknny')
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students';")
columns = cur.fetchall()

print("Columns in the 'students' table:")
for col in columns:
    print(f"- {col[0]} ({col[1]})")

conn.close()
