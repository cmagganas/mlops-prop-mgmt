from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from ..models.unit import Unit
from .property import property_repository


class UnitRepository:
    """In-memory repository for unit data.

    This class provides operations for managing units in memory."""

    def __init__(self):
        """Initialize with some sample unit data."""
        self.units: List[Dict[str, Any]] = [
            {
                "unit_id": 1,
                "unit_name": "101",
                "property_id": 1,
                "description": "Corner unit with garden view",
                "beds": 2,
                "baths": 1.5,
                "sq_ft": 950,
            },
            {
                "unit_id": 2,
                "unit_name": "102",
                "property_id": 1,
                "description": "Studio apartment",
                "beds": 0,
                "baths": 1.0,
                "sq_ft": 600,
            },
            {
                "unit_id": 3,
                "unit_name": "201",
                "property_id": 2,
                "description": "Ocean view condo",
                "beds": 3,
                "baths": 2.0,
                "sq_ft": 1200,
            },
        ]

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Unit]:
        """Get all units.

        Args:

            skip: Unused pagination parameter
            limit: Unused pagination parameter

        Returns:

            List of Unit objects"""
        return [Unit.from_dict(u) for u in self.units]

    def get_by_id(self, unit_id: int) -> Optional[Unit]:
        """Get a unit by its ID.

        Args:

            unit_id: ID of the unit to retrieve

        Returns:

            Unit if found, None otherwise"""
        for unit in self.units:
            if unit["unit_id"] == unit_id:
                return Unit.from_dict(unit)
        return None

    def get_by_property(self, property_id: int) -> List[Unit]:
        """Get all units for a property.

        Args:

            property_id: ID of the property

        Returns:

            List of Unit objects for the property"""
        return [Unit.from_dict(u) for u in self.units if u["property_id"] == property_id]

    def create(self, unit_data: Dict[str, Any]) -> Optional[Unit]:
        """Create a new unit.

        Args:

            unit_data: Unit data (without ID)

        Returns:

            Created Unit with ID, or None if property not found"""
        # Verify that the property exists
        property_id = unit_data.get("property_id")
        if not isinstance(property_id, int):
            return None

        property_exists = property_repository.get_by_id(property_id) is not None

        if not property_exists:
            return None

        # Create new unit
        new_id = max(u["unit_id"] for u in self.units) + 1 if self.units else 1
        new_unit = {"unit_id": new_id, **unit_data}
        self.units.append(new_unit)
        return Unit.from_dict(new_unit)

    def update(self, unit_id: int, unit_data: Dict[str, Any]) -> Optional[Unit]:
        """Update an existing unit.

        Args:

            unit_id: ID of the unit to update
            unit_data: New unit data (without ID)

        Returns:

            Updated Unit if found, None otherwise"""
        # Verify that the property exists if it's being changed
        property_id = unit_data.get("property_id")
        if property_id is not None:
            if not isinstance(property_id, int):
                return None

            property_exists = property_repository.get_by_id(property_id) is not None
            if not property_exists:
                return None

        for i, unit in enumerate(self.units):
            if unit["unit_id"] == unit_id:
                self.units[i] = {"unit_id": unit_id, **unit_data}
                return Unit.from_dict(self.units[i])
        return None

    def delete(self, unit_id: int) -> bool:
        """Delete a unit.

        Args:

            unit_id: ID of the unit to delete

        Returns:

            True if deleted, False if not found"""
        for i, unit in enumerate(self.units):
            if unit["unit_id"] == unit_id:
                del self.units[i]
                return True
        return False


# Create a singleton instance
unit_repository = UnitRepository()
