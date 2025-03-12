from functools import lru_cache
from typing import List

from pydantic import (
    Field,
    field_validator,
)
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

    # Auth settings
    aws_region: str = Field(default="us-east-1", description="AWS region")
    cognito_region: str = Field(default="us-east-1", description="Cognito region")
    cognito_user_pool_id: str = Field(default="", description="Cognito User Pool ID")
    cognito_client_id: str = Field(default="", description="Cognito App Client ID")
    cognito_client_secret: str = Field(default="", description="Cognito App Client Secret")
    cognito_domain: str = Field(default="", description="Cognito Domain")
    cognito_scopes: str = Field(default="openid email profile", description="Space-separated OAuth scopes")
    
    # URLs
    api_url: str = Field(default="http://localhost:8000", description="API URL")
    frontend_url: str = Field(default="http://localhost:3000", description="Frontend URL")
    redirect_uri: str = Field(default="http://localhost:8000/auth/callback", description="OAuth2 callback URL")
    
    # Security
    cookie_secure: bool = Field(default=False, description="Set cookies as secure (HTTPS only)")

    # Database settings can be added here when needed

    model_config = {
        "env_file": ".env",
        "env_prefix": "PROPMGMT_",  # PROPMGMT_DEBUG, PROPMGMT_HOST, etc.
    }

    @property
    def cognito_scopes_list(self) -> List[str]:
        """Convert space-separated scopes string to list."""
        return self.cognito_scopes.split()

    @field_validator("cookie_secure", mode="before")
    @classmethod
    def parse_bool(cls, v):
        """Parse boolean values from various formats."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            v = v.strip().lower()
            if v in ("true", "1", "yes", "on"):
                return True
            if v in ("false", "0", "no", "off"):
                return False
        return False


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance.

    Returns:

        Settings: Application settings"""
    return Settings()


# For backward compatibility
settings = get_settings()
