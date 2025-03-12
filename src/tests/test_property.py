"""Tests for the property endpoints."""

from fastapi.testclient import TestClient


def test_get_properties(client: TestClient):
    """Test getting all properties."""
    response = client.get("/properties/")
    assert response.status_code == 200
    properties = response.json()
    assert isinstance(properties, list)
    # The in-memory repository should have sample data
    assert len(properties) > 0


def test_get_property(client: TestClient):
    """Test getting a specific property."""
    # First get all properties
    all_properties = client.get("/properties/").json()

    # Then get the first property by ID
    first_property = all_properties[0]
    property_id = first_property["id"]

    response = client.get(f"/properties/{property_id}")
    assert response.status_code == 200
    property_data = response.json()
    assert property_data["id"] == property_id
    assert property_data["name"] == first_property["name"]


def test_get_property_not_found(client: TestClient):
    """Test getting a non-existent property."""
    # Use a very large ID that shouldn't exist
    response = client.get("/properties/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_property(client: TestClient):
    """Test creating a new property."""
    new_property = {"name": "Test Property", "address": "123 Test Street"}

    response = client.post("/properties/", json=new_property)
    assert response.status_code == 200
    created_property = response.json()
    assert created_property["name"] == new_property["name"]
    assert created_property["address"] == new_property["address"]
    assert "id" in created_property


def test_update_property(client: TestClient):
    """Test updating a property."""
    # First get all properties
    all_properties = client.get("/properties/").json()

    # Then get the first property by ID
    first_property = all_properties[0]
    property_id = first_property["id"]

    # Update the property
    updated_data = {"name": "Updated Property Name", "address": first_property["address"]}

    response = client.put(f"/properties/{property_id}", json=updated_data)
    assert response.status_code == 200
    updated_property = response.json()
    assert updated_property["id"] == property_id
    assert updated_property["name"] == updated_data["name"]


def test_delete_property(client: TestClient):
    """Test deleting a property."""
    # First create a new property to delete
    new_property = {"name": "Property to Delete", "address": "456 Delete Street"}

    created = client.post("/properties/", json=new_property).json()
    property_id = created["id"]

    # Then delete it
    response = client.delete(f"/properties/{property_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify it's deleted
    get_response = client.get(f"/properties/{property_id}")
    assert get_response.status_code == 404
