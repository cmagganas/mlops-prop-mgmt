from datetime import date
from typing import (
    Dict,
    List,
    Optional,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class PaymentSummary(BaseModel):
    """Summary of payment activity.

    Provides a breakdown of payments by type.
    """

    count: int = Field(0, description="Number of payments")
    total_amount: float = Field(0.0, description="Total amount of payments")

    # Optional breakdown by payment type
    rent_amount: float = Field(0.0, description="Total rent payments")
    security_deposit_amount: float = Field(0.0, description="Total security deposit payments")
    late_fee_amount: float = Field(0.0, description="Total late fee payments")
    utility_amount: float = Field(0.0, description="Total utility payments")
    maintenance_amount: float = Field(0.0, description="Total maintenance payments")
    other_amount: float = Field(0.0, description="Total other payments")

    model_config = ConfigDict(
        from_attributes=True,
    )


class LeaseFinancialSummary(BaseModel):
    """Financial summary for a lease.

    Contains information about rent due, total paid, and outstanding balance.
    """

    lease_id: int = Field(..., description="Lease ID")
    rent_amount: float = Field(..., description="Monthly rent amount")
    start_date: date = Field(..., description="Lease start date")
    end_date: date = Field(..., description="Lease end date")
    months_active: int = Field(..., description="Number of months the lease has been active")
    total_rent_due: float = Field(..., description="Total rent due over the active period")
    total_paid: float = Field(..., description="Total amount paid towards the lease")
    balance: float = Field(..., description="Current balance (negative means credit)")

    model_config = ConfigDict(
        from_attributes=True,
    )


class TenantBalanceReport(BaseModel):
    """Tenant balance report.

    Contains financial information for a specific tenant.
    """

    tenant_id: int = Field(..., description="Tenant ID")
    tenant_name: str = Field(..., description="Tenant name")
    unit_id: Optional[int] = Field(None, description="Unit ID (if currently assigned)")
    property_id: Optional[int] = Field(None, description="Property ID (if currently assigned)")
    lease_summary: Optional[LeaseFinancialSummary] = Field(None, description="Current lease summary")
    payment_summary: PaymentSummary = Field(..., description="Summary of payment activity")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "tenant_id": 1,
                "tenant_name": "John Smith",
                "unit_id": 1,
                "property_id": 1,
                "lease_summary": {
                    "lease_id": 1,
                    "rent_amount": 1200.00,
                    "start_date": "2023-01-01",
                    "end_date": "2024-01-01",
                    "months_active": 5,
                    "total_rent_due": 6000.00,
                    "total_paid": 6000.00,
                    "balance": 0.00,
                },
                "payment_summary": {
                    "count": 5,
                    "total_amount": 6000.00,
                    "rent_amount": 6000.00,
                    "security_deposit_amount": 0.00,
                    "late_fee_amount": 0.00,
                    "utility_amount": 0.00,
                    "maintenance_amount": 0.00,
                    "other_amount": 0.00,
                },
            }
        },
    )


class PropertyFinancialSummary(BaseModel):
    """Financial summary for a property.

    Contains information about all units and tenants in a property.
    """

    property_id: int = Field(..., description="Property ID")
    property_name: str = Field(..., description="Property name")
    unit_count: int = Field(..., description="Number of units in the property")
    occupied_units: int = Field(..., description="Number of occupied units")
    total_rent_due: float = Field(..., description="Total rent due from all active leases")
    total_paid: float = Field(..., description="Total amount paid towards all leases")
    total_balance: float = Field(..., description="Current balance for all units (negative means credit)")
    unit_summaries: List[Dict[str, any]] = Field(..., description="Financial summaries for each unit")

    model_config = ConfigDict(
        from_attributes=True,
    )
