#!/usr/bin/env python
"""Script to validate Cognito configuration settings."""
import json
import sys
from pathlib import Path

# Dynamically add the correct API path to sys.path
# This is necessary to import the config module
script_dir = Path(__file__).parent.parent
backend_src_dir = script_dir.parent / "backend" / "src"
sys.path.append(str(backend_src_dir))

# pylint: disable=wrong-import-position
from api.config import settings
# pylint: enable=wrong-import-position


def main() -> None:
    """Display Cognito configuration settings for debugging."""
    print("Checking Cognito configuration settings:")
    print(f"  Region: {settings.cognito_region}")
    print(f"  User Pool ID: {settings.cognito_user_pool_id}")
    print(f"  Client ID: {settings.cognito_client_id}")
    print(f"  Client Secret: {'*' * 8 if settings.cognito_client_secret else 'Not set'}")
    print(f"  Redirect URI: {settings.redirect_uri}")
    
    # Print settings as JSON for debugging
    config_json = {
        "cognito_region": settings.cognito_region,
        "cognito_user_pool_id": settings.cognito_user_pool_id,
        "cognito_client_id": settings.cognito_client_id,
        "redirect_uri": settings.redirect_uri,
        "debug": settings.debug,
    }
    
    print("\nConfig as JSON:")
    print(json.dumps(config_json, indent=2))


if __name__ == "__main__":
    main()
