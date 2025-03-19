"""OAuth integration for AWS Cognito using Authlib.

This module provides FastAPI integration with Authlib for AWS Cognito authentication.
"""

from typing import (
    Dict,
    Optional,
)

from authlib.integrations.httpx_client import AsyncOAuth2Client
from fastapi import Request

from ..config import settings


class OAuth2ClientSingleton:
    """Singleton class for OAuth2 client to ensure only one instance is created."""

    _instance = None

    @classmethod
    def get_instance(cls) -> AsyncOAuth2Client:
        """Get or create the OAuth2 client instance."""
        if cls._instance is None:
            cls._instance = AsyncOAuth2Client(
                client_id=settings.cognito_client_id,
                client_secret=settings.cognito_client_secret,
                scope=settings.cognito_scopes,
                redirect_uri=settings.redirect_uri,
            )
        return cls._instance


async def get_oauth_client() -> AsyncOAuth2Client:
    """Get the OAuth2 client.

    Returns:
        AsyncOAuth2Client: Configured OAuth client
    """
    return OAuth2ClientSingleton.get_instance()


async def get_authorization_url() -> str:
    """Generate the authorization URL for Cognito.

    Returns:
        str: The authorization URL to redirect users
    """
    await get_oauth_client()

    # Build the authorization URL with the auth endpoint
    auth_url = f"{settings.cognito_auth_endpoint}?response_type=code"
    return auth_url


async def fetch_token(code: str, request: Request) -> Dict:
    """Exchange authorization code for tokens.

    Args:
        code: The authorization code from Cognito redirect
        request: The FastAPI request

    Returns:
        Dict: The token response from Cognito
    """
    client = await get_oauth_client()
    token = await client.fetch_token(
        url=settings.cognito_token_endpoint,
        code=code,
        # Additional parameters needed for Cognito
        grant_type="authorization_code",
    )
    return token


async def get_userinfo(token: Optional[Dict] = None, access_token: Optional[str] = None) -> Dict:
    """Fetch user information from Cognito using the userinfo endpoint.

    Args:
        token: The full token response (containing access_token)
        access_token: The access token directly, if token is not provided

    Returns:
        Dict: User information from Cognito
    """
    client = await get_oauth_client()

    if token:
        client.token = token
    elif access_token:
        client.token = {"access_token": access_token}
    else:
        raise ValueError("Either token or access_token must be provided")

    # Standard OpenID Connect userinfo endpoint
    userinfo_endpoint = f"{settings.cognito_domain_url}/oauth2/userInfo"
    resp = await client.get(userinfo_endpoint)
    resp.raise_for_status()
    return resp.json()
