"""AWS Cognito Authentication Module.

This module provides services for AWS Cognito authentication,
including code exchange for JWT tokens and token validation.
"""

import base64
import time
from typing import (
    Any,
    Dict,
    Optional,
)

import httpx
from jose import (
    jwk,
    jwt,
)
from jose.utils import base64url_decode

from ..config import settings


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

    def get_login_url(self, state: Optional[str] = None) -> str:
        """Generate the Cognito hosted UI login URL.
        
        Args:
            state: Optional state parameter for OAuth flow
            
        Returns:
            The login URL string
        """
        cognito_login_url = (
            f"https://{self.settings.cognito_domain}/oauth2/authorize"
            f"?client_id={self.settings.cognito_client_id}"
            f"&response_type=code"
            f"&redirect_uri={self.settings.redirect_uri}"
            f"&scope={'+'.join(self.settings.cognito_scopes)}"
        )
        
        if state:
            cognito_login_url += f"&state={state}"
            
        return cognito_login_url

    async def exchange_code_for_tokens(self, auth_code: str) -> Dict[str, Any]:
        """Exchange authorization code for JWT tokens from Cognito.
        
        Args:
            auth_code: The authorization code from Cognito redirect
            
        Returns:
            Dictionary containing id_token, access_token, and refresh_token
            
        Raises:
            Exception: If token exchange fails
        """
        token_endpoint = f"https://{self.settings.cognito_domain}/oauth2/token"
        
        # Prepare headers and form data
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        # Include client_secret in the authorization header if present
        if self.settings.cognito_client_secret:
            auth_string = f"{self.settings.cognito_client_id}:{self.settings.cognito_client_secret}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            headers["Authorization"] = f"Basic {encoded_auth}"
        
        # Request body
        data = {
            "grant_type": "authorization_code",
            "client_id": self.settings.cognito_client_id,
            "code": auth_code,
            "redirect_uri": self.settings.redirect_uri
        }
        
        # If not using Authorization header, include client_secret in body if present
        if self.settings.cognito_client_secret and "Authorization" not in headers:
            data["client_secret"] = self.settings.cognito_client_secret
        
        # Make the request to Cognito
        async with httpx.AsyncClient() as client:
            response = await client.post(token_endpoint, headers=headers, data=data)
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")
            
            return response.json()

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
        jwks_uri = f"https://cognito-idp.{self.settings.cognito_region}.amazonaws.com/{self.settings.cognito_user_pool_id}/.well-known/jwks.json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_uri)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch JWKS: {response.text}")
            
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
            
            # Get the JWKS
            jwks = await self.get_jwks()
            
            # Find the key that matches the key ID in the token header
            key = None
            for k in jwks["keys"]:
                if k["kid"] == kid:
                    key = k
                    break
            
            if not key:
                raise Exception("Invalid token: Key not found")
            
            # Convert the key to the format expected by python-jose
            public_key = jwk.construct(key)
            
            # Verify token signature
            message, encoded_signature = token.rsplit('.', 1)
            decoded_signature = base64url_decode(encoded_signature.encode())
            
            if not public_key.verify(message.encode(), decoded_signature):
                raise Exception("Invalid token signature")
            
            # Decode and verify claims
            claims = jwt.get_unverified_claims(token)
            
            # Verify expiration time
            if time.time() > claims["exp"]:
                raise Exception("Token expired")
            
            # Verify audience (client ID)
            if claims.get("aud") != self.settings.cognito_client_id:
                raise Exception("Invalid audience")
            
            # Verify issuer
            expected_issuer = f"https://cognito-idp.{self.settings.cognito_region}.amazonaws.com/{self.settings.cognito_user_pool_id}"
            if claims.get("iss") != expected_issuer:
                raise Exception("Invalid issuer")
            
            return claims
        
        except (jwt.JWTError, Exception) as e:
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
