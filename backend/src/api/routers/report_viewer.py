"""HTML Report Viewer Module.

This module provides HTML-based visualization of report data."""

import os
import pathlib

import jinja2
from fastapi import (
    APIRouter,
    HTTPException,
    Path,
    Request,
)
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from ..db.report import report_service

# Check if running in AWS Lambda
is_lambda = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None

# Create the templates directory - use /tmp in Lambda environment
file_path = pathlib.Path(__file__)
if is_lambda:
    templates_dir = pathlib.Path("/tmp/templates")
else:
    templates_dir = file_path.parent.parent / "templates"

os.makedirs(templates_dir, exist_ok=True)

# Path to the report template
report_template_path = templates_dir / "report.html"

# Create a basic HTML template for reports
report_template = """<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .report-header {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 5px solid #007bff;
        }
        .card {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        .summary-row {
            display: flex;
            margin-bottom: 10px;
        }
        .summary-label {
            font-weight: bold;
            width: 200px;
        }
        .balance-positive {
            color: green;
        }
        .balance-negative {
            color: red;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .report-nav {
            margin-bottom: 20px;
        }
        .report-nav a {
            display: inline-block;
            margin-right: 10px;
            padding: 8px 15px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        .report-nav a:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="report-nav">
        <a href="{{ base_url }}/report-viewer/">Reports Home</a>
        <a href="{{ base_url }}/report-viewer/property">All Properties</a>
        <a href="{{ base_url }}/report-viewer/property/1">Property #1</a>
        <a href="{{ base_url }}/report-viewer/unit/1">Unit #1</a>
        <a href="{{ base_url }}/report-viewer/tenant/1">Tenant #1</a>
    </div>

    <div class="report-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
    </div>

    {{ content | safe }}
</body>
</html>"""

# Create Jinja2Templates instance
try:
    # First try to write the template file if it doesn't exist
    if not report_template_path.exists():
        with open(report_template_path, "w") as f:
            f.write(report_template)

    # Initialize with the directory
    templates = Jinja2Templates(directory=str(templates_dir))

except (OSError, IOError) as e:
    # Fallback to in-memory template if file writing fails
    print(f"Warning: Could not write template file: {e}")
    print("Using in-memory template loader as fallback")

    # Create an in-memory loader
    loader = jinja2.DictLoader({"report.html": report_template})

    # Create a custom Jinja2Templates instance with the in-memory loader
    templates = Jinja2Templates(directory=str(templates_dir))
    templates.env.loader = loader

router = APIRouter(
    prefix="/report-viewer",
    tags=["report-viewer"],
)


def format_currency(amount):
    """Format an amount as currency."""
    if amount is None:
        return "$0.00"
    return "${float(amount):,.2f}"


def get_base_url():
    """Get the base URL for API Gateway stage if in AWS Lambda environment."""
    if is_lambda:
        # When deployed to AWS Lambda with API Gateway, include the stage name
        return "/prod"
    return ""


def render_tenant_report(report):
    """Render a tenant report as HTML."""
    get_base_url()
    html = "<div class='card'>"
    html += "<h2>Tenant Information</h2>"
    html += f"<div class='summary-row'><span class='summary-label'>Tenant Name:</span> {report['tenant_name']}</div>"
    html += f"<div class='summary-row'><span class='summary-label'>Tenant ID:</span> {report['tenant_id']}</div>"
    html += f"<div class='summary-row'><span class='summary-label'>Unit ID:</span> {report['unit_id']}</div>"
    html += "</div>"

    if report.get("lease_summary"):
        lease = report["lease_summary"]
        html += "<div class='card'>"
        html += "<h2>Lease Summary</h2>"
        html += f"<div class='summary-row'><span class='summary-label'>Lease ID:</span> {lease['lease_id']}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Rent Amount:</span> {format_currency(lease['rent_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Start Date:</span> {lease['start_date']}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>End Date:</span> {lease['end_date']}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Months Active:</span> {lease['months_active']}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Total Rent Due:</span> {format_currency(lease['total_rent_due'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Total Paid:</span> {format_currency(lease['total_paid'])}</div>"

        balance_class = "balance-positive" if lease["balance"] <= 0 else "balance-negative"
        html += f"<div class='summary-row'><span class='summary-label'>Balance:</span> <span class='{balance_class}'>{format_currency(lease['balance'])}</span></div>"
        html += "</div>"

    if report.get("payment_summary"):
        payment = report["payment_summary"]
        html += "<div class='card'>"
        html += "<h2>Payment Summary</h2>"
        html += (
            f"<div class='summary-row'><span class='summary-label'>Number of Payments:</span> {payment['count']}</div>"
        )
        html += f"<div class='summary-row'><span class='summary-label'>Total Amount:</span> {format_currency(payment['total_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Rent Amount:</span> {format_currency(payment['rent_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Security Deposit:</span> {format_currency(payment['security_deposit_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Late Fees:</span> {format_currency(payment['late_fee_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Utilities:</span> {format_currency(payment['utility_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Maintenance:</span> {format_currency(payment['maintenance_amount'])}</div>"
        html += f"<div class='summary-row'><span class='summary-label'>Other:</span> {format_currency(payment['other_amount'])}</div>"
        html += "</div>"

    return html


def render_unit_report(report):
    """Render a unit report as HTML."""
    get_base_url()
    html = "<div class='card'>"
    html += "<h2>Unit Information</h2>"
    html += f"<div class='summary-row'><span class='summary-label'>Unit Name:</span> {report['unit_name']}</div>"
    html += f"<div class='summary-row'><span class='summary-label'>Unit ID:</span> {report['unit_id']}</div>"
    html += (
        f"<div class='summary-row'><span class='summary-label'>Property Name:</span> {report['property_name']}</div>"
    )
    html += f"<div class='summary-row'><span class='summary-label'>Property ID:</span> {report['property_id']}</div>"
    html += f"<div class='summary-row'><span class='summary-label'>Status:</span> {report['status']}</div>"
    html += "</div>"

    if report.get("tenants"):
        html += "<div class='card'>"
        html += "<h2>Tenant Information</h2>"
        html += "<table>"
        html += "<tr><th>Tenant ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr>"
        for tenant in report["tenants"]:
            html += "<tr>"
            html += f"<td>{tenant['tenant_id']}</td>"
            html += f"<td>{tenant['name']}</td>"
            html += f"<td>{tenant['email']}</td>"
            html += f"<td>{tenant['phone']}</td>"
            html += f"<td>{tenant['status']}</td>"
            html += "</tr>"
        html += "</table>"
        html += "</div>"

    # Financial Summary
    html += "<div class='card'>"
    html += "<h2>Financial Summary</h2>"
    if report.get("rent_amount"):
        html += f"<div class='summary-row'><span class='summary-label'>Rent Amount:</span> {format_currency(report['rent_amount'])}</div>"
    if report.get("lease_start_date"):
        html += f"<div class='summary-row'><span class='summary-label'>Lease Start Date:</span> {report['lease_start_date']}</div>"
    if report.get("lease_end_date"):
        html += f"<div class='summary-row'><span class='summary-label'>Lease End Date:</span> {report['lease_end_date']}</div>"
    if report.get("total_due"):
        html += f"<div class='summary-row'><span class='summary-label'>Total Due:</span> {format_currency(report['total_due'])}</div>"
    if report.get("total_paid"):
        html += f"<div class='summary-row'><span class='summary-label'>Total Paid:</span> {format_currency(report['total_paid'])}</div>"

    if report.get("balance") is not None:
        balance_class = "balance-positive" if report["balance"] <= 0 else "balance-negative"
        html += f"<div class='summary-row'><span class='summary-label'>Balance:</span> <span class='{balance_class}'>{format_currency(report['balance'])}</span></div>"
    html += "</div>"

    # Payment History
    if report.get("payment_history"):
        html += "<div class='card'>"
        html += "<h2>Payment History</h2>"
        html += "<table>"
        html += "<tr><th>Payment ID</th><th>Date</th><th>Amount</th><th>Method</th></tr>"
        for payment in report["payment_history"]:
            html += "<tr>"
            html += f"<td>{payment['payment_id']}</td>"
            html += f"<td>{payment['date']}</td>"
            html += f"<td>{format_currency(payment['amount'])}</td>"
            html += f"<td>{payment['method']}</td>"
            html += "</tr>"
        html += "</table>"
        html += "</div>"

    # Missing Periods
    if report.get("missing_periods"):
        html += "<div class='card'>"
        html += "<h2>Missing Payment Periods</h2>"
        html += "<table>"
        html += "<tr><th>Year</th><th>Month</th><th>Amount Due</th></tr>"
        for period in report["missing_periods"]:
            html += "<tr>"
            html += f"<td>{period['year']}</td>"
            html += f"<td>{period['month_name']}</td>"
            html += f"<td>{format_currency(period['amount_due'])}</td>"
            html += "</tr>"
        html += "</table>"
        html += "</div>"

    return html


def render_property_report(report):
    """Render a property report as HTML."""
    base_url = get_base_url()
    html = "<div class='card'>"
    html += "<h2>Property Information</h2>"
    html += (
        f"<div class='summary-row'><span class='summary-label'>Property Name:</span> {report['property_name']}</div>"
    )
    html += f"<div class='summary-row'><span class='summary-label'>Property ID:</span> {report['property_id']}</div>"
    if report.get("report_date"):
        html += (
            f"<div class='summary-row'><span class='summary-label'>Report Date:</span> {report['report_date']}</div>"
        )
    html += f"<div class='summary-row'><span class='summary-label'>Unit Count:</span> {report['unit_count']}</div>"
    html += (
        f"<div class='summary-row'><span class='summary-label'>Occupied Units:</span> {report['occupied_units']}</div>"
    )
    html += "</div>"

    # Financial Summary
    html += "<div class='card'>"
    html += "<h2>Financial Summary</h2>"
    html += f"<div class='summary-row'><span class='summary-label'>Total Due:</span> {format_currency(report['total_due'])}</div>"
    html += f"<div class='summary-row'><span class='summary-label'>Total Paid:</span> {format_currency(report['total_paid'])}</div>"

    balance_class = "balance-positive" if report["total_balance"] <= 0 else "balance-negative"
    html += f"<div class='summary-row'><span class='summary-label'>Total Balance:</span> <span class='{balance_class}'>{format_currency(report['total_balance'])}</span></div>"

    if "units_with_balance" in report:
        html += f"<div class='summary-row'><span class='summary-label'>Units with Balance:</span> {report['units_with_balance']}</div>"
    html += "</div>"

    # Unit Balances
    if report.get("unit_balances"):
        html += "<div class='card'>"
        html += "<h2>Unit Balances</h2>"
        html += "<table>"
        html += "<tr><th>Unit</th><th>Occupied</th><th>Tenants</th><th>Rent</th><th>Total Due</th><th>Total Paid</th><th>Balance</th><th>Missing Payments</th></tr>"
        for unit in report["unit_balances"]:
            balance_class = "balance-positive" if unit["balance"] <= 0 else "balance-negative"
            html += "<tr>"
            html += f"<td><a href='{base_url}/report-viewer/unit/{unit['unit_id']}'>{unit['unit_name']}</a></td>"
            html += f"<td>{'Yes' if unit['occupied'] else 'No'}</td>"
            html += f"<td>{unit['tenant_count']}</td>"
            html += f"<td>{format_currency(unit['rent_amount'])}</td>"
            html += f"<td>{format_currency(unit['total_due'])}</td>"
            html += f"<td>{format_currency(unit['total_paid'])}</td>"
            html += f"<td class='{balance_class}'>{format_currency(unit['balance'])}</td>"
            html += f"<td>{unit['missing_payment_count'] if unit['has_missing_payments'] else '0'}</td>"
            html += "</tr>"
        html += "</table>"
        html += "</div>"

    return html


def render_all_properties_report(report):
    """Render an all properties report as HTML."""
    base_url = get_base_url()
    html = "<div class='card'>"
    html += "<h2>All Properties Summary</h2>"
    html += f"<div class='summary-row'><span class='summary-label'>Report Date:</span> {report['report_date']}</div>"
    html += (
        f"<div class='summary-row'><span class='summary-label'>Property Count:</span> {report['property_count']}</div>"
    )
    html += f"<div class='summary-row'><span class='summary-label'>Total Units:</span> {report['total_units']}</div>"
    html += (
        f"<div class='summary-row'><span class='summary-label'>Occupied Units:</span> {report['occupied_units']}</div>"
    )
    html += "</div>"

    # Financial Summary
    html += "<div class='card'>"
    html += "<h2>Financial Summary</h2>"
    html += f"<div class='summary-row'><span class='summary-label'>Total Due:</span> {format_currency(report['total_due'])}</div>"
    html += f"<div class='summary-row'><span class='summary-label'>Total Paid:</span> {format_currency(report['total_paid'])}</div>"

    balance_class = "balance-positive" if report["total_balance"] <= 0 else "balance-negative"
    html += f"<div class='summary-row'><span class='summary-label'>Total Balance:</span> <span class='{balance_class}'>{format_currency(report['total_balance'])}</span></div>"
    html += "</div>"

    # Property Summaries
    if report.get("property_summaries"):
        html += "<div class='card'>"
        html += "<h2>Property Summaries</h2>"
        html += "<table>"
        html += "<tr><th>Property</th><th>Units</th><th>Occupied</th><th>Total Due</th><th>Total Paid</th><th>Balance</th><th>Units with Balance</th></tr>"
        for prop in report["property_summaries"]:
            balance_class = "balance-positive" if prop["balance"] <= 0 else "balance-negative"
            html += "<tr>"
            html += f"<td><a href='{base_url}/report-viewer/property/{prop['property_id']}'>{prop['name']}</a></td>"
            html += f"<td>{prop['unit_count']}</td>"
            html += f"<td>{prop['occupied_units']}</td>"
            html += f"<td>{format_currency(prop['total_due'])}</td>"
            html += f"<td>{format_currency(prop['total_paid'])}</td>"
            html += f"<td class='{balance_class}'>{format_currency(prop['balance'])}</td>"
            html += f"<td>{prop['units_with_balance']}</td>"
            html += "</tr>"
        html += "</table>"
        html += "</div>"

    return html


@router.get("/", response_class=HTMLResponse)
async def report_viewer_home(request: Request):
    """Display the report viewer home page."""
    base_url = get_base_url()
    content = f"""<div class="card">.
        <h2>Property Management Report Viewer</h2>
        <p>Select a report type from the options below:</p>

        <h3>Available Reports</h3>
        <ul>
            <li><a href="{base_url}/report-viewer/property">All Properties Balance Report</a></li>
            <li><a href="{base_url}/report-viewer/property/1">Property #1 Balance Report</a></li>
            <li><a href="{base_url}/report-viewer/unit/1">Unit #1 Balance Report</a></li>
            <li><a href="{base_url}/report-viewer/tenant/1">Tenant #1 Balance Report</a></li>
        </ul>
    </div>"""

    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "title": "Property Management Reports",
            "description": "View financial reports for properties, units, and tenants",
            "content": content,
            "base_url": base_url,
        },
    )


@router.get("/tenant/{tenant_id}", response_class=HTMLResponse)
async def view_tenant_report(request: Request, tenant_id: int = Path(...)):
    """Display an HTML report for a tenant.

    Args:

        tenant_id: The ID of the tenant to generate a report for"""
    base_url = get_base_url()
    report = report_service.generate_tenant_balance_report(tenant_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Convert to dict for rendering
    report_dict = report.model_dump()

    # Render the report as HTML
    content = render_tenant_report(report_dict)

    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "title": f"Tenant Balance Report: {report_dict['tenant_name']}",
            "description": f"Financial report for tenant ID {tenant_id}",
            "content": content,
            "base_url": base_url,
        },
    )


@router.get("/unit/{unit_id}", response_class=HTMLResponse)
async def view_unit_report(request: Request, unit_id: int = Path(...)):
    """Display an HTML report for a unit.

    Args:

        unit_id: The ID of the unit to generate a report for"""
    base_url = get_base_url()
    report = report_service.generate_unit_balance_report(unit_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Unit not found")

    # Convert to dict for rendering
    report_dict = report.model_dump()

    # Render the report as HTML
    content = render_unit_report(report_dict)

    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "title": f"Unit Balance Report: {report_dict['unit_name']}",
            "description": f"Financial report for unit ID {unit_id}",
            "content": content,
            "base_url": base_url,
        },
    )


@router.get("/property/{property_id}", response_class=HTMLResponse)
async def view_property_report(request: Request, property_id: int = Path(...)):
    """Display an HTML report for a property.

    Args:

        property_id: The ID of the property to generate a report for"""
    base_url = get_base_url()
    report = report_service.generate_property_balance_report(property_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Property not found")

    # Convert to dict for rendering
    report_dict = report.model_dump()

    # Render the report as HTML
    content = render_property_report(report_dict)

    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "title": f"Property Balance Report: {report_dict['property_name']}",
            "description": f"Financial report for property ID {property_id}",
            "content": content,
            "base_url": base_url,
        },
    )


@router.get("/property", response_class=HTMLResponse)
async def view_all_properties_report(request: Request):
    """Display an HTML report for all properties."""
    base_url = get_base_url()
    report = report_service.generate_all_properties_balance_report()

    # Convert to dict for rendering
    report_dict = report.model_dump()

    # Render the report as HTML
    content = render_all_properties_report(report_dict)

    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "title": "All Properties Balance Report",
            "description": "Financial summary for all properties",
            "content": content,
            "base_url": base_url,
        },
    )
