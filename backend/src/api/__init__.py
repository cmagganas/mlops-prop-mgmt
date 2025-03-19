"""Property Management API package.

This package provides a FastAPI application for managing properties, units, tenants, and payments."""

__version__ = "0.1.0"

from .config import settings
from .main import (
    create_app,
)

__all__ = ["create_app", "settings", "__version__"]
