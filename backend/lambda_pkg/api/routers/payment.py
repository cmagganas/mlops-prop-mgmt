from datetime import date
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

from ..db.payment import payment_repository
from ..models.payment import (
    Payment,
    PaymentCreate,
    PaymentType,
)

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)


@router.get("/", response_model=List[Payment])
async def get_payments(
    lease_id: Optional[int] = Query(None, description="Filter payments by lease ID"),
    tenant_id: Optional[int] = Query(None, description="Filter payments by tenant ID"),
    payment_type: Optional[PaymentType] = Query(None, description="Filter payments by type"),
    start_date: Optional[date] = Query(None, description="Filter payments by start date"),
    end_date: Optional[date] = Query(None, description="Filter payments by end date"),
) -> List[Payment]:
    """Retrieve a list of payments with optional filtering.

    - **lease_id**: Optional filter by lease ID
    - **tenant_id**: Optional filter by tenant ID
    - **payment_type**: Optional filter by payment type
    - **start_date**: Optional filter by start date
    - **end_date**: Optional filter by end date"""
    if lease_id is not None:
        return payment_repository.get_by_lease(lease_id)
    elif tenant_id is not None:
        return payment_repository.get_by_tenant(tenant_id)
    elif payment_type is not None:
        return payment_repository.get_by_payment_type(payment_type)
    elif start_date is not None and end_date is not None:
        return payment_repository.get_by_date_range(start_date, end_date)
    return payment_repository.get_all()


@router.get("/{payment_id}", response_model=Payment)
async def get_payment(
    payment_id: int = Path(..., description="The ID of the payment to retrieve"),
) -> Payment:
    """Retrieve a specific payment by ID.

    - **payment_id**: The unique identifier of the payment"""
    payment = payment_repository.get_by_id(payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=Payment)
async def create_payment(payment: PaymentCreate) -> Payment:
    """Create a new payment.

    - **payment**: Payment data to create"""
    created_payment = payment_repository.create(payment.model_dump())
    if created_payment is None:
        raise HTTPException(
            status_code=404, detail="Invalid lease ID, tenant ID, or tenant is not on the specified lease"
        )
    return created_payment


@router.put("/{payment_id}", response_model=Payment)
async def update_payment(
    payment: PaymentCreate,
    payment_id: int = Path(..., description="The ID of the payment to update"),
) -> Payment:
    """Update an existing payment.

    - **payment**: Updated payment data
    - **payment_id**: The unique identifier of the payment to update"""
    updated_payment = payment_repository.update(payment_id, payment.model_dump())
    if updated_payment is None:
        raise HTTPException(
            status_code=404,
            detail="Payment not found, invalid lease ID, tenant ID, or tenant is not on the specified lease",
        )
    return updated_payment


@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: int = Path(..., description="The ID of the payment to delete"),
) -> dict:
    """Delete a payment.

    - **payment_id**: The unique identifier of the payment to delete"""
    deleted = payment_repository.delete(payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"success": True, "message": f"Payment {payment_id} deleted"}


@router.get("/totals/lease/{lease_id}")
async def get_lease_payment_totals(
    lease_id: int = Path(..., description="The ID of the lease to get payment totals for"),
) -> dict:
    """Get total payment amount for a lease.

    - **lease_id**: The unique identifier of the lease"""
    # Verify that the lease exists
    payments = payment_repository.get_by_lease(lease_id)
    if not payments:
        raise HTTPException(status_code=404, detail="Lease not found or no payments for this lease")

    total = payment_repository.get_payment_totals_by_lease(lease_id)
    return {"lease_id": lease_id, "total_payments": total, "payment_count": len(payments)}


@router.get("/totals/tenant/{tenant_id}")
async def get_tenant_payment_totals(
    tenant_id: int = Path(..., description="The ID of the tenant to get payment totals for"),
) -> dict:
    """Get total payment amount for a tenant.

    - **tenant_id**: The unique identifier of the tenant"""
    # Verify that the tenant exists and has payments
    payments = payment_repository.get_by_tenant(tenant_id)
    if not payments:
        raise HTTPException(status_code=404, detail="Tenant not found or no payments for this tenant")

    total = payment_repository.get_payment_totals_by_tenant(tenant_id)
    return {"tenant_id": tenant_id, "total_payments": total, "payment_count": len(payments)}
