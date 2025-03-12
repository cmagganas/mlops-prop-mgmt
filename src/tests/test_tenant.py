"""Tests for the tenant endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_get_tenants(client: TestClient):
    """Test getting all tenants."""
    response = client.get("/tenants/")
    assert response.status_code == 200
    tenants = response.json()
    assert isinstance(tenants, list)
    # The in-memory repository should have sample data
    assert len(tenants) > 0


def test_get_tenant(client: TestClient):
    """Test getting a specific tenant."""
    # First get all tenants
    all_tenants = client.get("/tenants/").json()

    # Then get the first tenant by ID
    first_tenant = all_tenants[0]
    tenant_id = first_tenant["tenant_id"]

    response = client.get(f"/tenants/{tenant_id}")
    assert response.status_code == 200
    tenant_data = response.json()
    assert tenant_data["tenant_id"] == tenant_id
    assert tenant_data["name"] == first_tenant["name"]


def test_get_tenant_not_found(client: TestClient):
    """Test getting a non-existent tenant."""
    # Use a very large ID that shouldn't exist
    response = client.get("/tenants/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_tenants_by_unit(client: TestClient):
    """Test getting tenants filtered by unit ID."""
    # First get all tenants
    all_tenants = client.get("/tenants/").json()

    # Find a tenant with a unit ID
    tenants_with_unit = [t for t in all_tenants if t.get("unit_id") is not None]
    if not tenants_with_unit:
        pytest.skip("No tenants with unit_id found in sample data")

    unit_id = tenants_with_unit[0]["unit_id"]

    # Get tenants for that unit
    response = client.get(f"/tenants/?unit_id={unit_id}")
    assert response.status_code == 200
    filtered_tenants = response.json()
    assert isinstance(filtered_tenants, list)
    assert len(filtered_tenants) > 0

    # All tenants should belong to the specified unit
    for tenant in filtered_tenants:
        assert tenant["unit_id"] == unit_id


def test_get_tenants_by_status(client: TestClient):
    """Test getting tenants filtered by status."""
    # Get active tenants
    response = client.get("/tenants/?status=active")
    assert response.status_code == 200
    active_tenants = response.json()
    assert isinstance(active_tenants, list)

    # All tenants should have active status
    for tenant in active_tenants:
        assert tenant["status"] == "active"


def test_create_tenant(client: TestClient):
    """Test creating a new tenant."""
    # First get all units to find a valid unit_id
    all_units = client.get("/units/").json()
    if not all_units:
        pytest.skip("No units found in sample data")

    unit_id = all_units[0]["unit_id"]

    new_tenant = {
        "name": "Test Tenant",
        "email": "test.tenant@example.com",
        "phone": "555-123-4567",
        "unit_id": unit_id,
        "status": "active",
    }

    response = client.post("/tenants/", json=new_tenant)
    assert response.status_code == 200
    created_tenant = response.json()
    assert created_tenant["name"] == new_tenant["name"]
    assert created_tenant["email"] == new_tenant["email"]
    assert created_tenant["unit_id"] == unit_id
    assert "tenant_id" in created_tenant


def test_update_tenant(client: TestClient):
    """Test updating a tenant."""
    # First get all tenants
    all_tenants = client.get("/tenants/").json()

    # Then get the first tenant by ID
    first_tenant = all_tenants[0]
    tenant_id = first_tenant["tenant_id"]

    # Update the tenant
    updated_data = {
        "name": "Updated Tenant Name",
        "email": "updated.tenant@example.com",
        "phone": first_tenant.get("phone", "555-555-5555"),
        "unit_id": first_tenant.get("unit_id"),
        "status": first_tenant.get("status", "active"),
    }

    response = client.put(f"/tenants/{tenant_id}", json=updated_data)
    assert response.status_code == 200
    updated_tenant = response.json()
    assert updated_tenant["tenant_id"] == tenant_id
    assert updated_tenant["name"] == updated_data["name"]
    assert updated_tenant["email"] == updated_data["email"]


def test_delete_tenant(client: TestClient):
    """Test deleting a tenant."""
    # Create a new tenant to delete
    new_tenant = {
        "name": "Tenant to Delete",
        "email": "delete.me@example.com",
        "phone": "555-DELETE",
        "status": "active",
    }

    created = client.post("/tenants/", json=new_tenant).json()
    tenant_id = created["tenant_id"]

    # Then delete it
    response = client.delete(f"/tenants/{tenant_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify it's deleted
    get_response = client.get(f"/tenants/{tenant_id}")
    assert get_response.status_code == 404
