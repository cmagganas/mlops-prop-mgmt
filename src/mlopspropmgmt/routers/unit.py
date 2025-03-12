from typing import List

from fastapi import (
    APIRouter,
    HTTPException,
    Path,
    Query,
)

from ..db.unit import unit_repository
from ..models.unit import (
    Unit,
    UnitCreate,
)

router = APIRouter(
    prefix="/units",
    tags=["units"],
)


@router.get("/", response_model=List[Unit])
async def get_units(
    property_id: int | None = Query(None, description="Filter units by property ID"),
) -> List[Unit]:
    """Retrieve a list of units with optional filtering by property.

    - **property_id**: Optional filter by property ID"""
    if property_id is not None:
        return unit_repository.get_by_property(property_id)
    return unit_repository.get_all()


@router.get("/{unit_id}", response_model=Unit)
async def get_unit(
    unit_id: int = Path(..., description="The ID of the unit to retrieve"),
) -> Unit:
    """Retrieve a specific unit by ID.

    - **unit_id**: The unique identifier of the unit"""
    unit = unit_repository.get_by_id(unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.post("/", response_model=Unit)
async def create_unit(unit: UnitCreate) -> Unit:
    """Create a new unit.

    - **unit**: Unit data to create"""
    created_unit = unit_repository.create(unit.model_dump())
    if created_unit is None:
        raise HTTPException(
            status_code=404,
            detail=f"Property with ID {unit.property_id} not found",
        )
    return created_unit


@router.put("/{unit_id}", response_model=Unit)
async def update_unit(
    unit: UnitCreate,
    unit_id: int = Path(..., description="The ID of the unit to update"),
) -> Unit:
    """Update an existing unit.

    - **unit**: Updated unit data
    - **unit_id**: The unique identifier of the unit to update"""
    updated_unit = unit_repository.update(unit_id, unit.model_dump())
    if updated_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found or invalid property ID")
    return updated_unit


@router.delete("/{unit_id}")
async def delete_unit(
    unit_id: int = Path(..., description="The ID of the unit to delete"),
) -> dict:
    """Delete a unit.

    - **unit_id**: The unique identifier of the unit to delete"""
    deleted = unit_repository.delete(unit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"success": True, "message": f"Unit {unit_id} deleted"}
