from typing import (
    List,
    Optional,
)

from fastapi import (
    APIRouter,
    HTTPException,
    Path,
    Query,
)

from ..db.lease import lease_repository
from ..models.lease import (
    Lease,
    LeaseCreate,
    LeaseStatus,
)

router = APIRouter(
    prefix="/leases",
    tags=["leases"],
)


@router.get("/", response_model=List[Lease])
async def get_leases(
    property_id: Optional[int] = Query(None, description="Filter leases by property ID"),
    unit_id: Optional[int] = Query(None, description="Filter leases by unit ID"),
    tenant_id: Optional[int] = Query(None, description="Filter leases by tenant ID"),
    status: Optional[LeaseStatus] = Query(None, description="Filter leases by status"),
) -> List[Lease]:
    """Retrieve a list of leases with optional filtering.

    - **property_id**: Optional filter by property ID
    - **unit_id**: Optional filter by unit ID
    - **tenant_id**: Optional filter by tenant ID
    - **status**: Optional filter by lease status"""
    if property_id is not None:
        return lease_repository.get_by_property(property_id)
    elif unit_id is not None:
        return lease_repository.get_by_unit(unit_id)
    elif tenant_id is not None:
        return lease_repository.get_by_tenant(tenant_id)
    elif status is not None:
        return lease_repository.get_by_status(status)
    return lease_repository.get_all()


@router.get("/{lease_id}", response_model=Lease)
async def get_lease(
    lease_id: int = Path(..., description="The ID of the lease to retrieve"),
) -> Lease:
    """Retrieve a specific lease by ID.

    - **lease_id**: The unique identifier of the lease"""
    lease = lease_repository.get_by_id(lease_id)
    if lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    return lease


@router.post("/", response_model=Lease)
async def create_lease(lease: LeaseCreate) -> Lease:
    """Create a new lease.

    - **lease**: Lease data to create, including tenant IDs"""
    # Extract tenant_ids from the request body
    tenant_ids = lease.tenant_ids

    # Create lease without tenant_ids in the data dict
    lease_data = lease.model_dump(exclude={"tenant_ids"})

    created_lease = lease_repository.create(lease_data, tenant_ids)
    if created_lease is None:
        raise HTTPException(
            status_code=404, detail="Invalid property, unit, or tenant IDs, or unit does not belong to property"
        )
    return created_lease


@router.put("/{lease_id}", response_model=Lease)
async def update_lease(
    lease: LeaseCreate,
    lease_id: int = Path(..., description="The ID of the lease to update"),
) -> Lease:
    """Update an existing lease.

    - **lease**: Updated lease data
    - **lease_id**: The unique identifier of the lease to update"""
    # Extract tenant_ids from the request body
    tenant_ids = lease.tenant_ids

    # Update lease without tenant_ids in the data dict
    lease_data = lease.model_dump(exclude={"tenant_ids"})

    updated_lease = lease_repository.update(lease_id, lease_data, tenant_ids)
    if updated_lease is None:
        raise HTTPException(
            status_code=404, detail="Lease not found, invalid property/unit relationship, or invalid tenant IDs"
        )
    return updated_lease


@router.delete("/{lease_id}")
async def delete_lease(
    lease_id: int = Path(..., description="The ID of the lease to delete"),
) -> dict:
    """Delete a lease.

    - **lease_id**: The unique identifier of the lease to delete"""
    deleted = lease_repository.delete(lease_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lease not found")
    return {"success": True, "message": f"Lease {lease_id} deleted"}
