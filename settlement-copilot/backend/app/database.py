"""SQLAlchemy database setup."""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

logger = logging.getLogger(__name__)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import Base  # noqa: F401 — triggers model registration
    Base.metadata.create_all(bind=engine)
    
    # Migration helper: ensure new columns exist in SQLite database
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE exceptions ADD COLUMN priority VARCHAR DEFAULT 'MEDIUM'"))
            conn.commit()
        except Exception:
            pass  # Column already exists

        try:
            conn.execute(text("ALTER TABLE exceptions ADD COLUMN status VARCHAR DEFAULT 'PENDING'"))
            conn.commit()
            logger.info("Migrated SQLite table 'exceptions': added status column.")
        except Exception:
            pass  # Column already exists
