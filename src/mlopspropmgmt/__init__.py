"""Property Management API package.

This package provides a FastAPI application for managing properties, units, tenants, and payments.
"""

__version__ = "0.1.0"

from .config import settings
from .main import (
    app,
    create_app,
)

__all__ = ["app", "create_app", "settings", "__version__"]
