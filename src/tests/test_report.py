"""Tests for the report endpoints."""

import pytest
from fastapi.testclient import TestClient

from mlopspropmgmt.main import app

client = TestClient(app)


def test_get_tenant_balance(client: TestClient):
    """Test getting a tenant's balance report."""
    # Get a valid tenant ID
    all_tenants = client.get("/tenants/").json()
    if not all_tenants:
        pytest.skip("No tenants found in sample data")

    tenant_id = all_tenants[0]["tenant_id"]

    # Get tenant balance report
    response = client.get(f"/reports/balance/tenant/{tenant_id}")
    assert response.status_code == 200
    balance_report = response.json()

    # Check the structure of the balance report
    assert "tenant_id" in balance_report
    assert "tenant_name" in balance_report
    assert "lease_summary" in balance_report
    assert "payment_summary" in balance_report

    # Verify correct tenant ID
    assert balance_report["tenant_id"] == tenant_id

    # Verify that lease_summary contains balance
    if balance_report["lease_summary"]:
        assert "balance" in balance_report["lease_summary"]
        assert "total_rent_due" in balance_report["lease_summary"]
        assert "total_paid" in balance_report["lease_summary"]
        # Verify balance calculation
        lease_summary = balance_report["lease_summary"]
        assert lease_summary["balance"] == lease_summary["total_rent_due"] - lease_summary["total_paid"]

    # Verify payment_summary contains required fields
    assert "count" in balance_report["payment_summary"]
    assert "total_amount" in balance_report["payment_summary"]


def test_get_tenant_balance_not_found(client: TestClient):
    """Test getting a balance report for a non-existent tenant."""
    # Use a very large ID that shouldn't exist
    response = client.get("/reports/balance/tenant/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_unit_balance(client: TestClient):
    """Test getting a unit's balance report."""
    # Get a valid unit ID
    all_units = client.get("/units/").json()
    if not all_units:
        pytest.skip("No units found in sample data")

    unit_id = all_units[0]["unit_id"]

    # Get unit balance report
    response = client.get(f"/reports/balance/unit/{unit_id}")
    assert response.status_code == 200
    data = response.json()
    assert "unit_id" in data
    assert "balance" in data


def test_get_unit_balance_not_found(client: TestClient):
    """Test getting a balance report for a non-existent unit."""
    # Use a very large ID that shouldn't exist - still returns 404 but with different message
    response = client.get("/reports/balance/unit/9999")
    assert response.status_code == 404


def test_get_property_balance(client: TestClient):
    """Test getting a property's balance report."""
    # Get a valid property ID
    all_properties = client.get("/properties/").json()
    if not all_properties:
        pytest.skip("No properties found in sample data")

    property_id = all_properties[0]["id"]

    # Get property balance report
    response = client.get(f"/reports/balance/property/{property_id}")
    assert response.status_code == 200
    balance_report = response.json()

    # Check the structure of the balance report
    assert "property_id" in balance_report
    assert "property_name" in balance_report
    assert "total_balance" in balance_report
    assert "unit_balances" in balance_report


def test_get_property_balance_not_found(client: TestClient):
    """Test getting a balance report for a non-existent property."""
    # Use a very large ID that shouldn't exist
    response = client.get("/reports/balance/property/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_all_properties_summary(client: TestClient):
    """Test getting a summary balance report for all properties."""
    response = client.get("/reports/balance")
    assert response.status_code == 200
    data = response.json()
    assert "total_balance" in data
    assert "property_summaries" in data


def test_get_tenant_balance_report():
    """Test retrieving a tenant balance report"""
    response = client.get("/reports/balance/tenant/1")
    assert response.status_code == 200
    data = response.json()

    # Verify structure of the response
    assert "tenant_id" in data
    assert "tenant_name" in data
    assert "unit_id" in data
    assert "property_id" in data
    assert "lease_summary" in data
    assert "payment_summary" in data


def test_get_tenant_balance_report_not_found():
    """Test retrieving a tenant balance report for a non-existent tenant"""
    response = client.get("/reports/balance/tenant/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Tenant not found"


def test_get_property_balance_report():
    """Test retrieving a property balance report"""
    response = client.get("/reports/balance/property/1")
    assert response.status_code == 200
    data = response.json()

    # Verify structure of the response
    assert "property_id" in data
    assert "property_name" in data
    assert "total_balance" in data
    assert "unit_balances" in data

    # Verify unit balances are sorted by balance (descending)
    if len(data["unit_balances"]) > 1:
        for i in range(len(data["unit_balances"]) - 1):
            assert float(data["unit_balances"][i]["balance"]) >= float(data["unit_balances"][i + 1]["balance"])


def test_get_property_balance_report_not_found():
    """Test retrieving a property balance report for a non-existent property"""
    response = client.get("/reports/balance/property/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Property not found"


def test_get_unit_balance_report():
    """Test retrieving a unit balance report"""
    response = client.get("/reports/balance/unit/1")
    assert response.status_code == 200
    data = response.json()

    # Verify structure of the response
    assert "unit_id" in data
    assert "unit_name" in data
    assert "property_id" in data
    assert "property_name" in data
    assert "tenants" in data
    assert "balance" in data
    assert "payment_history" in data
    assert "missing_periods" in data


def test_get_unit_balance_report_not_found():
    """Test retrieving a unit balance report for a non-existent unit"""
    response = client.get("/reports/balance/unit/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Unit not found"


def test_get_all_properties_balance_report():
    """Test retrieving a balance report for all properties"""
    response = client.get("/reports/balance")
    assert response.status_code == 200
    data = response.json()

    # Verify structure of the response
    assert "total_balance" in data
    assert "property_summaries" in data

    # Verify property summaries are sorted by balance (descending)
    if len(data["property_summaries"]) > 1:
        for i in range(len(data["property_summaries"]) - 1):
            assert float(data["property_summaries"][i]["balance"]) >= float(
                data["property_summaries"][i + 1]["balance"]
            )


def test_get_balance_summary_by_unit():
    """Test retrieving a balance summary filtered by unit"""
    response = client.get("/reports/balance/summary?unit_id=1")
    assert response.status_code == 200
    data = response.json()

    # Verify structure matches unit balance report
    assert "unit_id" in data
    assert data["unit_id"] == 1
    assert "tenants" in data
    assert "balance" in data


def test_get_balance_summary_by_property():
    """Test retrieving a balance summary filtered by property"""
    response = client.get("/reports/balance/summary?property_id=1")
    assert response.status_code == 200
    data = response.json()

    # Verify structure matches property balance report
    assert "property_id" in data
    assert data["property_id"] == 1
    assert "unit_balances" in data
