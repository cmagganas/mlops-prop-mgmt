"""Tests for the payment endpoints."""

from datetime import date

import pytest
from fastapi.testclient import TestClient


def test_get_payments(client: TestClient):
    """Test getting all payments."""
    response = client.get("/payments/")
    assert response.status_code == 200
    payments = response.json()
    assert isinstance(payments, list)
    # The in-memory repository should have sample data
    assert len(payments) > 0


def test_get_payment(client: TestClient):
    """Test getting a specific payment."""
    # First get all payments
    all_payments = client.get("/payments/").json()

    # Then get the first payment by ID
    first_payment = all_payments[0]
    payment_id = first_payment["payment_id"]

    response = client.get(f"/payments/{payment_id}")
    assert response.status_code == 200
    payment_data = response.json()
    assert payment_data["payment_id"] == payment_id
    assert payment_data["amount"] == first_payment["amount"]
    assert payment_data["tenant_id"] == first_payment["tenant_id"]


def test_get_payment_not_found(client: TestClient):
    """Test getting a non-existent payment."""
    # Use a very large ID that shouldn't exist
    response = client.get("/payments/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_payments_by_tenant(client: TestClient):
    """Test getting payments filtered by tenant ID."""
    # First get all payments
    all_payments = client.get("/payments/").json()

    # Get a tenant ID from the first payment
    tenant_id = all_payments[0]["tenant_id"]

    # Get payments for that tenant
    response = client.get(f"/payments/?tenant_id={tenant_id}")
    assert response.status_code == 200
    filtered_payments = response.json()
    assert isinstance(filtered_payments, list)
    assert len(filtered_payments) > 0

    # All payments should belong to the specified tenant
    for payment in filtered_payments:
        assert payment["tenant_id"] == tenant_id


def test_get_payments_by_lease(client: TestClient):
    """Test getting payments filtered by lease ID."""
    # First get all payments
    all_payments = client.get("/payments/").json()

    # Get a lease ID from the first payment
    lease_id = all_payments[0]["lease_id"]

    # Get payments for that lease
    response = client.get(f"/payments/?lease_id={lease_id}")
    assert response.status_code == 200
    filtered_payments = response.json()
    assert isinstance(filtered_payments, list)
    assert len(filtered_payments) > 0

    # All payments should belong to the specified lease
    for payment in filtered_payments:
        assert payment["lease_id"] == lease_id


def test_get_payments_by_date_range(client: TestClient):
    """Test getting payments filtered by date range."""
    # Get payments for the last year
    today = date.today()
    start_date = date(today.year - 1, today.month, today.day).isoformat()
    end_date = today.isoformat()

    response = client.get(f"/payments/?start_date={start_date}&end_date={end_date}")
    assert response.status_code == 200
    filtered_payments = response.json()
    assert isinstance(filtered_payments, list)

    # All payments should be within the date range
    for payment in filtered_payments:
        payment_date = date.fromisoformat(payment["payment_date"])
        assert date.fromisoformat(start_date) <= payment_date <= date.fromisoformat(end_date)


def test_create_payment(client: TestClient):
    """Test creating a new payment."""
    # First get valid tenant and lease IDs
    all_tenants = client.get("/tenants/").json()
    if not all_tenants:
        pytest.skip("No tenants found in sample data")

    tenant_id = all_tenants[0]["tenant_id"]

    # Get a lease for this tenant
    all_leases = client.get(f"/leases/?tenant_id={tenant_id}").json()
    if not all_leases:
        # Get any lease
        all_leases = client.get("/leases/").json()
        if not all_leases:
            pytest.skip("No leases found in sample data")

    lease_id = all_leases[0]["lease_id"]

    # Create a new payment
    today = date.today()
    new_payment = {
        "tenant_id": tenant_id,
        "lease_id": lease_id,
        "amount": 1000.00,
        "payment_date": today.isoformat(),
        "payment_method": "check",
        "memo": "Rent payment for May 2023",
        "receipt_image_path": None,
    }

    response = client.post("/payments/", json=new_payment)
    assert response.status_code == 200
    created_payment = response.json()
    assert created_payment["tenant_id"] == tenant_id
    assert created_payment["lease_id"] == lease_id
    assert created_payment["amount"] == new_payment["amount"]
    assert "payment_id" in created_payment


def test_update_payment(client: TestClient):
    """Test updating a payment."""
    # First get all payments
    all_payments = client.get("/payments/").json()

    # Then get the first payment by ID
    first_payment = all_payments[0]
    payment_id = first_payment["payment_id"]
    tenant_id = first_payment["tenant_id"]
    lease_id = first_payment["lease_id"]

    # Update the payment
    updated_data = {
        "tenant_id": tenant_id,
        "lease_id": lease_id,
        "amount": 1100.00,  # Updated amount
        "payment_date": first_payment["payment_date"],
        "payment_method": "credit_card",  # Updated payment method
        "memo": "Updated memo",
        "receipt_image_path": first_payment.get("receipt_image_path"),
    }

    response = client.put(f"/payments/{payment_id}", json=updated_data)
    assert response.status_code == 200
    updated_payment = response.json()
    assert updated_payment["payment_id"] == payment_id
    assert updated_payment["amount"] == updated_data["amount"]
    assert updated_payment["payment_method"] == updated_data["payment_method"]
    assert updated_payment["memo"] == updated_data["memo"]


def test_delete_payment(client: TestClient):
    """Test deleting a payment."""
    # First get valid tenant and lease IDs to create a new payment
    all_tenants = client.get("/tenants/").json()
    if not all_tenants:
        pytest.skip("No tenants found in sample data")

    tenant_id = all_tenants[0]["tenant_id"]

    # Get a lease for this tenant
    all_leases = client.get(f"/leases/?tenant_id={tenant_id}").json()
    if not all_leases:
        # Get any lease
        all_leases = client.get("/leases/").json()
        if not all_leases:
            pytest.skip("No leases found in sample data")

    lease_id = all_leases[0]["lease_id"]

    # Create a new payment to delete
    today = date.today()
    new_payment = {
        "tenant_id": tenant_id,
        "lease_id": lease_id,
        "amount": 1000.00,
        "payment_date": today.isoformat(),
        "payment_method": "check",
        "memo": "Payment to delete",
        "receipt_image_path": None,
    }

    created = client.post("/payments/", json=new_payment).json()
    payment_id = created["payment_id"]

    # Then delete it
    response = client.delete(f"/payments/{payment_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify it's deleted
    get_response = client.get(f"/payments/{payment_id}")
    assert get_response.status_code == 404
