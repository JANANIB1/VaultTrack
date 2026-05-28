import sqlite3

DB_NAME = "fintrack.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def init_db():
    conn = sqlite3.connect("fintrack.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            category TEXT,
            date TEXT,
            description TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT UNIQUE,
            monthly_limit REAL,
            alert_threshold REAL
        )
    """)

    conn.commit()
    conn.close()

