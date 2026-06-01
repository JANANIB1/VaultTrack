import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id          SERIAL PRIMARY KEY,
            amount      NUMERIC(12, 2),
            category    TEXT,
            date        TEXT,
            description TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id               SERIAL PRIMARY KEY,
            category         TEXT UNIQUE,
            monthly_limit    NUMERIC(12, 2),
            alert_threshold  NUMERIC(5, 4)
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()