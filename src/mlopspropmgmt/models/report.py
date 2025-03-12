from datetime import date
from typing import (
    Any,
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

    Provides a breakdown of payments by type."""

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

    Contains information about rent due, total paid, and outstanding balance."""

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


class MissingPaymentPeriod(BaseModel):
    """Information about a missing payment period.

    Represents a month where a payment was expected but not received."""

    year: int = Field(..., description="Year of the missing payment")
    month: int = Field(..., description="Month of the missing payment (1-12)")
    month_name: str = Field(..., description="Name of the month (e.g., 'January')")
    amount_due: float = Field(..., description="Amount due for this period")

    model_config = ConfigDict(
        from_attributes=True,
    )


class TenantBalanceReport(BaseModel):
    """Tenant balance report.

    Contains financial information for a specific tenant."""

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


class TenantInfo(BaseModel):
    """Basic tenant information for unit reports."""

    tenant_id: int = Field(..., description="Tenant ID")
    name: str = Field(..., description="Tenant name")
    email: Optional[str] = Field(None, description="Tenant email")
    phone: Optional[str] = Field(None, description="Tenant phone number")
    status: str = Field(..., description="Tenant status (active, former, etc.)")

    model_config = ConfigDict(
        from_attributes=True,
    )


class UnitBalanceInfo(BaseModel):
    """Financial information for a unit.

    Used in property reports to summarize unit balances."""

    unit_id: int = Field(..., description="Unit ID")
    unit_name: str = Field(..., description="Unit name/number")
    occupied: bool = Field(..., description="Whether the unit is occupied")
    tenant_count: int = Field(0, description="Number of active tenants")
    rent_amount: Optional[float] = Field(None, description="Monthly rent amount if there's an active lease")
    total_due: float = Field(0.0, description="Total amount due")
    total_paid: float = Field(0.0, description="Total amount paid")
    balance: float = Field(0.0, description="Current balance (total_due - total_paid)")
    has_missing_payments: bool = Field(False, description="Whether there are missing payments")
    missing_payment_count: int = Field(0, description="Number of missing payments")

    model_config = ConfigDict(
        from_attributes=True,
    )


class UnitBalanceReport(BaseModel):
    """Detailed balance report for a unit.

    Contains detailed financial information about a specific unit."""

    unit_id: int = Field(..., description="Unit ID")
    unit_name: str = Field(..., description="Unit name/number")
    property_id: int = Field(..., description="Property ID")
    property_name: str = Field(..., description="Property name")
    status: str = Field(..., description="Unit status (occupied, vacant, etc.)")
    tenants: List[TenantInfo] = Field([], description="Current tenants in the unit")
    active_lease_id: Optional[int] = Field(None, description="Active lease ID if any")
    rent_amount: Optional[float] = Field(None, description="Monthly rent amount if there's an active lease")
    lease_start_date: Optional[date] = Field(None, description="Lease start date")
    lease_end_date: Optional[date] = Field(None, description="Lease end date")
    total_due: float = Field(0.0, description="Total amount due")
    total_paid: float = Field(0.0, description="Total amount paid")
    balance: float = Field(0.0, description="Current balance (total_due - total_paid)")
    missing_periods: List[MissingPaymentPeriod] = Field([], description="List of missing payment periods")
    payment_history: List[Dict[str, Any]] = Field([], description="Recent payment history")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "unit_id": 101,
                "unit_name": "101",
                "property_id": 1,
                "property_name": "Sunset Apartments",
                "status": "occupied",
                "tenants": [
                    {
                        "tenant_id": 1,
                        "name": "John Smith",
                        "email": "john@example.com",
                        "phone": "555-123-4567",
                        "status": "active",
                    }
                ],
                "active_lease_id": 1001,
                "rent_amount": 1000.00,
                "lease_start_date": "2022-06-01",
                "lease_end_date": "2023-05-31",
                "total_due": 10000.00,
                "total_paid": 7000.00,
                "balance": 3000.00,
                "missing_periods": [
                    {"year": 2023, "month": 1, "month_name": "January", "amount_due": 1000.00},
                    {"year": 2023, "month": 2, "month_name": "February", "amount_due": 1000.00},
                    {"year": 2023, "month": 3, "month_name": "March", "amount_due": 1000.00},
                ],
                "payment_history": [
                    {"payment_id": 101, "date": "2022-12-01", "amount": 1000.00, "method": "check"},
                    {"payment_id": 92, "date": "2022-11-01", "amount": 1000.00, "method": "check"},
                ],
            }
        },
    )


class PropertyFinancialSummary(BaseModel):
    """Financial summary for a property.

    Contains information about all units and tenants in a property."""

    property_id: int = Field(..., description="Property ID")
    property_name: str = Field(..., description="Property name")
    unit_count: int = Field(..., description="Number of units in the property")
    occupied_units: int = Field(..., description="Number of occupied units")
    total_rent_due: float = Field(..., description="Total rent due from all active leases")
    total_paid: float = Field(..., description="Total amount paid towards all leases")
    total_balance: float = Field(..., description="Current balance for all units (negative means credit)")
    unit_summaries: List[Dict[str, Any]] = Field(..., description="Financial summaries for each unit")

    model_config = ConfigDict(
        from_attributes=True,
    )


class PropertyBalanceReport(BaseModel):
    """Detailed balance report for a property.

    Contains detailed financial information for all units in a property,
    with a focus on outstanding balances."""

    property_id: int = Field(..., description="Property ID")
    property_name: str = Field(..., description="Property name")
    report_date: date = Field(..., description="Date the report was generated")
    unit_count: int = Field(..., description="Total number of units")
    occupied_units: int = Field(..., description="Number of occupied units")
    total_due: float = Field(..., description="Total amount due across all units")
    total_paid: float = Field(..., description="Total amount paid across all units")
    total_balance: float = Field(..., description="Total outstanding balance")
    units_with_balance: int = Field(..., description="Number of units with outstanding balance")
    unit_balances: List[UnitBalanceInfo] = Field(..., description="Balance information for each unit")

    model_config = ConfigDict(
        from_attributes=True,
    )


class AllPropertiesBalanceReport(BaseModel):
    """Balance report for all properties.

    Contains summary information about balances across all properties."""

    report_date: date = Field(..., description="Date the report was generated")
    property_count: int = Field(..., description="Number of properties")
    total_units: int = Field(..., description="Total number of units across all properties")
    occupied_units: int = Field(..., description="Number of occupied units")
    total_due: float = Field(..., description="Total amount due across all properties")
    total_paid: float = Field(..., description="Total amount paid across all properties")
    total_balance: float = Field(..., description="Total outstanding balance")
    property_summaries: List[Dict[str, Any]] = Field(..., description="Balance summaries for each property")

    model_config = ConfigDict(
        from_attributes=True,
    )
