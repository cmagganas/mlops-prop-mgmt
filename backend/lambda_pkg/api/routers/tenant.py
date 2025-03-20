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

from ..db.tenant import tenant_repository
from ..models.tenant import (
    Tenant,
    TenantCreate,
    TenantStatus,
)

router = APIRouter(
    prefix="/tenants",
    tags=["tenants"],
)


@router.get("/", response_model=List[Tenant])
async def get_tenants(
    unit_id: Optional[int] = Query(None, description="Filter tenants by unit ID"),
    status: Optional[TenantStatus] = Query(None, description="Filter tenants by status"),
) -> List[Tenant]:
    """Retrieve a list of tenants with optional filtering.

    - **unit_id**: Optional filter by unit ID
    - **status**: Optional filter by tenant status"""
    if unit_id is not None:
        return tenant_repository.get_by_unit(unit_id)
    elif status is not None:
        return tenant_repository.get_by_status(status)
    return tenant_repository.get_all()


@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(
    tenant_id: int = Path(..., description="The ID of the tenant to retrieve"),
) -> Tenant:
    """Retrieve a specific tenant by ID.

    - **tenant_id**: The unique identifier of the tenant"""
    tenant = tenant_repository.get_by_id(tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.post("/", response_model=Tenant)
async def create_tenant(tenant: TenantCreate) -> Tenant:
    """Create a new tenant.

    - **tenant**: Tenant data to create"""
    created_tenant = tenant_repository.create(tenant.model_dump())
    if created_tenant is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unit with ID {tenant.unit_id} not found" if tenant.unit_id else "Invalid unit ID",
        )
    return created_tenant


@router.put("/{tenant_id}", response_model=Tenant)
async def update_tenant(
    tenant: TenantCreate,
    tenant_id: int = Path(..., description="The ID of the tenant to update"),
) -> Tenant:
    """Update an existing tenant.

    - **tenant**: Updated tenant data
    - **tenant_id**: The unique identifier of the tenant to update"""
    updated_tenant = tenant_repository.update(tenant_id, tenant.model_dump())
    if updated_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found or invalid unit ID")
    return updated_tenant


@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: int = Path(..., description="The ID of the tenant to delete"),
) -> dict:
    """Delete a tenant.

    - **tenant_id**: The unique identifier of the tenant to delete"""
    deleted = tenant_repository.delete(tenant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"success": True, "message": f"Tenant {tenant_id} deleted"}
