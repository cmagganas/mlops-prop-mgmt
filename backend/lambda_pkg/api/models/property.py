from typing import (
    Any,
    Dict,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class PropertyBase(BaseModel):
    """Base property information model.

    Common attributes shared by property creation and retrieval."""

    name: str = Field(..., description="Name of the property")
    address: str = Field(..., description="Address of the property")


class PropertyCreate(PropertyBase):
    """Model for creating a new property.

    Inherits all fields from PropertyBase, used as input model for POST requests."""


class Property(PropertyBase):
    """Complete property model including the ID.

    Used for response models to include the ID with the property data."""

    id: int = Field(..., description="Unique identifier for the property")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {"id": 1, "name": "Sunset Apartments", "address": "123 Main Street, Anytown, USA"}
        },
    )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Property":
        """Create a Property instance from a dictionary.

        Args:

            data: Dictionary containing property data

        Returns:

            A Property instance"""
        return cls(**data)
