import sqlite3

con = sqlite3.connect('cosmohealthx.db')
cur = con.cursor()

cols_a = [c[1] for c in cur.execute('PRAGMA table_info(astronauts)').fetchall()]
definitions = [
    ('avatar_url', 'TEXT'),
    ('age', 'INTEGER DEFAULT 34'),
    ('blood_type', 'TEXT DEFAULT "O+"'),
    ('notes', 'TEXT DEFAULT ""'),
    ('emergency_contact', 'TEXT DEFAULT ""'),
    ('resting_hr', 'INTEGER DEFAULT 65'),
    ('max_hr', 'INTEGER DEFAULT 175'),
]
for col, typ in definitions:
    if col not in cols_a:
        cur.execute(f'ALTER TABLE astronauts ADD COLUMN {col} {typ}')
        print(f"Added column {col} to astronauts")

cols_u = [c[1] for c in cur.execute('PRAGMA table_info(users)').fetchall()]
if 'avatar_url' not in cols_u:
    cur.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT')
    print("Added avatar_url to users")

con.commit()
print('Astronaut columns:', [c[1] for c in cur.execute('PRAGMA table_info(astronauts)').fetchall()])
print('User columns:', [c[1] for c in cur.execute('PRAGMA table_info(users)').fetchall()])
con.close()
