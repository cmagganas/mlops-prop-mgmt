from datetime import date
from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from ..models.lease import (
    Lease,
    LeaseStatus,
)
from .property import property_repository
from .tenant import tenant_repository
from .unit import unit_repository


class LeaseRepository:
    """In-memory repository for lease data.

    This class provides operations for managing leases in memory with tenant relationships."""

    def __init__(self):
        """Initialize with some sample lease data."""
        self.leases: List[Dict[str, Any]] = [
            {
                "lease_id": 1,
                "property_id": 1,
                "unit_id": 1,
                "rent_amount": 1200.00,
                "start_date": date(2023, 1, 1),
                "end_date": date(2024, 1, 1),
                "status": "active",
            },
            {
                "lease_id": 2,
                "property_id": 1,
                "unit_id": 2,
                "rent_amount": 1000.00,
                "start_date": date(2023, 2, 1),
                "end_date": date(2024, 2, 1),
                "status": "active",
            },
            {
                "lease_id": 3,
                "property_id": 2,
                "unit_id": 3,
                "rent_amount": 1500.00,
                "start_date": date(2023, 3, 1),
                "end_date": date(2024, 3, 1),
                "status": "active",
            },
        ]

        # Lease-tenant relationships (junction table)
        self.lease_tenants: List[Dict[str, int]] = [
            {"lease_id": 1, "tenant_id": 1},
            {"lease_id": 2, "tenant_id": 2},
            {"lease_id": 3, "tenant_id": 3},
        ]

    def get_all(self) -> List[Lease]:
        """Get all leases with their associated tenants.

        Returns:

            List of Lease objects"""
        result = []
        for lease in self.leases:
            tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease["lease_id"]]
            result.append(Lease.from_dict(lease, tenant_ids))
        return result

    def get_by_id(self, lease_id: int) -> Optional[Lease]:
        """Get a lease by its ID.

        Args:

            lease_id: ID of the lease to retrieve

        Returns:

            Lease if found, None otherwise"""
        for lease in self.leases:
            if lease["lease_id"] == lease_id:
                tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease_id]
                return Lease.from_dict(lease, tenant_ids)
        return None

    def get_by_property(self, property_id: int) -> List[Lease]:
        """Get all leases for a property.

        Args:

            property_id: ID of the property

        Returns:

            List of Lease objects for the property"""
        result = []
        for lease in self.leases:
            if lease["property_id"] == property_id:
                tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease["lease_id"]]
                result.append(Lease.from_dict(lease, tenant_ids))
        return result

    def get_by_unit(self, unit_id: int) -> List[Lease]:
        """Get all leases for a unit.

        Args:

            unit_id: ID of the unit

        Returns:

            List of Lease objects for the unit"""
        result = []
        for lease in self.leases:
            if lease["unit_id"] == unit_id:
                tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease["lease_id"]]
                result.append(Lease.from_dict(lease, tenant_ids))
        return result

    def get_by_tenant(self, tenant_id: int) -> List[Lease]:
        """Get all leases for a tenant.

        Args:

            tenant_id: ID of the tenant

        Returns:

            List of Lease objects for the tenant"""
        lease_ids = [lt["lease_id"] for lt in self.lease_tenants if lt["tenant_id"] == tenant_id]
        result = []
        for lease in self.leases:
            if lease["lease_id"] in lease_ids:
                tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease["lease_id"]]
                result.append(Lease.from_dict(lease, tenant_ids))
        return result

    def get_by_status(self, status: LeaseStatus) -> List[Lease]:
        """Get all leases with a specific status.

        Args:

            status: Status to filter by

        Returns:

            List of Lease objects with the specified status"""
        result = []
        for lease in self.leases:
            if lease["status"] == status:
                tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease["lease_id"]]
                result.append(Lease.from_dict(lease, tenant_ids))
        return result

    def create(self, lease_data: Dict[str, Any], tenant_ids: List[int]) -> Optional[Lease]:
        """Create a new lease with tenant relationships.

        Args:

            lease_data: Lease data (without ID)
            tenant_ids: List of tenant IDs to associate with this lease

        Returns:

            Created Lease with ID, or None if validation fails"""
        # Verify that the property exists
        property_id = lease_data["property_id"]
        if not property_repository.get_by_id(property_id):
            return None

        # Verify that the unit exists and belongs to the property
        unit_id = lease_data["unit_id"]
        unit = unit_repository.get_by_id(unit_id)
        if not unit or unit.property_id != property_id:
            return None

        # Verify that all tenants exist
        for tenant_id in tenant_ids:
            if tenant_repository.get_by_id(tenant_id) is None:
                return None

        # Create new lease
        new_id = max(lease["lease_id"] for lease in self.leases) + 1 if self.leases else 1
        new_lease = {"lease_id": new_id, **lease_data}
        self.leases.append(new_lease)

        # Create lease-tenant relationships
        for tenant_id in tenant_ids:
            self.lease_tenants.append({"lease_id": new_id, "tenant_id": tenant_id})

        return Lease.from_dict(new_lease, tenant_ids)

    def update(
        self, lease_id: int, lease_data: Dict[str, Any], tenant_ids: Optional[List[int]] = None
    ) -> Optional[Lease]:
        """Update an existing lease.

        Args:

            lease_id: ID of the lease to update
            lease_data: New lease data (without ID)
            tenant_ids: Optional list of tenant IDs to update relationships

        Returns:

            Updated Lease if found, None otherwise"""
        # Find the lease
        lease_index = None
        for i, lease in enumerate(self.leases):
            if lease["lease_id"] == lease_id:
                lease_index = i
                break

        if lease_index is None:
            return None

        # Verify that the property exists
        property_id = lease_data["property_id"]
        if not property_repository.get_by_id(property_id):
            return None

        # Verify that the unit exists and belongs to the property
        unit_id = lease_data["unit_id"]
        unit = unit_repository.get_by_id(unit_id)
        if not unit or unit.property_id != property_id:
            return None

        # Update lease data
        self.leases[lease_index] = {"lease_id": lease_id, **lease_data}

        # Update tenant relationships if provided
        if tenant_ids is not None:
            # Verify that all tenants exist
            for tenant_id in tenant_ids:
                if tenant_repository.get_by_id(tenant_id) is None:
                    return None

            # Remove old relationships
            self.lease_tenants = [lt for lt in self.lease_tenants if lt["lease_id"] != lease_id]

            # Add new relationships
            for tenant_id in tenant_ids:
                self.lease_tenants.append({"lease_id": lease_id, "tenant_id": tenant_id})

        # Get updated tenant IDs
        current_tenant_ids = [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease_id]

        return Lease.from_dict(self.leases[lease_index], current_tenant_ids)

    def delete(self, lease_id: int) -> bool:
        """Delete a lease and its tenant relationships.

        Args:

            lease_id: ID of the lease to delete

        Returns:

            True if deleted, False if not found"""
        for i, lease in enumerate(self.leases):
            if lease["lease_id"] == lease_id:
                del self.leases[i]
                # Delete associated lease-tenant relationships
                self.lease_tenants = [lt for lt in self.lease_tenants if lt["lease_id"] != lease_id]
                return True
        return False

    def get_tenant_leases(self, tenant_id: int) -> List[int]:
        """Get all lease IDs for a tenant.

        Args:

            tenant_id: ID of the tenant

        Returns:

            List of lease IDs for the tenant"""
        return [lt["lease_id"] for lt in self.lease_tenants if lt["tenant_id"] == tenant_id]

    def get_lease_tenants(self, lease_id: int) -> List[int]:
        """Get all tenant IDs for a lease.

        Args:

            lease_id: ID of the lease

        Returns:

            List of tenant IDs for the lease"""
        return [lt["tenant_id"] for lt in self.lease_tenants if lt["lease_id"] == lease_id]


# Create a singleton instance
lease_repository = LeaseRepository()
