"""Authentication package for the Property Management API.

This package provides all authentication-related functionality
including Cognito integration, JWT handling, and middleware.
"""

from .cognito import (
    exchange_code_for_tokens,
    get_cognito_auth,
)
from .jwt import (
    get_current_user,
    require_admin,
    verify_jwt_token,
)
from .middleware import (
    AuthMiddleware,
    add_auth_middleware,
)

__all__ = [
    "exchange_code_for_tokens",
    "get_cognito_auth",
    "get_current_user",
    "require_admin",
    "verify_jwt_token",
    "add_auth_middleware",
    "AuthMiddleware",
]
