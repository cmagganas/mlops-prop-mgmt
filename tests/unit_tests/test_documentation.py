"""Tests for documentation endpoints."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from mlopspropmgmt.main import app


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the application."""
    return TestClient(app)


def test_openapi_endpoint(client: TestClient) -> None:
    """Test that the OpenAPI documentation endpoint is accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    openapi_schema = response.json()

    # Verify basic OpenAPI schema structure
    assert "openapi" in openapi_schema
    assert "info" in openapi_schema
    assert "paths" in openapi_schema
    assert "components" in openapi_schema


def test_docs_endpoint(client: TestClient) -> None:
    """Test that the Swagger UI documentation endpoint is accessible."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "swagger-ui" in response.text.lower()


def test_redoc_endpoint(client: TestClient) -> None:
    """Test that the ReDoc documentation endpoint is accessible."""
    response = client.get("/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "redoc" in response.text.lower()


def test_documentation_files_exist() -> None:
    """Test that documentation files exist in the correct locations."""
    # Define base docs directory
    base_docs_dir = Path("src/mlopspropmgmt/docs")

    # List of expected documentation files
    expected_files = [
        "api_documentation.md",
        "implementation_guide.md",
        "index.md",
        "README.md",
        "assets/architecture.md",
    ]

    # Check each file exists
    for file_path in expected_files:
        full_path = base_docs_dir / file_path
        assert full_path.exists(), f"Documentation file {file_path} does not exist"
        assert full_path.stat().st_size > 0, f"Documentation file {file_path} is empty"
