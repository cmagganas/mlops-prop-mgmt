from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings.

    This class defines all configuration settings for the application,
    with defaults and environmental variable overrides."""

    app_name: str = "Property Management API"
    app_description: str = "API for managing properties, units, tenants, and payments"
    app_version: str = "0.1.0"
    debug: bool = Field(default=True, description="Run in debug mode")
    host: str = Field(default="0.0.0.0", description="Host to bind the API server")
    port: int = Field(default=8000, description="Port to bind the API server")

    # Auth settings (for future use)
    aws_region: str = Field(default="us-east-1", description="AWS region")
    cognito_user_pool_id: str = Field(default="", description="Cognito User Pool ID")
    cognito_client_id: str = Field(default="", description="Cognito App Client ID")
    cognito_client_secret: str = Field(default="", description="Cognito App Client Secret")
    cognito_domain_prefix: str = Field(default="", description="Cognito Domain Prefix")
    callback_url: str = Field(default="http://localhost:8000/auth/callback", description="OAuth2 callback URL")

    # Database settings can be added here when needed

    model_config = {
        "env_file": ".env",
        "env_prefix": "PROPMGMT_",  # PROPMGMT_DEBUG, PROPMGMT_HOST, etc.
    }


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance.

    Returns:

        Settings: Application settings"""
    return Settings()


# For backward compatibility
settings = get_settings()
