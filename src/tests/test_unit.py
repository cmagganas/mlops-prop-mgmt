"""Tests for the unit endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_get_units(client: TestClient):
    """Test getting all units."""
    response = client.get("/units/")
    assert response.status_code == 200
    units = response.json()
    assert isinstance(units, list)
    # The in-memory repository should have sample data
    assert len(units) > 0


def test_get_unit(client: TestClient):
    """Test getting a specific unit."""
    # First get all units
    all_units = client.get("/units/").json()

    # Then get the first unit by ID
    first_unit = all_units[0]
    unit_id = first_unit["unit_id"]

    response = client.get(f"/units/{unit_id}")
    assert response.status_code == 200
    unit_data = response.json()
    assert unit_data["unit_id"] == unit_id
    assert unit_data["unit_name"] == first_unit["unit_name"]


def test_get_unit_not_found(client: TestClient):
    """Test getting a non-existent unit."""
    # Use a very large ID that shouldn't exist
    response = client.get("/units/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_units_by_property(client: TestClient):
    """Test getting units filtered by property ID."""
    # First get all units
    all_units = client.get("/units/").json()

    # Get a property ID from the first unit
    property_id = all_units[0]["property_id"]

    # Get units for that property
    response = client.get(f"/units/?property_id={property_id}")
    assert response.status_code == 200
    filtered_units = response.json()
    assert isinstance(filtered_units, list)
    assert len(filtered_units) > 0

    # All units should belong to the specified property
    for unit in filtered_units:
        assert unit["property_id"] == property_id


def test_create_unit(client: TestClient):
    """Test creating a new unit."""
    # First get all properties to find a valid property_id
    all_properties = client.get("/properties/").json()
    property_id = all_properties[0]["id"]

    new_unit = {
        "unit_name": "Test Unit",
        "property_id": property_id,
        "description": "Test unit description",
        "rent": 1000.0,
    }

    response = client.post("/units/", json=new_unit)
    assert response.status_code == 200
    created_unit = response.json()
    assert created_unit["unit_name"] == new_unit["unit_name"]
    assert created_unit["property_id"] == property_id
    assert "unit_id" in created_unit


def test_update_unit(client: TestClient):
    """Test updating a unit."""
    # First get all units
    all_units = client.get("/units/").json()

    # Then get the first unit by ID
    first_unit = all_units[0]
    unit_id = first_unit["unit_id"]
    property_id = first_unit["property_id"]

    # Update the unit
    updated_data = {
        "unit_name": "Updated Unit Name",
        "property_id": property_id,
        "description": first_unit.get("description", ""),
        "rent": first_unit.get("rent", 1000.0),
    }

    response = client.put(f"/units/{unit_id}", json=updated_data)
    assert response.status_code == 200
    updated_unit = response.json()
    assert updated_unit["unit_id"] == unit_id
    assert updated_unit["unit_name"] == updated_data["unit_name"]


def test_delete_unit(client: TestClient):
    """Test deleting a unit."""
    # First get all properties to find a valid property_id for creating a new unit
    all_properties = client.get("/properties/").json()
    property_id = all_properties[0]["id"]

    # Create a new unit to delete
    new_unit = {
        "unit_name": "Unit to Delete",
        "property_id": property_id,
        "description": "This unit will be deleted",
        "rent": 1000.0,
    }

    created = client.post("/units/", json=new_unit).json()
    unit_id = created["unit_id"]

    # Then delete it
    response = client.delete(f"/units/{unit_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify it's deleted
    get_response = client.get(f"/units/{unit_id}")
    assert get_response.status_code == 404
