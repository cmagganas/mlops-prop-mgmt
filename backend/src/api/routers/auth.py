import os
import socket
import traceback
from pathlib import Path
from typing import (
    Dict,
    Optional,
)

import httpx
from api.auth.cognito import (
    exchange_code_for_tokens,
    get_cognito_auth,
)
from api.auth.jwt import get_current_user
from api.auth.oauth import (
    fetch_token,
    get_authorization_url,
    get_userinfo,
)
from api.config import settings
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from fastapi.responses import (
    HTMLResponse,
    JSONResponse,
    RedirectResponse,
)
from fastapi.templating import Jinja2Templates

# Check if running in Lambda
IS_LAMBDA = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None
# API Gateway stage name (typically 'prod' or 'dev')
API_STAGE = os.environ.get("API_GATEWAY_STAGE", "prod")

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)

templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))

def get_url_with_stage(path: str) -> str:
    """Add API Gateway stage to URL if in Lambda environment.
    
    Args:
        path: The path to add the stage to
        
    Returns:
        The path with the stage prefix if in Lambda, otherwise the path
    """
    if IS_LAMBDA and not path.startswith("/"):
        path = f"/{path}"
    
    if IS_LAMBDA:
        return f"/{API_STAGE}{path}"
    
    return path

@router.get("/login")
async def login():
    """Redirect to Cognito hosted UI for login."""
    auth = get_cognito_auth()
    login_url = auth.get_login_url()
    print(f"Redirecting to Cognito login URL: {login_url}")
    return RedirectResponse(url=login_url)


@router.get("/login-authlib")
async def login_authlib():
    """Alternative login using authlib."""
    auth_url = await get_authorization_url()
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(request: Request, code: Optional[str] = None, error: Optional[str] = None):
    """Handle the OAuth callback from Cognito."""
    # If error is present in the query parameters, there was an issue with authentication
    if error:
        error_message = f"Authentication error: {error}"
        print(error_message)
        return JSONResponse(
            status_code=400,
            content={"error": error_message},
        )

    # If code is not present, redirect to login
    if not code:
        print("No authorization code provided in callback. Redirecting to login.")
        return RedirectResponse(url="/login")

    try:
        # Exchange the authorization code for tokens
        print(f"Exchanging authorization code for tokens: {code[:10]}...")
        tokens = await exchange_code_for_tokens(auth_code=code)
        
        # Extract tokens
        id_token = tokens.get("id_token")
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        
        if not id_token:
            raise HTTPException(status_code=400, detail="No ID token returned from Cognito")
            
        # Redirect to the dashboard with tokens in secure cookies
        dashboard_url = "/dashboard"
        print(f"Authentication successful. Redirecting to dashboard: {dashboard_url}")
        response = RedirectResponse(url=dashboard_url)
        
        # Set secure HTTP-only cookies
        max_age = 3600  # 1 hour
        response.set_cookie(
            key="id_token",
            value=id_token,
            httponly=True,
            secure=IS_LAMBDA,  # Only set as secure in Lambda/production
            samesite="lax",  # Changed from strict to lax for cross-domain redirects
            max_age=max_age,
        )
        
        if access_token:
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=IS_LAMBDA,
                samesite="lax",
                max_age=max_age,
            )
            
        if refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=IS_LAMBDA,
                samesite="lax",
                max_age=30 * 24 * 3600,  # 30 days
            )
            
        return response
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in callback: {str(e)}\n{error_details}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to complete authentication: {str(e)}",
                "details": error_details if settings.debug else None,
            }
        )


@router.get("/logout")
async def logout():
    """Log out the user by clearing the auth cookies."""
    login_url = "/login"
    response = RedirectResponse(url=login_url)
    
    print(f"Logging out user. Redirecting to: {login_url}")
    
    # Clear all auth cookies
    for cookie_name in ["id_token", "access_token", "refresh_token"]:
        response.delete_cookie(cookie_name)
        
    return response


@router.get("/user")
async def get_user(user: dict = Depends(get_current_user)):
    """Return the current user's information."""
    return user


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
        "is_lambda": IS_LAMBDA,
        "api_stage": API_STAGE,
        "root_path": settings.root_path,
        "has_client_secret": bool(settings.cognito_client_secret),
        "client_secret_prefix": settings.cognito_client_secret[:5] if settings.cognito_client_secret else None,
        "scopes": settings.cognito_scopes_list,
        "auth_endpoint": settings.cognito_auth_endpoint,
        "token_endpoint": settings.cognito_token_endpoint,
        "logout_endpoint": settings.cognito_logout_endpoint,
        "jwks_uri": settings.cognito_jwks_uri,
        "domain_url": settings.cognito_domain_url,
        "environment_info": {
            "lambda_function_name": os.environ.get("AWS_LAMBDA_FUNCTION_NAME"),
            "lambda_function_version": os.environ.get("AWS_LAMBDA_FUNCTION_VERSION"),
            "region": os.environ.get("AWS_REGION"),
            "api_id": os.environ.get("AWS_API_ID"),
        }
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


@router.get("/login-page", response_class=HTMLResponse)
async def login_page(request: Request):
    """Render the login page with a 'Sign in with AWS Cognito' button."""
    # Check if this is a Lambda environment
    context = {"request": request}
    
    # If in Lambda, we need to use templates specific to API Gateway
    if IS_LAMBDA:
        # The login button in the template should include the API Gateway stage
        context["api_stage"] = API_STAGE
        print(f"Lambda environment detected, using API stage: {API_STAGE}")
            
    return templates.TemplateResponse("login.html", context)
