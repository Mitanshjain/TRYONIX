
# ==========================================
# TRYONIX - MYSQL DATABASE CONNECTION
# ==========================================

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# Load .env from TRYONIX root directory
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


# Database configuration
DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "3306")),
    database=os.getenv("DB_NAME", "tryonix_db"),
)


# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)


# Create database session
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


# Base class for database models
class Base(DeclarativeBase):
    pass


# Test MySQL connection
def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT DATABASE()"))
            print("MySQL connection successful!")
            print("Connected database:", result.scalar())

    except Exception as error:
        print("MySQL connection failed!")
        print(error)


if __name__ == "__main__":
    test_connection()
