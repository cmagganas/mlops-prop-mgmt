import socket
import traceback
from typing import (
    Dict,
    Optional,
)

import httpx
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from fastapi.responses import (
    JSONResponse,
    RedirectResponse,
)

from ..auth.cognito import (
    exchange_code_for_tokens,
    get_cognito_auth,
)
from ..auth.jwt import get_current_user
from ..auth.oauth import (
    fetch_token,
    get_authorization_url,
    get_userinfo,
)
from ..config import settings

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)


@router.get("/login")
async def login():
    """Redirect to Cognito hosted UI for login."""
    auth = get_cognito_auth()
    return RedirectResponse(url=auth.get_login_url())


@router.get("/login-authlib")
async def login_authlib():
    """Alternative login using authlib."""
    auth_url = await get_authorization_url()
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(request: Request, code: str = None, error: str = None, error_description: str = None):
    """Handle the OAuth callback from Cognito."""
    # Handle error response from Cognito
    if error:
        error_msg = f"Authentication error: {error}"
        if error_description:
            error_msg += f" - {error_description}"
        raise HTTPException(status_code=400, detail=error_msg)

    # Ensure we have an authorization code
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")

    try:
        # Log which approach we're using
        use_authlib = request.query_params.get("use_authlib", "false").lower() == "true"

        if use_authlib:
            print("Debug - Using Authlib to exchange token")
            # Use authlib to exchange the code
            tokens = await fetch_token(code, request)

            # Try to get user info
            user_info = await get_userinfo(token=tokens)
            print(f"Debug - User info: {user_info}")
        else:
            # Use existing implementation
            print(f"Debug - Received authorization code: {code[:10]}...")
            tokens = await exchange_code_for_tokens(code)

        # Set tokens in httpOnly cookies
        response = RedirectResponse(url=settings.frontend_url)
        response.set_cookie(
            key="id_token", value=tokens["id_token"], httponly=True, secure=settings.cookie_secure, samesite="lax"
        )
        return response
    except Exception as e:
        error_detail = f"Error processing callback: {str(e)}"
        print(f"Debug - Callback error: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail) from e


@router.get("/logout")
async def logout():
    """Log the user out by clearing cookies and redirecting to the frontend directly.

    Implementation details:
    1. Clears the id_token cookie which contains the JWT that authenticates the user
    2. Redirects back to the frontend application

    Note:
    - We specifically avoid using Cognito's built-in logout endpoints (/logout or /oauth2/logout)
      as they don't work consistently across different AWS Cognito configurations and versions.
    - AWS Cognito lacks a standardized logout flow that works reliably across all setups.
    - This approach is simpler and more reliable as it only depends on HTTP cookie mechanics
      which are standardized across all browsers.
    - When the frontend loads after logout, it will detect that no authentication cookie exists
      and show the login UI.
    """
    # Clear the auth cookie and redirect to frontend
    response = RedirectResponse(url=settings.frontend_url)
    response.delete_cookie(key="id_token")
    return response


@router.get("/user")
async def get_user_info(user: Dict = Depends(get_current_user)):
    """Get information about the authenticated user."""
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "username": user.get("username"),
        "name": user.get("name"),
        "groups": user.get("groups", []),
    }


@router.get("/userinfo-authlib")
async def get_userinfo_authlib(id_token: Optional[str] = None):
    """Get user info using Authlib from token."""
    try:
        if not id_token:
            raise HTTPException(status_code=401, detail="No token provided")

        user_info = await get_userinfo(access_token=id_token)
        return JSONResponse(content=user_info)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching user info: {str(e)}") from e


@router.get("/test")
async def test_auth():
    """Test endpoint to verify AWS Cognito configuration."""
    # Check if Cognito settings are configured
    cognito_settings = {
        "aws_region": settings.aws_region,
        "cognito_region": settings.cognito_region,
        "cognito_user_pool_id": settings.cognito_user_pool_id,
        "cognito_client_id": settings.cognito_client_id,
        "cognito_domain": settings.cognito_domain,
        "redirect_uri": settings.redirect_uri,
    }

    # Check if any of the required settings are missing
    missing_settings = [k for k, v in cognito_settings.items() if not v]

    if missing_settings:
        return {
            "status": "error",
            "message": "Cognito configuration incomplete",
            "missing_settings": missing_settings,
            "configured_settings": {k: v for k, v in cognito_settings.items() if v},
        }

    # Generate a login URL to verify domain is correctly configured
    auth = get_cognito_auth()
    login_url = auth.get_login_url()

    return {
        "status": "success",
        "message": "Cognito configuration appears valid",
        "configuration": cognito_settings,
        "login_url": login_url,
        "next_steps": [
            "1. Visit /auth/login to test the authentication flow",
            "2. After login, visit /auth/user to see your user information",
            "3. Or try the Authlib version: /auth/login-authlib",
        ],
    }


@router.get("/debug")
async def debug_settings():
    """Debug endpoint to check current settings."""
    return {
        "client_id": settings.cognito_client_id,
        "domain": settings.cognito_domain,
        "region": settings.cognito_region,
        "redirect_uri": settings.redirect_uri,
        "has_client_secret": bool(settings.cognito_client_secret),
        "client_secret_prefix": settings.cognito_client_secret[:5] if settings.cognito_client_secret else None,
        "scopes": settings.cognito_scopes_list,
        "auth_endpoint": settings.cognito_auth_endpoint,
        "token_endpoint": settings.cognito_token_endpoint,
        "logout_endpoint": settings.cognito_logout_endpoint,
        "jwks_uri": settings.cognito_jwks_uri,
        "domain_url": settings.cognito_domain_url,
        "env_file": settings.model_config.get("env_file"),
        "env_prefix": settings.model_config.get("env_prefix"),
    }


@router.get("/diagnostic")
async def run_diagnostic():
    """Advanced diagnostic endpoint that tests connectivity to Cognito endpoints."""
    results = {
        "env_loaded": True,
        "config": {
            "client_id": settings.cognito_client_id,
            "user_pool_id": settings.cognito_user_pool_id,
            "region": settings.cognito_region,
            "domain": settings.cognito_domain,
            "redirect_uri": settings.redirect_uri,
        },
        "urls": {
            "domain_url": settings.cognito_domain_url,
            "auth_endpoint": settings.cognito_auth_endpoint,
            "token_endpoint": settings.cognito_token_endpoint,
            "jwks_uri": settings.cognito_jwks_uri,
        },
        "network_checks": {},
        "endpoint_checks": {},
    }

    # DNS resolution test for main domain
    try:
        domain = settings.cognito_domain_url.replace("https://", "").replace("http://", "").split("/")[0]
        ip = socket.gethostbyname(domain)
        results["network_checks"]["domain_dns"] = {"status": "success", "domain": domain, "resolved_ip": ip}
    except Exception as e:
        results["network_checks"]["domain_dns"] = {
            "status": "error",
            "domain": domain,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
        }

    # Check JWKS endpoint
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(settings.cognito_jwks_uri)
            results["endpoint_checks"]["jwks"] = {
                "status": "success" if response.status_code == 200 else "error",
                "status_code": response.status_code,
                "response_preview": str(response.text)[:100] if response.text else None,
            }
        except Exception as e:
            results["endpoint_checks"]["jwks"] = {
                "status": "error",
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc(),
            }

    # Test connectivity to auth endpoint
    async with httpx.AsyncClient() as client:
        try:
            # Just check if we can reach it, don't actually authenticate
            response = await client.get(f"{settings.cognito_auth_endpoint}?dummy=1", follow_redirects=False)
            results["endpoint_checks"]["auth"] = {
                "status": "success" if response.status_code < 400 else "error",
                "status_code": response.status_code,
                "response_preview": str(response.text)[:100] if response.text else None,
            }
        except Exception as e:
            results["endpoint_checks"]["auth"] = {
                "status": "error",
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc(),
            }

    # Generate a login URL
    try:
        auth = get_cognito_auth()
        login_url = auth.get_login_url()
        results["generated_urls"] = {"login_url": login_url}
    except Exception as e:
        results["generated_urls"] = {"status": "error", "error": str(e)}

    return results
