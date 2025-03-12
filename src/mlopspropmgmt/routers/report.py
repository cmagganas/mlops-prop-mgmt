from typing import Union

from fastapi import (
    APIRouter,
    HTTPException,
    Path,
    Query,
)

from ..db.report import report_service
from ..models.report import (
    AllPropertiesBalanceReport,
    PropertyBalanceReport,
    PropertyFinancialSummary,
    TenantBalanceReport,
    UnitBalanceReport,
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


@router.get("/balance/property/{property_id}", response_model=PropertyBalanceReport)
async def get_property_balance_report(
    property_id: int = Path(..., description="The ID of the property to generate a report for"),
) -> PropertyBalanceReport:
    """
    Generate a detailed balance report for a property.

    Includes information about all units in the property, with a focus on units with outstanding balances.

    - **property_id**: The unique identifier of the property
    """
    report = report_service.generate_property_balance_report(property_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return report


@router.get("/balance/unit/{unit_id}", response_model=UnitBalanceReport)
async def get_unit_balance_report(
    unit_id: int = Path(..., description="The ID of the unit to generate a report for"),
) -> UnitBalanceReport:
    """
    Generate a detailed balance report for a unit.

    Includes tenant information, lease details, payment history, and missing payment periods.

    - **unit_id**: The unique identifier of the unit
    """
    report = report_service.generate_unit_balance_report(unit_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return report


@router.get("/balance", response_model=AllPropertiesBalanceReport)
async def get_all_properties_balance_report() -> AllPropertiesBalanceReport:
    """
    Generate a balance report for all properties.

    Provides a summary of financial information across all properties.
    """
    return report_service.generate_all_properties_balance_report()


@router.get(
    "/balance/summary", response_model=Union[UnitBalanceReport, PropertyBalanceReport, AllPropertiesBalanceReport]
)
async def get_balance_summary(
    property_id: int = Query(None, description="Optional property ID to filter by"),
    unit_id: int = Query(None, description="Optional unit ID to filter by"),
) -> Union[UnitBalanceReport, PropertyBalanceReport, AllPropertiesBalanceReport]:
    """
    Generate a consolidated balance report with flexible filtering.

    Returns a report filtered by the provided parameters:
    - If unit_id is provided, returns a unit balance report
    - If property_id is provided (but not unit_id), returns a property balance report
    - If neither is provided, returns a report for all properties

    - **property_id**: Optional property ID to filter by
    - **unit_id**: Optional unit ID to filter by
    """
    report = report_service.generate_balance_report(property_id, unit_id)
    if report is None:
        entity_type = "Unit" if unit_id else "Property"
        entity_id = unit_id if unit_id else property_id
        raise HTTPException(status_code=404, detail=f"{entity_type} with ID {entity_id} not found")
    return report
