from datetime import date
from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from ..models.payment import (
    Payment,
    PaymentMethod,
    PaymentType,
)
from .lease import lease_repository
from .tenant import tenant_repository


class PaymentRepository:
    """In-memory repository for payment data.

    This class provides operations for managing payments in memory.
    """

    def __init__(self):
        """Initialize with some sample payment data."""
        self.payments: List[Dict[str, Any]] = [
            {
                "payment_id": 1,
                "lease_id": 1,
                "tenant_id": 1,
                "amount": 1200.00,
                "payment_date": date(2023, 1, 5),
                "payment_method": "check",
                "payment_type": "rent",
                "memo": "January 2023 rent",
                "reference_number": "1234",
                "receipt_image_url": "https://example.com/receipts/1234.jpg",
            },
            {
                "payment_id": 2,
                "lease_id": 2,
                "tenant_id": 2,
                "amount": 1000.00,
                "payment_date": date(2023, 2, 3),
                "payment_method": "bank_transfer",
                "payment_type": "rent",
                "memo": "February 2023 rent",
                "reference_number": "5678",
                "receipt_image_url": None,
            },
            {
                "payment_id": 3,
                "lease_id": 3,
                "tenant_id": 3,
                "amount": 1500.00,
                "payment_date": date(2023, 3, 2),
                "payment_method": "cash",
                "payment_type": "rent",
                "memo": "March 2023 rent",
                "reference_number": None,
                "receipt_image_url": None,
            },
        ]

    def get_all(self) -> List[Payment]:
        """Get all payments.

        Returns:
            List of Payment objects
        """
        return [Payment.from_dict(p) for p in self.payments]

    def get_by_id(self, payment_id: int) -> Optional[Payment]:
        """Get a payment by its ID.

        Args:
            payment_id: ID of the payment to retrieve

        Returns:
            Payment if found, None otherwise
        """
        for payment in self.payments:
            if payment["payment_id"] == payment_id:
                return Payment.from_dict(payment)
        return None

    def get_by_lease(self, lease_id: int) -> List[Payment]:
        """Get all payments for a lease.

        Args:
            lease_id: ID of the lease

        Returns:
            List of Payment objects for the lease
        """
        return [Payment.from_dict(p) for p in self.payments if p["lease_id"] == lease_id]

    def get_by_tenant(self, tenant_id: int) -> List[Payment]:
        """Get all payments made by a tenant.

        Args:
            tenant_id: ID of the tenant

        Returns:
            List of Payment objects for the tenant
        """
        return [Payment.from_dict(p) for p in self.payments if p["tenant_id"] == tenant_id]

    def get_by_date_range(self, start_date: date, end_date: date) -> List[Payment]:
        """Get all payments within a date range.

        Args:
            start_date: Start date of the range
            end_date: End date of the range

        Returns:
            List of Payment objects within the date range
        """
        return [Payment.from_dict(p) for p in self.payments if start_date <= p["payment_date"] <= end_date]

    def get_by_payment_type(self, payment_type: PaymentType) -> List[Payment]:
        """Get all payments of a specific type.

        Args:
            payment_type: Type of payment to filter by

        Returns:
            List of Payment objects of the specified type
        """
        return [Payment.from_dict(p) for p in self.payments if p["payment_type"] == payment_type]

    def create(self, payment_data: Dict[str, Any]) -> Optional[Payment]:
        """Create a new payment.

        Args:
            payment_data: Payment data (without ID)

        Returns:
            Created Payment with ID, or None if validation fails
        """
        # Verify that the lease exists
        lease_id = payment_data["lease_id"]
        lease = lease_repository.get_by_id(lease_id)
        if lease is None:
            return None

        # Verify that the tenant exists
        tenant_id = payment_data["tenant_id"]
        tenant = tenant_repository.get_by_id(tenant_id)
        if tenant is None:
            return None

        # Verify that the tenant is on the lease
        tenant_ids = lease_repository.get_lease_tenants(lease_id)
        if tenant_id not in tenant_ids:
            return None

        # Create new payment
        new_id = max(p["payment_id"] for p in self.payments) + 1 if self.payments else 1
        new_payment = {"payment_id": new_id, **payment_data}
        self.payments.append(new_payment)

        return Payment.from_dict(new_payment)

    def update(self, payment_id: int, payment_data: Dict[str, Any]) -> Optional[Payment]:
        """Update an existing payment.

        Args:
            payment_id: ID of the payment to update
            payment_data: New payment data (without ID)

        Returns:
            Updated Payment if found, None otherwise
        """
        # Find the payment
        payment_index = None
        for i, payment in enumerate(self.payments):
            if payment["payment_id"] == payment_id:
                payment_index = i
                break

        if payment_index is None:
            return None

        # If lease or tenant is being changed, verify relationships
        if "lease_id" in payment_data or "tenant_id" in payment_data:
            lease_id = payment_data.get("lease_id", self.payments[payment_index]["lease_id"])
            tenant_id = payment_data.get("tenant_id", self.payments[payment_index]["tenant_id"])

            # Verify lease exists
            lease = lease_repository.get_by_id(lease_id)
            if lease is None:
                return None

            # Verify tenant exists
            tenant = tenant_repository.get_by_id(tenant_id)
            if tenant is None:
                return None

            # Verify tenant is on the lease
            tenant_ids = lease_repository.get_lease_tenants(lease_id)
            if tenant_id not in tenant_ids:
                return None

        # Update payment data
        self.payments[payment_index] = {"payment_id": payment_id, **payment_data}

        return Payment.from_dict(self.payments[payment_index])

    def delete(self, payment_id: int) -> bool:
        """Delete a payment.

        Args:
            payment_id: ID of the payment to delete

        Returns:
            True if deleted, False if not found
        """
        for i, payment in enumerate(self.payments):
            if payment["payment_id"] == payment_id:
                del self.payments[i]
                return True
        return False

    def get_payment_totals_by_lease(self, lease_id: int) -> float:
        """Get total payment amount for a lease.

        Args:
            lease_id: ID of the lease

        Returns:
            Total payment amount
        """
        return sum(p["amount"] for p in self.payments if p["lease_id"] == lease_id)

    def get_payment_totals_by_tenant(self, tenant_id: int) -> float:
        """Get total payment amount for a tenant.

        Args:
            tenant_id: ID of the tenant

        Returns:
            Total payment amount
        """
        return sum(p["amount"] for p in self.payments if p["tenant_id"] == tenant_id)


# Create a singleton instance
payment_repository = PaymentRepository()
