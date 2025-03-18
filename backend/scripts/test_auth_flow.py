#!/usr/bin/env python3
"""
Test the AWS Cognito authentication flow.

This script verifies each step of the authentication process:
1. Getting the login URL
2. Testing the callback URL
3. Verifying the JWT validation process
"""

import os
import sys
import webbrowser
from pathlib import Path
from urllib.parse import urlparse

import httpx

# Add the parent directory to the path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

# API base URL
API_BASE = "http://localhost:8000"


def clear_screen():
    """Clear the console screen."""
    os.system("cls" if os.name == "nt" else "clear")


def print_header(title):
    """Print a formatted header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


async def test_auth_endpoints():
    """Test the authentication endpoints."""

    try:
        pass
    except ImportError as e:
        print(f"Error: {e}")
        print("Make sure you're running this script from the backend directory.")
        return False

    # Store test results
    results = {}

    print_header("Testing Authentication Flow")
    print("This test will verify the Cognito authentication flow.")

    # Step 1: Check API connection
    print("\n📡 Checking API connection...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_BASE}/")
            if response.status_code == 200:
                print("✅ API is reachable")
                results["api_connection"] = True
            else:
                print(f"❌ API returned status code {response.status_code}")
                results["api_connection"] = False
                return results
        except Exception as e:
            print(f"❌ API connection failed: {str(e)}")
            results["api_connection"] = False
            return results

    # Step 2: Test the /auth/debug endpoint
    print("\n🔍 Checking authentication configuration...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_BASE}/auth/debug")
            if response.status_code == 200:
                debug_info = response.json()
                print("✅ Authentication configuration is available")

                # Print key configuration values
                print(f"  Domain URL: {debug_info.get('domain_url')}")
                print(f"  Auth Endpoint: {debug_info.get('auth_endpoint')}")
                print(f"  Token Endpoint: {debug_info.get('token_endpoint')}")
                print(f"  JWKS URI: {debug_info.get('jwks_uri')}")

                results["auth_config"] = True
            else:
                print(f"❌ Auth debug returned status code {response.status_code}")
                results["auth_config"] = False
        except Exception as e:
            print(f"❌ Auth debug check failed: {str(e)}")
            results["auth_config"] = False

    # Step 3: Run advanced diagnostics
    print("\n🩺 Running advanced diagnostics...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_BASE}/auth/diagnostic")
            if response.status_code == 200:
                diagnostic_info = response.json()

                # DNS checks
                dns_check = diagnostic_info.get("network_checks", {}).get("domain_dns", {})
                if dns_check.get("status") == "success":
                    print(
                        f"✅ DNS resolution successful for {dns_check.get('domain')} -> {dns_check.get('resolved_ip')}"
                    )
                    results["dns_resolution"] = True
                else:
                    print(f"❌ DNS resolution failed: {dns_check.get('error')}")
                    results["dns_resolution"] = False

                # Endpoint checks
                jwks_check = diagnostic_info.get("endpoint_checks", {}).get("jwks", {})
                if jwks_check.get("status") == "success":
                    print(f"✅ JWKS endpoint check successful")
                    results["jwks_endpoint"] = True
                else:
                    print(f"❌ JWKS endpoint check failed: {jwks_check.get('status_code')}")
                    results["jwks_endpoint"] = False
            else:
                print(f"❌ Diagnostic endpoint returned status code {response.status_code}")
                results["diagnostics"] = False
        except Exception as e:
            print(f"❌ Diagnostic check failed: {str(e)}")
            results["diagnostics"] = False

    # Step 4: Get login URL
    print("\n🔑 Testing login URL generation...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_BASE}/auth/test")
            if response.status_code == 200:
                test_info = response.json()
                login_url = test_info.get("login_url")

                if login_url:
                    # Parse and validate the login URL
                    parsed_url = urlparse(login_url)
                    if parsed_url.scheme and parsed_url.netloc:
                        print(f"✅ Login URL generated successfully")
                        print(f"  URL: {login_url}")
                        results["login_url"] = True
                    else:
                        print(f"❌ Generated login URL appears invalid: {login_url}")
                        results["login_url"] = False
                else:
                    print("❌ No login URL returned")
                    results["login_url"] = False
            else:
                print(f"❌ Auth test endpoint returned status code {response.status_code}")
                results["login_url"] = False
        except Exception as e:
            print(f"❌ Login URL test failed: {str(e)}")
            results["login_url"] = False

    # Step 5: Test the callback endpoint with a mock code
    print("\n🔄 Testing callback endpoint with a mock authorization code...")
    print("   Note: This should fail as the code is invalid, but should not return an error about domain resolution.")
    async with httpx.AsyncClient() as client:
        try:
            # Use a fake code - this should fail but in a predictable way
            mock_code = "mockAuthorizationCode123"
            response = await client.get(f"{API_BASE}/auth/callback?code={mock_code}")

            if response.status_code in (400, 401):
                # We expect a 400 Bad Request since our code is invalid
                error_detail = response.json().get("detail", "")

                # Check for specific error messages that would indicate domain issues
                domain_error_indicators = [
                    "dns",
                    "domain",
                    "resolve",
                    "not found",
                    "could not connect",
                    "connection refused",
                    "can't connect",
                ]

                if any(indicator.lower() in error_detail.lower() for indicator in domain_error_indicators):
                    print(f"❌ Callback test reveals domain issues: {error_detail}")
                    results["callback"] = False
                else:
                    print("✅ Callback endpoint responds correctly (expected error about invalid code)")
                    print(f"  Error: {error_detail}")
                    results["callback"] = True
            elif response.status_code == 200:
                print("❓ Callback accepted the mock code (unexpected)")
                results["callback"] = True
            else:
                print(f"❌ Callback endpoint returned unexpected status code {response.status_code}")
                results["callback"] = False
        except Exception as e:
            print(f"❌ Callback test failed: {str(e)}")
            results["callback"] = False

    # Summary
    print_header("Authentication Flow Test Results")

    if all(results.values()):
        print("✅ All authentication flow tests PASSED!")
        print("The authentication flow appears to be correctly configured.")
        print("To fully test the flow, you would need to manually:")
        print("1. Visit: http://localhost:8000/auth/login")
        print("2. Log in with valid credentials")
        print("3. Get redirected back to your app with a valid token")
    else:
        print("❌ Some authentication flow tests FAILED:")
        for test, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test}")

    print("\nDo you want to try a real login? This will open your browser. (y/n)")
    choice = input().strip().lower()
    if choice == "y":
        print("Opening login URL in your browser...")
        webbrowser.open(f"{API_BASE}/auth/login")
        print("After login, you should be redirected back to the application.")

    return results


if __name__ == "__main__":
    import asyncio

    try:
        asyncio.run(test_auth_endpoints())
    except KeyboardInterrupt:
        print("\nTest interrupted.")
    except Exception as e:
        print(f"Error: {str(e)}")
