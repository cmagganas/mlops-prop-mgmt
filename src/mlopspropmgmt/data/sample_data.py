"""Sample data for development and demo purposes.

This module contains sample data that can be used by various repositories.
Data is structured by entity type and can be loaded when initializing repositories.
"""

from datetime import (
    date,
    datetime,
    timedelta,
)
from typing import (
    Dict,
    List,
)

# Sample properties
SAMPLE_PROPERTIES = [
    {
        "id": 1,
        "name": "Sunset Apartments",
        "address": "123 Sunset Blvd",
        "city": "Los Angeles",
        "state": "CA",
        "zip_code": "90001",
    },
    {
        "id": 2,
        "name": "Ocean View Condos",
        "address": "456 Beach Ave",
        "city": "San Diego",
        "state": "CA",
        "zip_code": "92101",
    },
]

# Sample units
SAMPLE_UNITS = [
    {
        "unit_id": 1,
        "property_id": 1,
        "unit_name": "101",
        "bedrooms": 2,
        "bathrooms": 1,
        "square_feet": 850,
        "monthly_rent": 1200,
    },
    {
        "unit_id": 2,
        "property_id": 1,
        "unit_name": "102",
        "bedrooms": 1,
        "bathrooms": 1,
        "square_feet": 650,
        "monthly_rent": 1000,
    },
    {
        "unit_id": 3,
        "property_id": 2,
        "unit_name": "201",
        "bedrooms": 3,
        "bathrooms": 2,
        "square_feet": 1200,
        "monthly_rent": 1500,
    },
]

# Sample tenants
SAMPLE_TENANTS = [
    {
        "tenant_id": 1,
        "name": "John Smith",
        "email": "john.smith@example.com",
        "phone": "555-123-4567",
        "unit_id": 1,
        "status": "active",
    },
    {
        "tenant_id": 2,
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "555-987-6543",
        "unit_id": 2,
        "status": "active",
    },
    {
        "tenant_id": 3,
        "name": "Bob Johnson",
        "email": "bob.johnson@example.com",
        "phone": "555-321-7654",
        "unit_id": 3,
        "status": "active",
    },
]

# Sample leases
SAMPLE_LEASES = [
    {
        "lease_id": 1,
        "unit_id": 1,
        "tenant_ids": [1],
        "start_date": date(2023, 1, 1),
        "end_date": date(2024, 1, 1),
        "rent_amount": 1200.0,
        "security_deposit": 1200.0,
        "status": "active",
    },
    {
        "lease_id": 2,
        "unit_id": 2,
        "tenant_ids": [2],
        "start_date": date(2023, 2, 1),
        "end_date": date(2024, 2, 1),
        "rent_amount": 1000.0,
        "security_deposit": 1000.0,
        "status": "active",
    },
    {
        "lease_id": 3,
        "unit_id": 3,
        "tenant_ids": [3],
        "start_date": date(2023, 3, 1),
        "end_date": date(2024, 3, 1),
        "rent_amount": 1500.0,
        "security_deposit": 1500.0,
        "status": "active",
    },
]

# Sample payments
SAMPLE_PAYMENTS = [
    {
        "payment_id": 1,
        "tenant_id": 1,
        "unit_id": 1,
        "lease_id": 1,
        "payment_date": date(2023, 1, 5),
        "amount": 1200.0,
        "payment_method": "check",
        "payment_type": "rent",
        "notes": "First month's rent",
    },
    {
        "payment_id": 2,
        "tenant_id": 2,
        "unit_id": 2,
        "lease_id": 2,
        "payment_date": date(2023, 2, 3),
        "amount": 1000.0,
        "payment_method": "bank_transfer",
        "payment_type": "rent",
        "notes": "First month's rent",
    },
    {
        "payment_id": 3,
        "tenant_id": 3,
        "unit_id": 3,
        "lease_id": 3,
        "payment_date": date(2023, 3, 2),
        "amount": 1500.0,
        "payment_method": "credit_card",
        "payment_type": "rent",
        "notes": "First month's rent",
    },
]

# Create a dictionary of all sample data for easy access
SAMPLE_DATA = {
    "properties": SAMPLE_PROPERTIES,
    "units": SAMPLE_UNITS,
    "tenants": SAMPLE_TENANTS,
    "leases": SAMPLE_LEASES,
    "payments": SAMPLE_PAYMENTS,
}


def get_sample_data(entity_type: str) -> List[Dict]:
    """Get sample data for a specific entity type.

    Args:
        entity_type: The type of entity to get data for (properties, units, tenants, leases, payments)

    Returns:
        A list of dictionaries containing sample data for the specified entity type
    """
    return SAMPLE_DATA.get(entity_type, [])
