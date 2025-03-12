from typing import (
    Any,
    Dict,
    List,
    Optional,
)

from ..models.property import Property


class PropertyRepository:
    """In-memory repository for property data.

    This class provides operations for managing properties in memory."""

    def __init__(self):
        """Initialize with some sample property data."""
        self.properties: List[Dict[str, Any]] = [
            {"id": 1, "name": "Sunset Apartments", "address": "123 Main Street, Anytown, USA"},
            {"id": 2, "name": "Ocean View Condos", "address": "456 Beach Road, Coastville, USA"},
        ]

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Property]:
        """Get all properties.

        Args:

            skip: Unused pagination parameter
            limit: Unused pagination parameter

        Returns:

            List of Property objects"""
        return [Property.from_dict(p) for p in self.properties]

    def get_by_id(self, property_id: int) -> Optional[Property]:
        """Get a property by its ID.

        Args:

            property_id: ID of the property to retrieve

        Returns:

            Property if found, None otherwise"""
        for property_item in self.properties:
            if property_item["id"] == property_id:
                return Property.from_dict(property_item)
        return None

    def create(self, property_data: Dict[str, Any]) -> Property:
        """Create a new property.

        Args:

            property_data: Property data (without ID)

        Returns:

            Created Property with ID"""
        new_id = max(p["id"] for p in self.properties) + 1 if self.properties else 1
        new_property = {"id": new_id, **property_data}
        self.properties.append(new_property)
        return Property.from_dict(new_property)

    def update(self, property_id: int, property_data: Dict[str, Any]) -> Optional[Property]:
        """Update an existing property.

        Args:

            property_id: ID of the property to update
            property_data: New property data (without ID)

        Returns:

            Updated Property if found, None otherwise"""
        for i, property_item in enumerate(self.properties):
            if property_item["id"] == property_id:
                self.properties[i] = {"id": property_id, **property_data}
                return Property.from_dict(self.properties[i])
        return None

    def delete(self, property_id: int) -> bool:
        """Delete a property.

        Args:

            property_id: ID of the property to delete

        Returns:

            True if deleted, False if not found"""
        for i, property_item in enumerate(self.properties):
            if property_item["id"] == property_id:
                del self.properties[i]
                return True
        return False


# Create a singleton instance
property_repository = PropertyRepository()
