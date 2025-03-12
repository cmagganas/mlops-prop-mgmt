"""Tests for AWS Cognito integration."""

import os
from unittest.mock import patch

import boto3
import pytest
from moto import mock_aws

from mlopspropmgmt.auth.cognito import CognitoAuth
from mlopspropmgmt.config import get_settings


@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for boto3."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

    # These settings need to match what's in .env.test
    os.environ["PROPMGMT_AWS_REGION"] = "us-east-1"
    os.environ["PROPMGMT_COGNITO_USER_POOL_ID"] = "us-east-1_testing"
    os.environ["PROPMGMT_COGNITO_CLIENT_ID"] = "testing"
    os.environ["PROPMGMT_COGNITO_CLIENT_SECRET"] = "testing"
    os.environ["PROPMGMT_COGNITO_DOMAIN_PREFIX"] = "testing"


@pytest.fixture
def cognito_client(aws_credentials):
    """Create a mocked Cognito client."""
    with mock_aws():
        client = boto3.client("cognito-idp", region_name="us-east-1")
        yield client


@pytest.fixture
def s3_bucket(aws_credentials):
    """Create a mocked S3 bucket."""
    with mock_aws():
        s3 = boto3.resource("s3", region_name="us-east-1")
        # Create the test bucket
        bucket = s3.create_bucket(Bucket="test-bucket")
        yield bucket


@pytest.mark.aws
def test_cognito_setup(cognito_client):
    """Test creating a Cognito user pool."""
    # Create a user pool
    user_pool = cognito_client.create_user_pool(
        PoolName="test-user-pool",
        Policies={
            "PasswordPolicy": {
                "MinimumLength": 8,
                "RequireUppercase": True,
                "RequireLowercase": True,
                "RequireNumbers": True,
                "RequireSymbols": False,
            }
        },
    )

    user_pool_id = user_pool["UserPool"]["Id"]

    # Create a client app
    client = cognito_client.create_user_pool_client(
        UserPoolId=user_pool_id,
        ClientName="test-client",
        GenerateSecret=True,
        AllowedOAuthFlows=["code"],
        AllowedOAuthScopes=["email", "openid"],
        CallbackURLs=["http://localhost:8000/api/v1/auth/callback"],
        LogoutURLs=["http://localhost:8000/api/v1/auth/logout"],
    )

    client_id = client["UserPoolClient"]["ClientId"]

    # Test that the user pool and client were created
    response = cognito_client.describe_user_pool(UserPoolId=user_pool_id)
    assert response["UserPool"]["Id"] == user_pool_id

    response = cognito_client.describe_user_pool_client(UserPoolId=user_pool_id, ClientId=client_id)
    assert response["UserPoolClient"]["ClientId"] == client_id


@pytest.mark.aws
def test_cognito_auth_login_url():
    """Test generating a login URL with the CognitoAuth class."""
    settings = get_settings()

    # Patch the settings to use test values
    with patch.object(settings, "cognito_user_pool_id", "us-east-1_testing"), patch.object(
        settings, "cognito_client_id", "test-client-id"
    ), patch.object(settings, "cognito_domain_prefix", "test-domain"):

        auth = CognitoAuth(settings)
        login_url = auth.get_login_url()

        # Verify the login URL has the correct structure
        assert "https://test-domain.auth.us-east-1.amazoncognito.com/login" in login_url
        assert "client_id=test-client-id" in login_url
        assert "response_type=code" in login_url
        assert settings.callback_url in login_url


@pytest.mark.aws
def test_cognito_token_validation(aws_credentials):
    """Test token validation functionality."""
    with mock_aws():
        # Mock JWT functions since Moto doesn't handle JWT validation
        with patch("jwt.decode") as mock_decode, patch("jwt.get_unverified_header") as mock_get_header, patch(
            "mlopspropmgmt.auth.cognito.CognitoAuth.get_jwks"
        ) as mock_get_jwks:

            # Setup mocks
            mock_get_header.return_value = {"kid": "test-kid"}
            mock_get_jwks.return_value = {
                "keys": [{"kid": "test-kid", "kty": "RSA", "use": "sig", "n": "test-n", "e": "test-e"}]
            }
            mock_decode.return_value = {
                "sub": "test-user-id",
                "email": "test@example.com",
                "name": "Test User",
                "cognito:groups": ["Users"],
            }

            # Test the token validation
            settings = get_settings()
            auth = CognitoAuth(settings)
            result = auth.validate_token("test-token")

            # Verify the result
            assert result["sub"] == "test-user-id"
            assert result["email"] == "test@example.com"
            assert result["cognito:groups"] == ["Users"]


@pytest.mark.aws
def test_s3_file_upload(s3_bucket):
    """Test uploading a file to S3."""
    # Create a test file
    test_content = b"test file content"
    s3_bucket.put_object(Key="test-file.txt", Body=test_content)

    # Verify the file was uploaded
    obj = s3_bucket.Object("test-file.txt").get()
    assert obj["Body"].read() == test_content
