"""Unit tests for report service functionality."""

import datetime
from unittest.mock import (
    MagicMock,
    patch,
)

import pytest

from backend.app.db.report import ReportService
from backend.app.models.payment import PaymentType
from backend.app.models.report import MissingPaymentPeriod


@pytest.fixture
def report_service():
    """Create a report service instance for testing."""
    return ReportService()


def test_get_month_name(report_service):
    """Test get_month_name returns correct month names."""
    assert report_service.get_month_name(1) == "January"
    assert report_service.get_month_name(12) == "December"


def test_calculate_months_between(report_service):
    """Test calculate_months_between returns correct month count."""
    # Testing with fixed dates
    start_date = datetime.date(2022, 1, 15)
    end_date = datetime.date(2022, 7, 15)

    # Should be 7 months (Jan 15 - Jul 15, inclusive of both months)
    assert report_service.calculate_months_between(start_date, end_date) == 7

    # Test with future end date (should use today's date)
    with patch("backend.app.db.report.date") as mock_date:
        mock_date.today.return_value = datetime.date(2022, 3, 15)
        # Should calculate from Jan 15 to Mar 15 (3 months)
        assert report_service.calculate_months_between(start_date, datetime.date(2023, 1, 1)) == 3

    # Test with future start date (should return 0)
    with patch("backend.app.db.report.date") as mock_date:
        mock_date.today.return_value = datetime.date(2022, 1, 1)
        future_start = datetime.date(2022, 2, 1)
        assert report_service.calculate_months_between(future_start, end_date) == 0


def test_identify_missing_payment_periods(report_service):
    """Test identify_missing_payment_periods identifies correct missing months."""
    # Mock today's date to have consistent test results
    with patch("backend.app.db.report.date") as mock_date:
        mock_date.today.return_value = datetime.date(2023, 3, 15)

        # Create a lease starting 3 months ago
        lease_start = datetime.date(2023, 1, 1)
        monthly_rent = 1000.0

        # Scenario 1: No payments made at all
        payments = []
        missing = report_service.identify_missing_payment_periods(lease_start, monthly_rent, payments)

        # Should have missing payments for Jan, Feb, and March
        assert len(missing) == 3
        assert any(period.month == 1 and period.year == 2023 for period in missing)
        assert any(period.month == 2 and period.year == 2023 for period in missing)
        assert any(period.month == 3 and period.year == 2023 for period in missing)

        # Scenario 2: Only February paid
        payments = [{"payment_date": datetime.date(2023, 2, 15), "amount": 1000.0}]
        missing = report_service.identify_missing_payment_periods(lease_start, monthly_rent, payments)

        # Should have missing payments for Jan and March
        assert len(missing) == 2
        assert any(period.month == 1 and period.year == 2023 for period in missing)
        assert any(period.month == 3 and period.year == 2023 for period in missing)

        # Verify the missing payment structure
        for period in missing:
            assert isinstance(period, MissingPaymentPeriod)
            assert period.amount_due == monthly_rent
            assert period.month_name in ["January", "March"]


@patch("backend.app.db.report.tenant_repository")
@patch("backend.app.db.report.unit_repository")
@patch("backend.app.db.report.lease_repository")
@patch("backend.app.db.report.payment_repository")
def test_generate_tenant_balance_report(
    mock_payment_repo, mock_lease_repo, mock_unit_repo, mock_tenant_repo, report_service
):
    """Test generate_tenant_balance_report with mocked repositories."""
    # Create mock tenant
    mock_tenant = MagicMock()
    mock_tenant.tenant_id = 1
    mock_tenant.name = "John Doe"
    mock_tenant.unit_id = 101

    # Create mock unit
    mock_unit = MagicMock()
    mock_unit.unit_id = 101
    mock_unit.property_id = 201

    # Create mock lease
    mock_lease = MagicMock()
    mock_lease.lease_id = 301
    mock_lease.rent_amount = 1000.0
    mock_lease.start_date = datetime.date(2023, 1, 1)
    mock_lease.end_date = datetime.date(2023, 12, 31)
    mock_lease.status = "active"

    # Create mock payments
    mock_payment1 = MagicMock()
    mock_payment1.payment_id = 401
    mock_payment1.amount = 1000.0
    mock_payment1.lease_id = 301
    mock_payment1.payment_type = PaymentType.RENT

    mock_payment2 = MagicMock()
    mock_payment2.payment_id = 402
    mock_payment2.amount = 500.0
    mock_payment2.lease_id = 301
    mock_payment2.payment_type = PaymentType.SECURITY_DEPOSIT

    # Setup repository mocks
    mock_tenant_repo.get_by_id.return_value = mock_tenant
    mock_unit_repo.get_by_id.return_value = mock_unit
    mock_lease_repo.get_by_tenant.return_value = [mock_lease]
    mock_payment_repo.get_by_tenant.return_value = [mock_payment1, mock_payment2]

    # Test with valid tenant ID
    with patch.object(report_service, "calculate_months_between", return_value=3):
        report = report_service.generate_tenant_balance_report(1)

        # Verify report contents
        assert report is not None
        assert report.tenant_id == 1
        assert report.tenant_name == "John Doe"
        assert report.unit_id == 101
        assert report.property_id == 201

        # Verify payment summary
        assert report.payment_summary.count == 2
        assert report.payment_summary.total_amount == 1500.0
        assert report.payment_summary.rent_amount == 1000.0
        assert report.payment_summary.security_deposit_amount == 500.0

        # Verify lease summary
        assert report.lease_summary is not None
        assert report.lease_summary.lease_id == 301
        assert report.lease_summary.rent_amount == 1000.0
        assert report.lease_summary.total_rent_due == 3000.0  # 3 months * $1000
        assert report.lease_summary.total_paid == 1000.0
        assert report.lease_summary.balance == 2000.0  # $3000 due - $1000 paid

    # Test with non-existent tenant ID
    mock_tenant_repo.get_by_id.return_value = None
    report = report_service.generate_tenant_balance_report(999)
    assert report is None
