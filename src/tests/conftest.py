"""Test configuration for the application."""

import pytest
from fastapi.testclient import TestClient

from mlopspropmgmt.main import create_app


@pytest.fixture
def app():
    """Create a FastAPI application for testing."""
    return create_app()


@pytest.fixture
def client(app):
    """Create a test client for the application."""
    return TestClient(app)
