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
    EmailStr,
    Field,
)


class TenantStatus(str, Enum):
    """Tenant status enumeration.

    Represents the various states a tenant can be in.
    """

    ACTIVE = "active"
    FORMER = "former"
    FUTURE = "future"
    EVICTED = "evicted"


class TenantBase(BaseModel):
    """Base tenant information model.

    Common attributes shared by tenant creation and retrieval.
    """

    name: str = Field(..., description="Full name of the tenant")
    email: Optional[str] = Field(None, description="Email address of the tenant")
    phone: Optional[str] = Field(None, description="Phone number of the tenant")
    unit_id: Optional[int] = Field(None, description="ID of the unit the tenant occupies")
    status: TenantStatus = Field(default=TenantStatus.ACTIVE, description="Status of the tenant")


class TenantCreate(TenantBase):
    """Model for creating a new tenant.

    Inherits all fields from TenantBase, used as input model for POST requests.
    """

    pass


class Tenant(TenantBase):
    """Complete tenant model including the ID.

    Used for response models to include the ID with the tenant data.
    """

    tenant_id: int = Field(..., description="Unique identifier for the tenant")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "tenant_id": 1,
                "name": "John Smith",
                "email": "john.smith@example.com",
                "phone": "555-123-4567",
                "unit_id": 1,
                "status": "active",
            }
        },
    )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Tenant":
        """Create a Tenant instance from a dictionary.

        Args:
            data: Dictionary containing tenant data

        Returns:
            A Tenant instance
        """
        return cls(**data)
