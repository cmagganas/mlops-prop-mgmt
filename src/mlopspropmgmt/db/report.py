from datetime import date
from typing import (
    Dict,
    List,
    Optional,
)

from ..models.payment import PaymentType
from ..models.report import (
    LeaseFinancialSummary,
    PaymentSummary,
    PropertyFinancialSummary,
    TenantBalanceReport,
)
from .lease import lease_repository
from .payment import payment_repository
from .property import property_repository
from .tenant import tenant_repository
from .unit import unit_repository


class ReportService:
    """Service for generating financial reports.

    This class provides methods for generating various financial reports.
    """

    def calculate_months_between(self, start_date: date, end_date: date) -> int:
        """Calculate the number of months between two dates.

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            Number of months between start_date and end_date
        """
        # Use the min of end_date and today to avoid counting future months
        today = date.today()
        actual_end = min(end_date, today)

        # If start date is in the future, return 0
        if start_date > today:
            return 0

        # Calculate months between
        months = (actual_end.year - start_date.year) * 12 + actual_end.month - start_date.month

        # Add partial month if we're past the start date day in the final month
        if actual_end.day >= start_date.day:
            months += 1

        return months

    def generate_tenant_balance_report(self, tenant_id: int) -> Optional[TenantBalanceReport]:
        """Generate a balance report for a tenant.

        Args:
            tenant_id: ID of the tenant

        Returns:
            TenantBalanceReport if tenant exists, None otherwise
        """
        # Get tenant
        tenant = tenant_repository.get_by_id(tenant_id)
        if tenant is None:
            return None

        # Get current unit and property
        unit_id = tenant.unit_id
        property_id = None

        if unit_id:
            unit = unit_repository.get_by_id(unit_id)
            if unit:
                property_id = unit.property_id

        # Get active lease (if any)
        active_leases = []
        tenant_leases = lease_repository.get_by_tenant(tenant_id)
        for lease in tenant_leases:
            if lease.status == "active":
                active_leases.append(lease)

        # Get payments for this tenant
        payments = payment_repository.get_by_tenant(tenant_id)

        # Calculate payment summary
        payment_summary = PaymentSummary(
            count=len(payments),
            total_amount=sum(p.amount for p in payments),
            rent_amount=sum(p.amount for p in payments if p.payment_type == PaymentType.RENT),
            security_deposit_amount=sum(p.amount for p in payments if p.payment_type == PaymentType.SECURITY_DEPOSIT),
            late_fee_amount=sum(p.amount for p in payments if p.payment_type == PaymentType.LATE_FEE),
            utility_amount=sum(p.amount for p in payments if p.payment_type == PaymentType.UTILITY),
            maintenance_amount=sum(p.amount for p in payments if p.payment_type == PaymentType.MAINTENANCE),
            other_amount=sum(p.amount for p in payments if p.payment_type == PaymentType.OTHER),
        )

        # Calculate lease summary (if active lease)
        lease_summary = None
        if active_leases:
            # Use the first active lease
            lease = active_leases[0]

            # Calculate months active
            months_active = self.calculate_months_between(lease.start_date, lease.end_date)

            # Calculate rent due
            total_rent_due = lease.rent_amount * months_active

            # Calculate rent paid
            total_paid = sum(
                p.amount for p in payments if p.lease_id == lease.lease_id and p.payment_type == PaymentType.RENT
            )

            # Calculate balance
            balance = total_rent_due - total_paid

            lease_summary = LeaseFinancialSummary(
                lease_id=lease.lease_id,
                rent_amount=lease.rent_amount,
                start_date=lease.start_date,
                end_date=lease.end_date,
                months_active=months_active,
                total_rent_due=total_rent_due,
                total_paid=total_paid,
                balance=balance,
            )

        # Create and return report
        return TenantBalanceReport(
            tenant_id=tenant.tenant_id,
            tenant_name=tenant.name,
            unit_id=unit_id,
            property_id=property_id,
            lease_summary=lease_summary,
            payment_summary=payment_summary,
        )

    def generate_property_report(self, property_id: int) -> Optional[PropertyFinancialSummary]:
        """Generate a financial summary for a property.

        Args:
            property_id: ID of the property

        Returns:
            PropertyFinancialSummary if property exists, None otherwise
        """
        # Get property
        property_obj = property_repository.get_by_id(property_id)
        if property_obj is None:
            return None

        # Get units for this property
        units = unit_repository.get_by_property(property_id)

        # Count occupied units
        occupied_units = 0
        total_rent_due = 0.0
        total_paid = 0.0
        unit_summaries = []

        # Process each unit
        for unit in units:
            # Get active tenants for this unit
            tenants = tenant_repository.get_by_unit(unit.unit_id)
            active_tenants = [t for t in tenants if t.status == "active"]

            # Skip if no active tenants
            if not active_tenants:
                unit_summaries.append(
                    {
                        "unit_id": unit.unit_id,
                        "unit_name": unit.unit_name,
                        "occupied": False,
                        "tenants": [],
                        "rent_due": 0.0,
                        "rent_paid": 0.0,
                        "balance": 0.0,
                    }
                )
                continue

            # Unit is occupied
            occupied_units += 1

            # Get leases for this unit
            unit_leases = lease_repository.get_by_unit(unit.unit_id)
            active_leases = [l for l in unit_leases if l.status == "active"]

            unit_rent_due = 0.0
            unit_rent_paid = 0.0
            tenant_summaries = []

            # Process active leases
            for lease in active_leases:
                # Calculate months active
                months_active = self.calculate_months_between(lease.start_date, lease.end_date)

                # Calculate rent due
                lease_rent_due = lease.rent_amount * months_active
                unit_rent_due += lease_rent_due
                total_rent_due += lease_rent_due

                # Get payments for this lease
                lease_payments = payment_repository.get_by_lease(lease.lease_id)
                rent_payments = [p for p in lease_payments if p.payment_type == PaymentType.RENT]
                lease_rent_paid = sum(p.amount for p in rent_payments)
                unit_rent_paid += lease_rent_paid
                total_paid += lease_rent_paid

                # Add tenant summaries
                for tenant_id in lease.tenant_ids:
                    tenant = tenant_repository.get_by_id(tenant_id)
                    if tenant:
                        tenant_summaries.append(
                            {
                                "tenant_id": tenant.tenant_id,
                                "tenant_name": tenant.name,
                                "lease_id": lease.lease_id,
                                "rent_amount": lease.rent_amount,
                                "rent_due": lease_rent_due,
                                "rent_paid": lease_rent_paid,
                                "balance": lease_rent_due - lease_rent_paid,
                            }
                        )

            # Add unit summary
            unit_summaries.append(
                {
                    "unit_id": unit.unit_id,
                    "unit_name": unit.unit_name,
                    "occupied": True,
                    "tenants": tenant_summaries,
                    "rent_due": unit_rent_due,
                    "rent_paid": unit_rent_paid,
                    "balance": unit_rent_due - unit_rent_paid,
                }
            )

        # Create and return report
        return PropertyFinancialSummary(
            property_id=property_obj.id,
            property_name=property_obj.name,
            unit_count=len(units),
            occupied_units=occupied_units,
            total_rent_due=total_rent_due,
            total_paid=total_paid,
            total_balance=total_rent_due - total_paid,
            unit_summaries=unit_summaries,
        )


# Create a singleton instance
report_service = ReportService()
