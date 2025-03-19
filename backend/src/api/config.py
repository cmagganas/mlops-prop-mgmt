import os
from functools import lru_cache
from typing import (
    List,
    Optional,
)

from pydantic import (
    Field,
    ValidationError,
    field_validator,
    model_validator,
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
    aws_region: str = Field(default="", description="AWS region")
    cognito_region: str = Field(..., description="Cognito region")
    cognito_user_pool_id: str = Field(..., description="Cognito User Pool ID")
    cognito_client_id: str = Field(..., description="Cognito App Client ID")
    cognito_client_secret: Optional[str] = Field(default=None, description="Cognito App Client Secret")

    # This should be ONLY the domain prefix (e.g., "mydomain"), not the full URL
    cognito_domain: str = Field(default="", description="Cognito Domain or domain prefix")
    cognito_scopes: str = Field(default="openid email profile", description="Space-separated OAuth scopes")

    # URLs
    api_url: str = Field(default="http://localhost:8000", description="API URL")
    frontend_url: str = Field(default="http://localhost:3000", description="Frontend URL")
    redirect_uri: str = Field(default="http://localhost:8000/auth/callback", description="OAuth2 callback URL")

    # Security
    cookie_secure: bool = Field(default=False, description="Set cookies as secure (HTTPS only)")

    model_config = {
        # "env_file": ".env",
        "env_prefix": "REACT_APP_",  # PROPMGMT_DEBUG, PROPMGMT_HOST, etc.
    }

    @property
    def cognito_scopes_list(self) -> List[str]:
        """Convert space-separated scopes string to list."""
        return self.cognito_scopes.split()

    @property
    def cognito_domain_url(self) -> str:
        """Return the full Cognito domain URL.

        Properly handles different domain formats:
        1. Empty - uses the cognito-idp endpoint with user pool ID
        2. Full URL with protocol (https://example.com) - used as-is
        3. Domain with dots but no protocol (example.com) - adds https://
        4. Domain prefix only (myprefix) - constructs Cognito domain URL
        """
        if not self.cognito_domain:
            return f"https://cognito-idp.{self.cognito_region}.amazonaws.com/{self.cognito_user_pool_id}"

        # CRITICAL FIX: check if the domain ALREADY contains the full Cognito URL format
        # to prevent double-formatting that causes DNS errors
        if ".auth." in self.cognito_domain and ".amazoncognito.com" in self.cognito_domain:
            return (
                f"https://{self.cognito_domain}" if not self.cognito_domain.startswith("http") else self.cognito_domain
            )

        # Check if it's another kind of full domain (contains dots)
        if "." in self.cognito_domain:
            # Ensure it has a protocol
            if "://" not in self.cognito_domain:
                return f"https://{self.cognito_domain}"
            return self.cognito_domain

        # Otherwise, treat it as a Cognito domain prefix only
        return f"https://{self.cognito_domain}.auth.{self.cognito_region}.amazoncognito.com"

    @property
    def cognito_auth_endpoint(self) -> str:
        """Return the full Cognito authorization endpoint URL."""
        return f"{self.cognito_domain_url}/oauth2/authorize"

    @property
    def cognito_token_endpoint(self) -> str:
        """Return the full Cognito token endpoint URL."""
        return f"{self.cognito_domain_url}/oauth2/token"

    @property
    def cognito_logout_endpoint(self) -> str:
        """Return the full Cognito logout endpoint URL."""
        return f"{self.cognito_domain_url}/oauth2/logout"

    @property
    def cognito_jwks_uri(self) -> str:
        """Return the JWKS URI for token validation."""
        return f"https://cognito-idp.{self.cognito_region}.amazonaws.com/{self.cognito_user_pool_id}/.well-known/jwks.json"

    @model_validator(mode="after")
    def validate_cognito_settings(self):
        """Validate that all required Cognito settings are provided."""
        # In a production environment, we would validate these settings
        # For the demo, we'll allow defaults to be used
        required_settings = [
            ("cognito_user_pool_id", self.cognito_user_pool_id),
            ("cognito_client_id", self.cognito_client_id),
            ("cognito_region", self.cognito_region),
        ]

        missing = [name for name, value in required_settings if not value]
        if missing and not self.debug:
            # Only enforce in non-debug mode
            raise ValidationError(f"Missing required Cognito settings: {', '.join(missing)}")
        return self

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
    # Look for the .env file in the parent directory
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    return Settings(_env_file=env_path)


# For backward compatibility
settings = get_settings()
