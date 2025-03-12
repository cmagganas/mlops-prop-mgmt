from datetime import date
from typing import (
    List,
    Optional,
    Union,
)

from ..models.payment import PaymentType
from ..models.report import (
    AllPropertiesBalanceReport,
    LeaseFinancialSummary,
    MissingPaymentPeriod,
    PaymentSummary,
    PropertyBalanceReport,
    PropertyFinancialSummary,
    TenantBalanceReport,
    TenantInfo,
    UnitBalanceInfo,
    UnitBalanceReport,
)
from .lease import lease_repository
from .payment import payment_repository
from .property import property_repository
from .tenant import tenant_repository
from .unit import unit_repository


class ReportService:
    """Service for generating financial reports.

    This class provides methods for generating various financial reports."""

    def get_month_name(self, month: int) -> str:
        """Get the name of a month from its number.

        Args:

            month: Month number (1-12)

        Returns:

            Month name (e.g., 'January')"""
        month_names = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]
        return month_names[month - 1]

    def calculate_months_between(self, start_date: date, end_date: date) -> int:
        """Calculate the number of months between two dates.

        Args:

            start_date: Start date
            end_date: End date

        Returns:

            Number of months between start_date and end_date"""
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

    def identify_missing_payment_periods(
        self, lease_start_date: date, monthly_rent: float, payments: List[dict]
    ) -> List[MissingPaymentPeriod]:
        """Identify periods (months) where payments are missing.

        Args:

            lease_start_date: Start date of the lease
            monthly_rent: Monthly rent amount
            payments: List of payment records with payment_date

        Returns:

            List of missing payment periods"""
        # Current date for comparison
        today = date.today()

        # Create a set of (year, month) tuples for months that have been paid
        paid_months = set()
        for payment in payments:
            payment_date = payment.get("payment_date")
            if payment_date and isinstance(payment_date, date):
                paid_months.add((payment_date.year, payment_date.month))

        # Calculate expected payment months - from lease start to current month
        expected_months = []
        current_date = lease_start_date
        while current_date <= today:
            expected_months.append((current_date.year, current_date.month))
            # Move to next month
            if current_date.month == 12:
                current_date = date(current_date.year + 1, 1, 1)
            else:
                # Handle different month lengths
                next_month = current_date.month + 1
                next_year = current_date.year
                # Try to keep the same day, but adjust if needed
                try:
                    current_date = date(next_year, next_month, current_date.day)
                except ValueError:
                    # If day is invalid (e.g., Feb 30), use last day of month
                    if next_month == 2:
                        current_date = date(next_year, next_month, 28)
                    else:
                        current_date = date(next_year, next_month, 30)

        # Find missing months
        missing_periods = []
        for year, month in expected_months:
            if (year, month) not in paid_months:
                missing_periods.append(
                    MissingPaymentPeriod(
                        year=year,
                        month=month,
                        month_name=self.get_month_name(month),
                        amount_due=monthly_rent,
                    )
                )

        return missing_periods

    def generate_tenant_balance_report(self, tenant_id: int) -> Optional[TenantBalanceReport]:
        """Generate a balance report for a tenant.

        Args:

            tenant_id: ID of the tenant

        Returns:

            TenantBalanceReport if tenant exists, None otherwise"""
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

            PropertyFinancialSummary if property exists, None otherwise"""
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

    def generate_unit_balance_report(self, unit_id: int) -> Optional[UnitBalanceReport]:
        """Generate a detailed balance report for a unit.

        Args:

            unit_id: ID of the unit

        Returns:

            UnitBalanceReport if the unit exists, None otherwise"""
        # Get unit
        unit = unit_repository.get_by_id(unit_id)
        if unit is None:
            return None

        # Get property
        property_obj = property_repository.get_by_id(unit.property_id)
        if property_obj is None:
            return None

        # Get tenants for this unit
        tenants = tenant_repository.get_by_unit(unit_id)
        active_tenants = [t for t in tenants if t.status == "active"]

        # Convert tenant data to TenantInfo objects
        tenant_info_list = []
        for tenant in active_tenants:
            tenant_info_list.append(
                TenantInfo(
                    tenant_id=tenant.tenant_id,
                    name=tenant.name,
                    email=tenant.email,
                    phone=tenant.phone,
                    status=tenant.status,
                )
            )

        # Determine unit status
        status = "vacant"
        if active_tenants:
            status = "occupied"

        # Initialize report fields
        active_lease_id = None
        rent_amount = None
        lease_start_date = None
        lease_end_date = None
        total_due = 0.0
        total_paid = 0.0
        missing_periods = []
        payment_history = []

        # Get leases for this unit
        unit_leases = lease_repository.get_by_unit(unit_id)
        active_leases = [l for l in unit_leases if l.status == "active"]

        # Process active lease if any
        if active_leases:
            # Use the first active lease
            lease = active_leases[0]
            active_lease_id = lease.lease_id
            rent_amount = lease.rent_amount
            lease_start_date = lease.start_date
            lease_end_date = lease.end_date

            # Calculate months active
            months_active = self.calculate_months_between(lease.start_date, lease.end_date)

            # Calculate rent due
            total_due = lease.rent_amount * months_active

            # Get payments for this lease
            lease_payments = payment_repository.get_by_lease(lease.lease_id)

            # Calculate total paid
            rent_payments = [p for p in lease_payments if p.payment_type == PaymentType.RENT]
            total_paid = sum(p.amount for p in rent_payments)

            # Convert payment data to history records
            for payment in rent_payments:
                payment_history.append(
                    {
                        "payment_id": payment.payment_id,
                        "date": payment.payment_date.isoformat(),
                        "amount": payment.amount,
                        "method": payment.payment_method,
                    }
                )

            # Identify missing payment periods
            # Convert payments to dict format for the helper function
            payment_dicts = [{"payment_date": p.payment_date, "amount": p.amount} for p in rent_payments]
            missing_periods = self.identify_missing_payment_periods(lease.start_date, lease.rent_amount, payment_dicts)

        # Create and return report
        return UnitBalanceReport(
            unit_id=unit.unit_id,
            unit_name=unit.unit_name,
            property_id=property_obj.id,
            property_name=property_obj.name,
            status=status,
            tenants=tenant_info_list,
            active_lease_id=active_lease_id,
            rent_amount=rent_amount,
            lease_start_date=lease_start_date,
            lease_end_date=lease_end_date,
            total_due=total_due,
            total_paid=total_paid,
            balance=total_due - total_paid,
            missing_periods=missing_periods,
            payment_history=payment_history,
        )

    def generate_property_balance_report(self, property_id: int) -> Optional[PropertyBalanceReport]:
        """Generate a detailed balance report for a property.

        Args:

            property_id: ID of the property

        Returns:

            PropertyBalanceReport if the property exists, None otherwise"""
        # Get property
        property_obj = property_repository.get_by_id(property_id)
        if property_obj is None:
            return None

        # Get units for this property
        units = unit_repository.get_by_property(property_id)

        # Initialize counters and totals
        unit_count = len(units)
        occupied_units = 0
        total_due = 0.0
        total_paid = 0.0
        units_with_balance = 0
        unit_balances = []

        # Process each unit
        for unit in units:
            # Get active tenants for this unit
            tenants = tenant_repository.get_by_unit(unit.unit_id)
            active_tenants = [t for t in tenants if t.status == "active"]
            tenant_count = len(active_tenants)

            # Determine if unit is occupied
            is_occupied = tenant_count > 0
            if is_occupied:
                occupied_units += 1

            # Initialize unit balance info
            unit_balance_info = UnitBalanceInfo(
                unit_id=unit.unit_id,
                unit_name=unit.unit_name,
                occupied=is_occupied,
                tenant_count=tenant_count,
                rent_amount=None,
                total_due=0.0,
                total_paid=0.0,
                balance=0.0,
                has_missing_payments=False,
                missing_payment_count=0,
            )

            # Skip detailed calculations if vacant
            if not is_occupied:
                unit_balances.append(unit_balance_info)
                continue

            # Get leases for this unit
            unit_leases = lease_repository.get_by_unit(unit.unit_id)
            active_leases = [l for l in unit_leases if l.status == "active"]

            # Skip if no active leases
            if not active_leases:
                unit_balances.append(unit_balance_info)
                continue

            # Use the first active lease
            lease = active_leases[0]
            unit_balance_info.rent_amount = lease.rent_amount

            # Calculate months active
            months_active = self.calculate_months_between(lease.start_date, lease.end_date)

            # Calculate rent due
            unit_due = lease.rent_amount * months_active
            unit_balance_info.total_due = unit_due
            total_due += unit_due

            # Get payments for this lease
            lease_payments = payment_repository.get_by_lease(lease.lease_id)
            rent_payments = [p for p in lease_payments if p.payment_type == PaymentType.RENT]
            unit_paid = sum(p.amount for p in rent_payments)
            unit_balance_info.total_paid = unit_paid
            total_paid += unit_paid

            # Calculate balance
            unit_balance = unit_due - unit_paid
            unit_balance_info.balance = unit_balance

            # Check if this unit has a balance
            if unit_balance > 0:
                units_with_balance += 1

            # Check for missing payments
            payment_dicts = [{"payment_date": p.payment_date, "amount": p.amount} for p in rent_payments]
            missing_periods = self.identify_missing_payment_periods(lease.start_date, lease.rent_amount, payment_dicts)

            if missing_periods:
                unit_balance_info.has_missing_payments = True
                unit_balance_info.missing_payment_count = len(missing_periods)

            # Add unit to the list
            unit_balances.append(unit_balance_info)

        # Sort units by balance amount (descending)
        unit_balances.sort(key=lambda u: float(u.balance), reverse=True)

        # Create and return report
        return PropertyBalanceReport(
            property_id=property_obj.id,
            property_name=property_obj.name,
            report_date=date.today(),
            unit_count=unit_count,
            occupied_units=occupied_units,
            total_due=total_due,
            total_paid=total_paid,
            total_balance=total_due - total_paid,
            units_with_balance=units_with_balance,
            unit_balances=unit_balances,
        )

    def generate_all_properties_balance_report(self) -> AllPropertiesBalanceReport:
        """Generate a balance report for all properties.

        Returns:

            AllPropertiesBalanceReport summarizing all properties"""
        # Get all properties
        properties = property_repository.get_all()

        # Initialize counters and totals
        property_count = len(properties)
        total_units = 0
        occupied_units = 0
        total_due = 0.0
        total_paid = 0.0
        property_summaries = []

        # Process each property
        for prop in properties:
            # Get a detailed report for this property
            property_report = self.generate_property_balance_report(prop.id)

            if property_report:
                # Update totals
                total_units += property_report.unit_count
                occupied_units += property_report.occupied_units
                total_due += property_report.total_due
                total_paid += property_report.total_paid

                # Add property summary
                property_summaries.append(
                    {
                        "property_id": prop.id,
                        "name": prop.name,
                        "unit_count": property_report.unit_count,
                        "occupied_units": property_report.occupied_units,
                        "total_due": property_report.total_due,
                        "total_paid": property_report.total_paid,
                        "balance": property_report.total_balance,
                        "units_with_balance": property_report.units_with_balance,
                    }
                )

        # Sort property summaries by balance amount (descending)
        def get_balance_value(prop_summary):
            balance = prop_summary.get("balance", 0)
            if balance is None:
                return 0.0
            try:
                return float(balance)
            except (ValueError, TypeError):
                return 0.0

        property_summaries.sort(key=get_balance_value, reverse=True)

        # Create and return report
        return AllPropertiesBalanceReport(
            report_date=date.today(),
            property_count=property_count,
            total_units=total_units,
            occupied_units=occupied_units,
            total_due=total_due,
            total_paid=total_paid,
            total_balance=total_due - total_paid,
            property_summaries=property_summaries,
        )

    def generate_balance_report(
        self, property_id=None, unit_id=None
    ) -> Union[UnitBalanceReport, PropertyBalanceReport, AllPropertiesBalanceReport, None]:
        """Generate a balance report with flexible filtering.

        Args:

            property_id: Optional property ID to filter by
            unit_id: Optional unit ID to filter by

        Returns:

            A report structure based on the filtering level"""
        if unit_id:
            return self.generate_unit_balance_report(unit_id)
        elif property_id:
            return self.generate_property_balance_report(property_id)
        else:
            return self.generate_all_properties_balance_report()


# Create a singleton instance
report_service = ReportService()
