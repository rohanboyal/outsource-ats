"""
Database session and engine configuration.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator

from app.core.config import settings


# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Maximum overflow connections
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency.
    
    Yields:
        Database session
        
    Example:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    Should be called on application startup.
    """
    # Import all models here to ensure they are registered
    # This will be populated as we create models
    from app.models import user  # noqa
    from app.models import client  # noqa
    # ... more model imports will be added
    
    Base.metadata.create_all(bind=engine)
