from typing import (
    Any,
    Dict,
    Optional,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class UnitBase(BaseModel):
    """Base unit information model.

    Common attributes shared by unit creation and retrieval."""

    unit_name: str = Field(..., description="Name or number of the unit")
    property_id: int = Field(..., description="ID of the property this unit belongs to")
    description: Optional[str] = Field(None, description="Description of the unit")
    beds: Optional[int] = Field(None, description="Number of bedrooms")
    baths: Optional[float] = Field(None, description="Number of bathrooms")
    sq_ft: Optional[int] = Field(None, description="Square footage of the unit")


class UnitCreate(UnitBase):
    """Model for creating a new unit.

    Inherits all fields from UnitBase, used as input model for POST requests."""


class Unit(UnitBase):
    """Complete unit model including the ID.

    Used for response models to include the ID with the unit data."""

    unit_id: int = Field(..., description="Unique identifier for the unit")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "unit_id": 1,
                "unit_name": "101",
                "property_id": 1,
                "description": "Corner unit with garden view",
                "beds": 2,
                "baths": 1.5,
                "sq_ft": 950,
            }
        },
    )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Unit":
        """Create a Unit instance from a dictionary.

        Args:

            data: Dictionary containing unit data

        Returns:

            A Unit instance"""
        return cls(**data)
