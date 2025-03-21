"""AWS Cognito Authentication Module.

This module provides services for AWS Cognito authentication,
including code exchange for JWT tokens and token validation.
"""

import os
import time
from typing import (
    Any,
    Dict,
)
from urllib.parse import quote

import httpx
from jose import (
    jwk,
    jwt,
)
from jose.utils import base64url_decode

from ..config import settings

# Check if running in Lambda
IS_LAMBDA = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None
# API Gateway stage name (typically 'prod' or 'dev')
API_STAGE = os.environ.get("API_GATEWAY_STAGE", "prod")

class CognitoAuth:
    """Handles AWS Cognito authentication operations."""

    def __init__(self, settings_obj=None):
        """Initialize with application settings.

        Args:
            settings_obj: The application settings object. If None, uses global settings.
        """
        self.settings = settings_obj or settings
        # Cache for JWKS
        self._jwks_cache = None
        self._jwks_cache_timestamp = 0
        self._JWKS_CACHE_TTL = 3600  # 1 hour

    def get_login_url(self) -> str:
        """Generate the Cognito login URL."""
        # URL encode each scope individually and join with spaces
        encoded_scopes = " ".join(quote(scope) for scope in self.settings.cognito_scopes_list)

        # Ensure the redirect URI is correctly formatted with API Gateway stage
        redirect_uri = self.settings.redirect_uri
        print(f"Original redirect URI: {redirect_uri}")
        
        # If we're in Lambda and the redirect URI doesn't include the stage, add it
        if IS_LAMBDA and API_STAGE not in redirect_uri:
            # Check if the URI contains /auth/callback
            if "/auth/callback" in redirect_uri:
                # Replace /auth/callback with /{stage}/auth/callback
                redirect_uri = redirect_uri.replace("/auth/callback", f"/{API_STAGE}/auth/callback")
                print(f"Modified redirect URI with stage: {redirect_uri}")
                
        quoted_redirect = quote(redirect_uri)
        print(f"Encoded redirect URI: {quoted_redirect}")

        auth_url = (
            f"{self.settings.cognito_auth_endpoint}"
            f"?client_id={self.settings.cognito_client_id}"
            f"&response_type=code"
            f"&redirect_uri={quoted_redirect}"
            f"&scope={encoded_scopes}"
        )
        
        print(f"Generated Cognito login URL: {auth_url}")
        return auth_url

    async def exchange_code_for_tokens(self, auth_code: str) -> Dict[str, Any]:
        """Exchange authorization code for JWT tokens from Cognito."""
        token_endpoint = self.settings.cognito_token_endpoint

        # Headers
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }

        # Ensure the redirect URI is correctly formatted with API Gateway stage
        redirect_uri = self.settings.redirect_uri
        if IS_LAMBDA and API_STAGE not in redirect_uri and "/auth/callback" in redirect_uri:
            redirect_uri = redirect_uri.replace("/auth/callback", f"/{API_STAGE}/auth/callback")

        # Request body
        data = {
            "grant_type": "authorization_code",
            "client_id": self.settings.cognito_client_id,
            "code": auth_code,
            "redirect_uri": redirect_uri,
        }

        # Add client_secret to the request if it's configured
        if self.settings.cognito_client_secret:
            data["client_secret"] = self.settings.cognito_client_secret
            print(f"Using client secret from settings (prefix: {self.settings.cognito_client_secret[:5]}...)")
        else:
            print("No client secret found in settings")

        print(f"Token exchange request to: {token_endpoint}")
        # Don't log the full data as it contains sensitive information
        print(f"Request data keys: {list(data.keys())}")

        # Make the request to Cognito
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(token_endpoint, headers=headers, data=data)
                print(f"Token exchange response status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"Token exchange failed with error: {response.text}")
                    raise Exception(f"Token exchange failed: {response.text}")
                else:
                    print("Token exchange successful")
                    
                return response.json()
            except Exception as e:
                print(f"Token exchange exception: {str(e)}")
                raise

    async def get_jwks(self) -> Dict:
        """Fetch JWKS (JSON Web Key Set) from Cognito and cache it.

        Returns:
            Dictionary containing the JWKS keys

        Raises:
            Exception: If JWKS fetch fails
        """
        current_time = time.time()

        # Return cached JWKS if still valid
        if self._jwks_cache and (current_time - self._jwks_cache_timestamp) < self._JWKS_CACHE_TTL:
            return self._jwks_cache

        # Fetch new JWKS
        jwks_uri = self.settings.cognito_jwks_uri
        print(f"Fetching JWKS from: {jwks_uri}")

        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_uri)

            if response.status_code != 200:
                print(f"JWKS fetch failed: {response.text}")
                raise Exception(f"Failed to fetch JWKS: {response.text}")

            print("JWKS fetch successful")
            self._jwks_cache = response.json()
            self._jwks_cache_timestamp = current_time

            return self._jwks_cache

    async def validate_token(self, token: str) -> Dict:
        """Validate the JWT token and return its claims if valid.

        Args:
            token: The JWT token to validate

        Returns:
            Dictionary containing the token claims

        Raises:
            jwt.JWTError: If token validation fails
            Exception: For other validation errors
        """
        try:
            # Get the header from the token
            header = jwt.get_unverified_header(token)

            # Get the key ID from the header
            kid = header["kid"]
            print(f"Validating token with key ID: {kid}")

            # Get the JWKS
            jwks = await self.get_jwks()

            # Find the key that matches the key ID in the token header
            key = None
            for k in jwks["keys"]:
                if k["kid"] == kid:
                    key = k
                    break

            if not key:
                print(f"Key not found in JWKS for kid: {kid}")
                raise Exception("Invalid token: Key not found")

            # Convert the key to the format expected by python-jose
            public_key = jwk.construct(key)

            # Verify token signature
            message, encoded_signature = token.rsplit(".", 1)
            decoded_signature = base64url_decode(encoded_signature.encode())

            if not public_key.verify(message.encode(), decoded_signature):
                print("Token signature verification failed")
                raise Exception("Invalid token signature")

            # Decode and verify claims
            claims = jwt.get_unverified_claims(token)

            # Verify expiration time
            if time.time() > claims["exp"]:
                print(f"Token expired at: {claims['exp']}")
                raise Exception("Token expired")

            # Verify audience (client ID)
            if claims.get("aud") != self.settings.cognito_client_id:
                print(f"Invalid audience: {claims.get('aud')} != {self.settings.cognito_client_id}")
                raise Exception("Invalid audience")

            # Verify issuer
            expected_issuer = f"https://cognito-idp.{self.settings.cognito_region}.amazonaws.com/{self.settings.cognito_user_pool_id}"
            if claims.get("iss") != expected_issuer:
                print(f"Invalid issuer: {claims.get('iss')} != {expected_issuer}")
                raise Exception("Invalid issuer")

            print("Token validation successful")
            return claims

        except (jwt.JWTError, Exception) as e:
            print(f"Token validation failed: {str(e)}")
            raise Exception(f"Invalid token: {str(e)}")


# Convenience function to create an auth instance
def get_cognito_auth():
    """Create and return a new CognitoAuth instance.

    Returns:
        CognitoAuth instance initialized with application settings
    """
    return CognitoAuth(settings)


async def exchange_code_for_tokens(auth_code: str) -> Dict[str, Any]:
    """Convenience function to exchange authorization code for tokens.

    Args:
        auth_code: The authorization code from Cognito redirect

    Returns:
        Dictionary containing id_token, access_token, and refresh_token
    """
    auth = get_cognito_auth()
    return await auth.exchange_code_for_tokens(auth_code)
