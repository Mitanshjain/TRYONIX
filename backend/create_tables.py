# ==========================================
# TRYONIX - CREATE DATABASE TABLES
# ==========================================

from backend.database import Base, engine
from backend import models


# Create tables defined in SQLAlchemy models
Base.metadata.create_all(bind=engine)

print("TRYONIX database tables created successfully!")