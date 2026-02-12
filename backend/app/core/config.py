"""
Core configuration settings for the application.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="mysql+pymysql://ats_user:ats_password@localhost:3306/ats_db",
        description="Database connection URL",
    )

    # ------------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------------
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )

    # ------------------------------------------------------------------
    # Security / JWT
    # ------------------------------------------------------------------
    SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production",
        min_length=32,
        description="Secret key for JWT encoding",
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    APP_NAME: str = Field(default="OutsourceATS")
    APP_VERSION: str = Field(default="1.0.0")
    ENVIRONMENT: str = Field(
        default="development",
        description="development | staging | production",
    )
    DEBUG: bool = Field(default=True)

    # ------------------------------------------------------------------
    # CORS (🔥 THIS IS WHAT FIXES YOUR ISSUE)
    # ------------------------------------------------------------------
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://ats.khuriwalgroup.com",
            "https://ats.khuriwalgroup.com",
            "http://localhost:3000",
            "http://localhost:5173",
        ],
        description="Allowed CORS origins",
    )

    # ------------------------------------------------------------------
    # File Upload
    # ------------------------------------------------------------------
    UPLOAD_DIR: str = Field(default="./uploads")
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024)  # 10 MB

    # ------------------------------------------------------------------
    # Email (Optional)
    # ------------------------------------------------------------------
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: str = "noreply@outsourceats.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False

    # ------------------------------------------------------------------
    # Pagination
    # ------------------------------------------------------------------
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # ------------------------------------------------------------------
    # Pydantic config
    # ------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# Global settings instance
settings = Settings()


# Helpers
def get_settings() -> Settings:
    return settings


def is_production() -> bool:
    return settings.ENVIRONMENT == "production"


def is_development() -> bool:
    return settings.ENVIRONMENT == "development"
