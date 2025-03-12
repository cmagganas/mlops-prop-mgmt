"""Tests for the lease endpoints."""

from datetime import (
    date,
    timedelta,
)

import pytest
from fastapi.testclient import TestClient


def test_get_leases(client: TestClient):
    """Test getting all leases."""
    response = client.get("/leases/")
    assert response.status_code == 200
    leases = response.json()
    assert isinstance(leases, list)
    # The in-memory repository should have sample data
    assert len(leases) > 0


def test_get_lease(client: TestClient):
    """Test getting a specific lease."""
    # First get all leases
    all_leases = client.get("/leases/").json()

    # Then get the first lease by ID
    first_lease = all_leases[0]
    lease_id = first_lease["lease_id"]

    response = client.get(f"/leases/{lease_id}")
    assert response.status_code == 200
    lease_data = response.json()
    assert lease_data["lease_id"] == lease_id
    assert lease_data["rent_amount"] == first_lease["rent_amount"]
    assert lease_data["unit_id"] == first_lease["unit_id"]


def test_get_lease_not_found(client: TestClient):
    """Test getting a non-existent lease."""
    # Use a very large ID that shouldn't exist
    response = client.get("/leases/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_leases_by_property(client: TestClient):
    """Test getting leases filtered by property ID."""
    # First get all leases
    all_leases = client.get("/leases/").json()

    # Get a property ID from the first lease
    property_id = all_leases[0]["property_id"]

    # Get leases for that property
    response = client.get(f"/leases/?property_id={property_id}")
    assert response.status_code == 200
    filtered_leases = response.json()
    assert isinstance(filtered_leases, list)
    assert len(filtered_leases) > 0

    # All leases should belong to the specified property
    for lease in filtered_leases:
        assert lease["property_id"] == property_id


def test_get_leases_by_unit(client: TestClient):
    """Test getting leases filtered by unit ID."""
    # First get all leases
    all_leases = client.get("/leases/").json()

    # Get a unit ID from the first lease
    unit_id = all_leases[0]["unit_id"]

    # Get leases for that unit
    response = client.get(f"/leases/?unit_id={unit_id}")
    assert response.status_code == 200
    filtered_leases = response.json()
    assert isinstance(filtered_leases, list)
    assert len(filtered_leases) > 0

    # All leases should belong to the specified unit
    for lease in filtered_leases:
        assert lease["unit_id"] == unit_id


def test_get_leases_by_tenant(client: TestClient):
    """Test getting leases filtered by tenant ID."""
    # First get all leases
    all_leases = client.get("/leases/").json()

    # Get tenant IDs from the first lease
    if not all_leases[0].get("tenant_ids"):
        pytest.skip("No tenant_ids found in sample lease data")

    tenant_id = all_leases[0]["tenant_ids"][0]

    # Get leases for that tenant
    response = client.get(f"/leases/?tenant_id={tenant_id}")
    assert response.status_code == 200
    filtered_leases = response.json()
    assert isinstance(filtered_leases, list)
    assert len(filtered_leases) > 0

    # All leases should include the specified tenant
    for lease in filtered_leases:
        assert tenant_id in lease["tenant_ids"]


def test_get_leases_by_status(client: TestClient):
    """Test getting leases filtered by status."""
    # Get active leases
    response = client.get("/leases/?status=active")
    assert response.status_code == 200
    active_leases = response.json()
    assert isinstance(active_leases, list)

    # All leases should have active status
    for lease in active_leases:
        assert lease["status"] == "active"


def test_create_lease(client: TestClient):
    """Test creating a new lease."""
    # First get valid property, unit, and tenant IDs
    all_properties = client.get("/properties/").json()
    if not all_properties:
        pytest.skip("No properties found in sample data")

    property_id = all_properties[0]["id"]

    all_units = client.get(f"/units/?property_id={property_id}").json()
    if not all_units:
        pytest.skip("No units found for the property")

    unit_id = all_units[0]["unit_id"]

    all_tenants = client.get("/tenants/").json()
    if not all_tenants:
        pytest.skip("No tenants found in sample data")

    tenant_ids = [all_tenants[0]["tenant_id"]]

    # Create a new lease
    today = date.today()
    new_lease = {
        "property_id": property_id,
        "unit_id": unit_id,
        "rent_amount": 1200.00,
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=365)).isoformat(),
        "status": "active",
        "tenant_ids": tenant_ids,
    }

    response = client.post("/leases/", json=new_lease)
    assert response.status_code == 200
    created_lease = response.json()
    assert created_lease["property_id"] == property_id
    assert created_lease["unit_id"] == unit_id
    assert created_lease["rent_amount"] == new_lease["rent_amount"]
    assert "lease_id" in created_lease
    assert tenant_ids[0] in created_lease["tenant_ids"]


def test_update_lease(client: TestClient):
    """Test updating a lease."""
    # First get all leases
    all_leases = client.get("/leases/").json()

    # Then get the first lease by ID
    first_lease = all_leases[0]
    lease_id = first_lease["lease_id"]
    property_id = first_lease["property_id"]
    unit_id = first_lease["unit_id"]
    tenant_ids = first_lease.get("tenant_ids", [])

    if not tenant_ids:
        # Get some tenant IDs to use
        all_tenants = client.get("/tenants/").json()
        if all_tenants:
            tenant_ids = [all_tenants[0]["tenant_id"]]

    # Update the lease
    updated_data = {
        "property_id": property_id,
        "unit_id": unit_id,
        "rent_amount": 1500.00,  # Updated rent amount
        "start_date": first_lease["start_date"],
        "end_date": first_lease["end_date"],
        "status": first_lease["status"],
        "tenant_ids": tenant_ids,
    }

    response = client.put(f"/leases/{lease_id}", json=updated_data)
    assert response.status_code == 200
    updated_lease = response.json()
    assert updated_lease["lease_id"] == lease_id
    assert updated_lease["rent_amount"] == updated_data["rent_amount"]


def test_delete_lease(client: TestClient):
    """Test deleting a lease."""
    # First get valid property, unit, and tenant IDs to create a new lease
    all_properties = client.get("/properties/").json()
    if not all_properties:
        pytest.skip("No properties found in sample data")

    property_id = all_properties[0]["id"]

    all_units = client.get(f"/units/?property_id={property_id}").json()
    if not all_units:
        pytest.skip("No units found for the property")

    unit_id = all_units[0]["unit_id"]

    all_tenants = client.get("/tenants/").json()
    if not all_tenants:
        pytest.skip("No tenants found in sample data")

    tenant_ids = [all_tenants[0]["tenant_id"]]

    # Create a new lease to delete
    today = date.today()
    new_lease = {
        "property_id": property_id,
        "unit_id": unit_id,
        "rent_amount": 1200.00,
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=365)).isoformat(),
        "status": "active",
        "tenant_ids": tenant_ids,
    }

    created = client.post("/leases/", json=new_lease).json()
    lease_id = created["lease_id"]

    # Then delete it
    response = client.delete(f"/leases/{lease_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify it's deleted
    get_response = client.get(f"/leases/{lease_id}")
    assert get_response.status_code == 404
