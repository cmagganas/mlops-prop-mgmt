from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    Query,
)

from ..db.property import property_repository
from ..models.property import (
    Property,
    PropertyCreate,
)

# Create a router with a prefix and tag
router = APIRouter(
    prefix="/properties",
    tags=["properties"],
)


@router.get("/", response_model=List[Property])
async def get_properties() -> List[Property]:
    """
    Retrieve a list of all properties.
    """
    return property_repository.get_all()


@router.get("/{property_id}", response_model=Property)
async def get_property(
    property_id: int = Path(..., description="The ID of the property to retrieve"),
) -> Property:
    """
    Retrieve a specific property by ID.

    - **property_id**: The unique identifier of the property
    """
    property_item = property_repository.get_by_id(property_id)
    if property_item is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_item


@router.post("/", response_model=Property)
async def create_property(property: PropertyCreate) -> Property:
    """
    Create a new property.

    - **property**: Property data to create
    """
    return property_repository.create(property.model_dump())


@router.put("/{property_id}", response_model=Property)
async def update_property(
    property: PropertyCreate,
    property_id: int = Path(..., description="The ID of the property to update"),
) -> Property:
    """
    Update an existing property.

    - **property**: Updated property data
    - **property_id**: The unique identifier of the property to update
    """
    updated_property = property_repository.update(property_id, property.model_dump())
    if updated_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return updated_property


@router.delete("/{property_id}")
async def delete_property(
    property_id: int = Path(..., description="The ID of the property to delete"),
) -> dict:
    """
    Delete a property.

    - **property_id**: The unique identifier of the property to delete
    """
    deleted = property_repository.delete(property_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"success": True, "message": f"Property {property_id} deleted"}
