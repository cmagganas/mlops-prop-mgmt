from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings.

    This class defines all configuration settings for the application,
    with defaults and environmental variable overrides.
    """

    app_name: str = "Property Management API"
    app_description: str = "API for managing properties, units, tenants, and payments"
    app_version: str = "0.1.0"
    debug: bool = Field(default=True, description="Run in debug mode")
    host: str = Field(default="0.0.0.0", description="Host to bind the API server")
    port: int = Field(default=8000, description="Port to bind the API server")

    # Database settings can be added here when needed

    model_config = {
        "env_file": ".env",
        "env_prefix": "API_",  # API_DEBUG, API_HOST, etc.
    }


settings = Settings()
