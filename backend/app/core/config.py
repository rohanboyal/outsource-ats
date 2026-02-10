"""
Core configuration settings for the application.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = Field(
        default="mysql+pymysql://ats_user:ats_password@localhost:3306/outsource_ats_db",
        description="Database connection URL"
    )
    
    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    
    # Security
    SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production",
        min_length=32,
        description="Secret key for JWT encoding"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiry in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiry in days")
    
    # Application
    APP_NAME: str = Field(default="OutsourceATS", description="Application name")
    APP_VERSION: str = Field(default="1.0.0", description="Application version")
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )
    
    # File Upload
    UPLOAD_DIR: str = Field(default="./uploads", description="Upload directory path")
    MAX_UPLOAD_SIZE: int = Field(default=10485760, description="Max upload size in bytes (10MB)")
    
    # Email (Optional)
    MAIL_USERNAME: Optional[str] = Field(default=None, description="Email username")
    MAIL_PASSWORD: Optional[str] = Field(default=None, description="Email password")
    MAIL_FROM: str = Field(default="noreply@outsourceats.com", description="From email address")
    MAIL_PORT: int = Field(default=587, description="SMTP port")
    MAIL_SERVER: str = Field(default="smtp.gmail.com", description="SMTP server")
    MAIL_TLS: bool = Field(default=True, description="Use TLS")
    MAIL_SSL: bool = Field(default=False, description="Use SSL")
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20, description="Default page size for pagination")
    MAX_PAGE_SIZE: int = Field(default=100, description="Maximum page size for pagination")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Create global settings instance
settings = Settings()


# Helper functions
def get_settings() -> Settings:
    """Get application settings."""
    return settings


def is_production() -> bool:
    """Check if running in production environment."""
    return settings.ENVIRONMENT == "production"


def is_development() -> bool:
    """Check if running in development environment."""
    return settings.ENVIRONMENT == "development"
