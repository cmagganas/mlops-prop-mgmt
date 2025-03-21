"""Authentication middleware for FastAPI.

This module provides middleware for checking authentication status and 
redirecting unauthenticated users to the login page.
"""

import os
from typing import (
    List,
    Optional,
)

from api.config import settings
from fastapi import (
    FastAPI,
    Request,
    Response,
)
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Public paths that don't require authentication
DEFAULT_PUBLIC_PATHS = [
    "/auth/login",
    "/auth/callback",
    "/auth/logout",
    "/auth/test",
    "/auth/debug",
    "/auth/diagnostic",
    "/login",
    "/static",
    "/healthz",
    "/api/status",
    "/favicon.ico",
]

# Check if running in Lambda
IS_LAMBDA = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None
# API Gateway stage name (typically 'prod' or 'dev')
API_STAGE = os.environ.get("API_GATEWAY_STAGE", "prod")


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to check authentication status and redirect to login if necessary."""

    def __init__(
        self, 
        app: FastAPI, 
        public_paths: Optional[List[str]] = None,
        login_path: str = "/login"
    ):
        """Initialize the middleware.
        
        Args:
            app: The FastAPI application
            public_paths: List of paths that don't require authentication
            login_path: Path to redirect unauthenticated users to
        """
        super().__init__(app)
        self.public_paths = public_paths or DEFAULT_PUBLIC_PATHS
        self.login_path = login_path
        
        # Print middleware configuration in Lambda environment
        if IS_LAMBDA:
            print(f"Auth middleware initialized with API Gateway stage: {API_STAGE}")
            print(f"Public paths: {self.public_paths}")
            print(f"Login path: {self.login_path}")
            print(f"Root path: {settings.root_path}")

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process the request, checking for authentication as needed.
        
        Args:
            request: The incoming request
            call_next: The next middleware in the chain
            
        Returns:
            The response from the next middleware
        """
        # Extract the path from the request
        original_path = request.url.path
        path = original_path
        print(f"Original request path: {original_path}")
        
        # FastAPI handles the root_path stripping internally, so we don't need to manually strip it
        # We just need to focus on checking if the path is public
        
        # If we're running in Lambda with API Gateway, the path may have a stage prefix
        # For example: /prod/auth/login
        # We need to handle this for proper path matching
        if IS_LAMBDA and path.startswith(f"/{API_STAGE}"):
            # Remove the stage prefix for internal path matching
            path = path[len(f"/{API_STAGE}"):]
        
        # Check if the path is public (doesn't require authentication)
        if self._is_public_path(path):
            print(f"Path {path} is public, allowing request")
            return await call_next(request)
        
        # Check for auth cookies
        id_token = request.cookies.get("id_token")
        if not id_token:
            print(f"No auth token found, redirecting to login")
            # Use the login_path directly - FastAPI will add the root_path
            login_url = self.login_path
            if IS_LAMBDA:
                login_url = f"/{API_STAGE}{login_url}"
            print(f"Redirecting to: {login_url}")
            return RedirectResponse(url=login_url)
        
        # User has auth token, proceed with the request
        print(f"User authenticated, proceeding with request")
        return await call_next(request)

    def _is_public_path(self, path: str) -> bool:
        """Check if the path is in the list of public paths.
        
        Args:
            path: The path to check
            
        Returns:
            True if the path is public, False otherwise
        """
        # Direct match
        if path in self.public_paths:
            return True
        
        # Root path is always public
        if path == "/":
            return True
            
        # Check for path prefix matches
        for public_path in self.public_paths:
            if public_path.endswith('/') and path.startswith(public_path):
                return True
            elif path.startswith(f"{public_path}/"):
                return True
                
        return False


def add_auth_middleware(app: FastAPI, public_paths: Optional[List[str]] = None, login_path: str = "/login"):
    """Add the authentication middleware to the FastAPI app.
    
    Args:
        app: The FastAPI application
        public_paths: List of paths that don't require authentication
        login_path: Path to redirect unauthenticated users to
    """
    app.add_middleware(
        AuthMiddleware,
        public_paths=public_paths,
        login_path=login_path,
    ) 