from datetime import date
from enum import Enum
from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class LeaseStatus(str, Enum):
    """Lease status enumeration.

    Represents the various states a lease can be in.
    """

    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class LeaseBase(BaseModel):
    """Base lease information model.

    Common attributes shared by lease creation and retrieval.
    """

    property_id: int = Field(..., description="ID of the property this lease is for")
    unit_id: int = Field(..., description="ID of the unit this lease is for")
    rent_amount: float = Field(..., description="Monthly rent amount")
    start_date: date = Field(..., description="Lease start date")
    end_date: date = Field(..., description="Lease end date")
    status: LeaseStatus = Field(default=LeaseStatus.ACTIVE, description="Status of the lease")


class LeaseCreate(LeaseBase):
    """Model for creating a new lease.

    Inherits all fields from LeaseBase and adds tenant_ids for creating the lease-tenant relationships.
    """

    tenant_ids: List[int] = Field(..., description="IDs of tenants on this lease")


class Lease(LeaseBase):
    """Complete lease model including the ID.

    Used for response models to include the ID with the lease data.
    """

    lease_id: int = Field(..., description="Unique identifier for the lease")
    tenant_ids: List[int] = Field(default_factory=list, description="IDs of tenants on this lease")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "lease_id": 1,
                "property_id": 1,
                "unit_id": 1,
                "rent_amount": 1000.00,
                "start_date": "2023-01-01",
                "end_date": "2024-01-01",
                "status": "active",
                "tenant_ids": [1, 2],
            }
        },
    )

    @classmethod
    def from_dict(cls, data: Dict[str, Any], tenant_ids: Optional[List[int]] = None) -> "Lease":
        """Create a Lease instance from a dictionary.

        Args:
            data: Dictionary containing lease data
            tenant_ids: Optional list of tenant IDs associated with this lease

        Returns:
            A Lease instance
        """
        lease_data = dict(data)
        if tenant_ids is not None:
            lease_data["tenant_ids"] = tenant_ids
        return cls(**lease_data)
