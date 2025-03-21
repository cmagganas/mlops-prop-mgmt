"""JWT token verification module.

This module provides utilities for verifying JWT tokens from AWS Cognito.
"""

import time
from typing import (
    Dict,
    Optional,
)

import httpx
from api.auth.cognito import CognitoAuth
from api.config import settings
from fastapi import (
    Cookie,
    Depends,
    HTTPException,
    Request,
)

# Cache for JWKS
_jwks_cache = None
_jwks_cache_timestamp = 0.0
_JWKS_CACHE_TTL = 3600  # 1 hour


async def get_jwks() -> Dict:
    """Fetch JWKS (JSON Web Key Set) from Cognito and cache it."""
    global _jwks_cache, _jwks_cache_timestamp

    current_time = time.time()

    # Return cached JWKS if still valid
    if _jwks_cache and (current_time - _jwks_cache_timestamp) < _JWKS_CACHE_TTL:
        return _jwks_cache

    # Fetch new JWKS
    jwks_uri = f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}/.well-known/jwks.json"
    print(f"Fetching JWKS from: {jwks_uri}")

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_uri)

        if response.status_code != 200:
            print(f"JWKS fetch failed: {response.text}")
            raise Exception(f"Failed to fetch JWKS: {response.text}")

        print("JWKS fetch successful")
        _jwks_cache = response.json()
        _jwks_cache_timestamp = current_time

        return _jwks_cache


async def verify_jwt_token(request: Request, id_token: Optional[str] = Cookie(None)) -> Dict:
    """Verify the JWT token and return its claims if valid.

    This function can be used as a FastAPI dependency to protect routes.
    It extracts the JWT token from the cookies and verifies it.

    Args:
        request: The FastAPI request object
        id_token: The JWT token from the cookie

    Returns:
        Dictionary containing the token claims

    Raises:
        HTTPException: If the token is missing or invalid
    """
    path = request.url.path
    print(f"Verifying JWT token for path: {path}")
    
    if not id_token:
        print("No ID token found in cookies")
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Create a CognitoAuth instance
        auth = CognitoAuth(settings)

        # Validate the token
        print(f"Validating token (first 20 chars): {id_token[:20]}...")
        claims = await auth.validate_token(id_token)
        print(f"Token validated successfully for subject: {claims.get('sub', 'unknown')}")

        return claims

    except Exception as e:
        print(f"Token validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}") from e


# Set up standard dependencies
def get_current_user(user_claims: Dict = Depends(verify_jwt_token)) -> Dict:
    """Get the current authenticated user from the JWT token.

    This dependency extracts user information from the validated JWT claims.

    Args:
        user_claims: The validated JWT claims

    Returns:
        Dictionary with user information
    """
    user = {
        "user_id": user_claims.get("sub"),
        "email": user_claims.get("email"),
        "username": user_claims.get("cognito:username", user_claims.get("username")),
        "given_name": user_claims.get("given_name"),
        "family_name": user_claims.get("family_name"),
        "name": user_claims.get("name"),
        "groups": user_claims.get("cognito:groups", []),
        "email_verified": user_claims.get("email_verified", False),
    }
    
    print(f"User authenticated: {user['email']} (ID: {user['user_id']})")
    return user


def require_admin(user: Dict = Depends(get_current_user)) -> Dict:
    """Require admin role for access to a route.

    This dependency checks if the user has admin privileges.

    Args:
        user: The user information

    Returns:
        The user information if admin

    Raises:
        HTTPException: If user is not an admin
    """
    if "admin" not in user.get("groups", []):
        print(f"Access denied for user {user.get('email')}: Not an admin")
        raise HTTPException(status_code=403, detail="Insufficient permissions. Admin role required.")
    
    print(f"Admin access granted for user {user.get('email')}")
    return user
