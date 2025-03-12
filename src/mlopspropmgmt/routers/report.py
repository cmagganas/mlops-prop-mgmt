from fastapi import (
    APIRouter,
    HTTPException,
    Path,
)

from ..db.report import report_service
from ..models.report import (
    PropertyFinancialSummary,
    TenantBalanceReport,
)

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)


@router.get("/balance/tenant/{tenant_id}", response_model=TenantBalanceReport)
async def get_tenant_balance_report(
    tenant_id: int = Path(..., description="The ID of the tenant to generate a report for"),
) -> TenantBalanceReport:
    """
    Generate a financial report for a tenant.

    Includes payment history, lease information, and outstanding balance.

    - **tenant_id**: The unique identifier of the tenant
    """
    report = report_service.generate_tenant_balance_report(tenant_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return report


@router.get("/balance/property/{property_id}", response_model=PropertyFinancialSummary)
async def get_property_financial_summary(
    property_id: int = Path(..., description="The ID of the property to generate a report for"),
) -> PropertyFinancialSummary:
    """
    Generate a financial summary for a property.

    Includes unit occupancy, tenant details, and payment summaries for each unit.

    - **property_id**: The unique identifier of the property
    """
    report = report_service.generate_property_report(property_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return report


@router.get("/balance/unit/{unit_id}", response_model=PropertyFinancialSummary)
async def get_unit_financial_summary(
    unit_id: int = Path(..., description="The ID of the unit to generate a report for"),
) -> PropertyFinancialSummary:
    """
    Generate a financial summary for a unit.

    Includes tenant details and payment summaries.

    - **unit_id**: The unique identifier of the unit
    """
    # For now, this is just a placeholder that returns a 404
    # We would need to implement a unit-specific report in the report service
    raise HTTPException(status_code=404, detail="Unit balance report not implemented yet")


@router.get("/balance/summary", response_model=dict)
async def get_all_properties_summary() -> dict:
    """
    Generate a summary financial report for all properties.

    Includes total units, occupancy rates, and financial summaries across all properties.
    """
    # For now, this is just a placeholder that returns a 404
    # We would need to implement a summary report in the report service
    raise HTTPException(status_code=404, detail="Summary report not implemented yet")
