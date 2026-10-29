
# ==========================================
# TRYONIX - DATABASE CONNECTION
# Supports MySQL (Local) + PostgreSQL (Cloud)
# ==========================================

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

ROOT_DIR = Path(__file__).resolve().parent.parent

load_dotenv(ROOT_DIR / ".env", override=False)


# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# Cloud: Use DATABASE_URL from Render
# Local: Use existing MySQL variables

cloud_database_url = os.getenv("DATABASE_URL", "").strip()

if cloud_database_url:

    # Support common PostgreSQL URL formats
    if cloud_database_url.startswith("postgres://"):
        cloud_database_url = cloud_database_url.replace(
            "postgres://",
            "postgresql://",
            1
        )

    parsed_url = make_url(cloud_database_url)

    if parsed_url.drivername == "postgresql":
        parsed_url = parsed_url.set(
            drivername="postgresql+psycopg"
        )

    DATABASE_URL = parsed_url

else:

    DATABASE_URL = URL.create(
        drivername="mysql+pymysql",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "tryonix_db"),
    )


# ==========================================
# SQLALCHEMY ENGINE
# ==========================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)


# ==========================================
# DATABASE SESSION
# ==========================================

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


# ==========================================
# DATABASE MODELS BASE
# ==========================================

class Base(DeclarativeBase):
    pass


# ==========================================
# TEST DATABASE CONNECTION
# ==========================================

def test_connection():

    try:
        with engine.connect() as connection:

            database_name = connection.execute(
                text("SELECT current_database()")
                if engine.dialect.name == "postgresql"
                else text("SELECT DATABASE()")
            ).scalar()

            print("Database connection successful!")
            print("Database:", database_name)
            print("Dialect:", engine.dialect.name)

    except Exception as error:
        print("Database connection failed!")
        print(error)


if __name__ == "__main__":
    test_connection()
