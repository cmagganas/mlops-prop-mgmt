"""Tests for the health check endpoint."""

from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test that the health check endpoint returns a 200 status code."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Property Management API is running" == data["message"]
