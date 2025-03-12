from typing import (
    Dict,
    Optional,
)

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
)
from fastapi.responses import RedirectResponse

from ..auth.cognito import (
    exchange_code_for_tokens,
    get_cognito_auth,
)
from ..auth.jwt import (
    get_current_user,
    verify_jwt_token,
)
from ..config import settings

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)

@router.get("/login")
async def login():
    """Redirect to Cognito hosted UI for login"""
    cognito_login_url = (
        f"https://{settings.cognito_domain}/oauth2/authorize"
        f"?client_id={settings.cognito_client_id}"
        f"&response_type=code"
        f"&redirect_uri={settings.redirect_uri}"
        f"&scope={'+'.join(settings.cognito_scopes_list)}"
    )
    return RedirectResponse(url=cognito_login_url)

@router.get("/callback")
async def callback(code: str):
    """Handle the OAuth callback from Cognito"""
    try:
        # Exchange authorization code for tokens
        tokens = await exchange_code_for_tokens(code)
        
        # Set tokens in httpOnly cookies
        response = RedirectResponse(url=settings.frontend_url)
        response.set_cookie(
            key="id_token",
            value=tokens["id_token"],
            httponly=True,
            secure=settings.cookie_secure,
            samesite="lax"
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing callback: {str(e)}")

@router.get("/logout")
async def logout():
    """Log the user out by clearing cookies and redirecting to Cognito logout"""
    cognito_logout_url = (
        f"https://{settings.cognito_domain}/logout"
        f"?client_id={settings.cognito_client_id}"
        f"&logout_uri={settings.frontend_url}"
    )
    response = RedirectResponse(url=cognito_logout_url)
    response.delete_cookie(key="id_token")
    return response

@router.get("/user")
async def get_user_info(user: Dict = Depends(get_current_user)):
    """Get information about the authenticated user"""
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "username": user.get("username"),
        "name": user.get("name"),
        "groups": user.get("groups", [])
    }

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
            "configured_settings": {k: v for k, v in cognito_settings.items() if v}
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
            "2. After login, visit /auth/user to see your user information"
        ]
    }
