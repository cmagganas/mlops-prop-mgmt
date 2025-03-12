from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from ..models.tenant import (
    Tenant,
    TenantStatus,
)
from .unit import unit_repository


class TenantRepository:
    """In-memory repository for tenant data.

    This class provides operations for managing tenants in memory.
    """

    def __init__(self):
        """Initialize with some sample tenant data."""
        self.tenants: List[Dict[str, Any]] = [
            {
                "tenant_id": 1,
                "name": "John Smith",
                "email": "john.smith@example.com",
                "phone": "555-123-4567",
                "unit_id": 1,
                "status": "active",
            },
            {
                "tenant_id": 2,
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "phone": "555-987-6543",
                "unit_id": 2,
                "status": "active",
            },
            {
                "tenant_id": 3,
                "name": "Robert Johnson",
                "email": "robert.j@example.com",
                "phone": "555-567-8901",
                "unit_id": 3,
                "status": "active",
            },
        ]

    def get_all(self) -> List[Tenant]:
        """Get all tenants.

        Returns:
            List of Tenant objects
        """
        return [Tenant.from_dict(t) for t in self.tenants]

    def get_by_id(self, tenant_id: int) -> Optional[Tenant]:
        """Get a tenant by its ID.

        Args:
            tenant_id: ID of the tenant to retrieve

        Returns:
            Tenant if found, None otherwise
        """
        for tenant in self.tenants:
            if tenant["tenant_id"] == tenant_id:
                return Tenant.from_dict(tenant)
        return None

    def get_by_unit(self, unit_id: int) -> List[Tenant]:
        """Get all tenants for a unit.

        Args:
            unit_id: ID of the unit

        Returns:
            List of Tenant objects for the unit
        """
        return [
            Tenant.from_dict(t) for t in self.tenants if t["unit_id"] == unit_id and t["status"] == TenantStatus.ACTIVE
        ]

    def get_by_status(self, status: TenantStatus) -> List[Tenant]:
        """Get all tenants with a specific status.

        Args:
            status: Status to filter by

        Returns:
            List of Tenant objects with the specified status
        """
        return [Tenant.from_dict(t) for t in self.tenants if t["status"] == status]

    def create(self, tenant_data: Dict[str, Any]) -> Optional[Tenant]:
        """Create a new tenant.

        Args:
            tenant_data: Tenant data (without ID)

        Returns:
            Created Tenant with ID, or None if unit not found
        """
        # Verify that the unit exists if provided
        unit_id = tenant_data.get("unit_id")
        if unit_id is not None:
            if not isinstance(unit_id, int):
                return None

            unit_exists = unit_repository.get_by_id(unit_id) is not None
            if not unit_exists:
                return None

        # Create new tenant
        new_id = max(t["tenant_id"] for t in self.tenants) + 1 if self.tenants else 1
        new_tenant = {"tenant_id": new_id, **tenant_data}
        self.tenants.append(new_tenant)
        return Tenant.from_dict(new_tenant)

    def update(self, tenant_id: int, tenant_data: Dict[str, Any]) -> Optional[Tenant]:
        """Update an existing tenant.

        Args:
            tenant_id: ID of the tenant to update
            tenant_data: New tenant data (without ID)

        Returns:
            Updated Tenant if found, None otherwise
        """
        # Verify that the unit exists if it's being changed
        unit_id = tenant_data.get("unit_id")
        if unit_id is not None:
            if not isinstance(unit_id, int):
                return None

            unit_exists = unit_repository.get_by_id(unit_id) is not None
            if not unit_exists:
                return None

        for i, tenant in enumerate(self.tenants):
            if tenant["tenant_id"] == tenant_id:
                self.tenants[i] = {"tenant_id": tenant_id, **tenant_data}
                return Tenant.from_dict(self.tenants[i])
        return None

    def delete(self, tenant_id: int) -> bool:
        """Delete a tenant.

        Args:
            tenant_id: ID of the tenant to delete

        Returns:
            True if deleted, False if not found
        """
        for i, tenant in enumerate(self.tenants):
            if tenant["tenant_id"] == tenant_id:
                del self.tenants[i]
                return True
        return False


# Create a singleton instance
tenant_repository = TenantRepository()
