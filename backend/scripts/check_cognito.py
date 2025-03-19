#!/usr/bin/env python3
"""
Simple diagnostic script to verify Cognito URL construction
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path to find the app module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Now import the settings
from app.config import settings


def main():
    """Display generated Cognito URLs for debugging."""
    print("Cognito Configuration:")
    print(f"  Region: {settings.cognito_region}")
    print(f"  User Pool ID: {settings.cognito_user_pool_id}")
    print(f"  Client ID: {settings.cognito_client_id}")
    print(f"  Domain: {settings.cognito_domain}")
    print(f"  Scopes: {settings.cognito_scopes_list}")

    print("\nGenerated URLs:")
    print(f"  Domain URL: {settings.cognito_domain_url}")
    print(f"  Auth Endpoint: {settings.cognito_auth_endpoint}")
    print(f"  Token Endpoint: {settings.cognito_token_endpoint}")
    print(f"  JWKS URI: {settings.cognito_jwks_uri}")

    return 0


if __name__ == "__main__":
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    print(f"Looking for .env file at: {env_file}")
    if os.path.exists(env_file):
        print(f".env file found at {env_file}")
    else:
        print(f"WARNING: .env file not found at {env_file}")

    sys.exit(main())
