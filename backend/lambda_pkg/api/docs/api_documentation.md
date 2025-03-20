# Property Management System API Documentation

## Overview

The Property Management System API provides endpoints for managing properties, units, tenants, leases, payments, and generating financial reports. This documentation outlines the available endpoints, request/response formats, and provides examples for common operations.

## Base URL

```
http://localhost:8000
```

When deployed to production, the base URL will be updated accordingly.

## Authentication

Authentication is handled through API keys. Include your API key in the request header:

```
Authorization: Bearer <your_api_key>
```

## Common Response Codes

| Code | Description |
|------|-------------|
| 200  | Success - The request was successful |
| 201  | Created - A new resource was created |
| 400  | Bad Request - The request was invalid |
| 401  | Unauthorized - Authentication is required |
| 404  | Not Found - The resource does not exist |
| 422  | Validation Error - Request validation failed |
| 500  | Server Error - An error occurred on the server |

## Property Endpoints

### Get All Properties

Retrieves a list of all properties.

**Endpoint:** `GET /properties/`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Sunset Apartments",
    "address": "123 Sunset Blvd",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94107",
    "description": "Modern apartment complex with 20 units"
  }
]
```

### Get Property by ID

Retrieves details for a specific property.

**Endpoint:** `GET /properties/{property_id}`

**Response:**
```json
{
  "id": 1,
  "name": "Sunset Apartments",
  "address": "123 Sunset Blvd",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "description": "Modern apartment complex with 20 units"
}
```

### Create Property

Creates a new property.

**Endpoint:** `POST /properties/`

**Request Body:**
```json
{
  "name": "Sunset Apartments",
  "address": "123 Sunset Blvd",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "description": "Modern apartment complex with 20 units"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Sunset Apartments",
  "address": "123 Sunset Blvd",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "description": "Modern apartment complex with 20 units"
}
```

### Update Property

Updates an existing property.

**Endpoint:** `PUT /properties/{property_id}`

**Request Body:**
```json
{
  "name": "Sunset Luxury Apartments",
  "address": "123 Sunset Blvd",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "description": "Modern luxury apartment complex with 20 units"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Sunset Luxury Apartments",
  "address": "123 Sunset Blvd",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "description": "Modern luxury apartment complex with 20 units"
}
```

### Delete Property

Deletes a property.

**Endpoint:** `DELETE /properties/{property_id}`

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

## Unit Endpoints

### Get All Units

Retrieves a list of all units, optionally filtered by property.

**Endpoint:** `GET /units/`

**Query Parameters:**
- `property_id` (optional): Filter units by property ID

**Response:**
```json
[
  {
    "unit_id": 1,
    "unit_name": "101",
    "property_id": 1,
    "description": "Corner unit with garden view",
    "beds": 2,
    "baths": 1.5,
    "sq_ft": 950
  }
]
```

### Get Unit by ID

Retrieves details for a specific unit.

**Endpoint:** `GET /units/{unit_id}`

**Response:**
```json
{
  "unit_id": 1,
  "unit_name": "101",
  "property_id": 1,
  "description": "Corner unit with garden view",
  "beds": 2,
  "baths": 1.5,
  "sq_ft": 950
}
```

### Create Unit

Creates a new unit.

**Endpoint:** `POST /units/`

**Request Body:**
```json
{
  "unit_name": "101",
  "property_id": 1,
  "description": "Corner unit with garden view",
  "beds": 2,
  "baths": 1.5,
  "sq_ft": 950
}
```

**Response:**
```json
{
  "unit_id": 1,
  "unit_name": "101",
  "property_id": 1,
  "description": "Corner unit with garden view",
  "beds": 2,
  "baths": 1.5,
  "sq_ft": 950
}
```

## Tenant Endpoints

### Get All Tenants

Retrieves a list of all tenants, optionally filtered by unit.

**Endpoint:** `GET /tenants/`

**Query Parameters:**
- `unit_id` (optional): Filter tenants by unit ID

**Response:**
```json
[
  {
    "tenant_id": 1,
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "555-123-4567",
    "unit_id": 1,
    "status": "active"
  }
]
```

### Get Tenant by ID

Retrieves details for a specific tenant.

**Endpoint:** `GET /tenants/{tenant_id}`

**Response:**
```json
{
  "tenant_id": 1,
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "555-123-4567",
  "unit_id": 1,
  "status": "active"
}
```

## Lease Endpoints

### Get All Leases

Retrieves a list of all leases, optionally filtered by various parameters.

**Endpoint:** `GET /leases/`

**Query Parameters:**
- `unit_id` (optional): Filter leases by unit ID
- `tenant_id` (optional): Filter leases by tenant ID
- `status` (optional): Filter leases by status (active, expired, terminated)

**Response:**
```json
[
  {
    "lease_id": 1,
    "unit_id": 1,
    "tenant_ids": [1, 2],
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "rent_amount": 1500.00,
    "security_deposit": 1500.00,
    "status": "active"
  }
]
```

## Payment Endpoints

### Get All Payments

Retrieves a list of all payments, optionally filtered by various parameters.

**Endpoint:** `GET /payments/`

**Query Parameters:**
- `tenant_id` (optional): Filter payments by tenant ID
- `lease_id` (optional): Filter payments by lease ID
- `payment_type` (optional): Filter payments by type (rent, security_deposit, late_fee, etc.)

**Response:**
```json
[
  {
    "payment_id": 1,
    "tenant_id": 1,
    "lease_id": 1,
    "payment_date": "2023-01-05",
    "amount": 1500.00,
    "payment_method": "check",
    "payment_type": "rent",
    "memo": "January 2023 rent",
    "reference_number": "1234",
    "receipt_image_url": "https://example.com/receipts/1234.jpg"
  }
]
```

### Create Payment

Creates a new payment.

**Endpoint:** `POST /payments/`

**Request Body:**
```json
{
  "tenant_id": 1,
  "lease_id": 1,
  "payment_date": "2023-01-05",
  "amount": 1500.00,
  "payment_method": "check",
  "payment_type": "rent",
  "memo": "January 2023 rent",
  "reference_number": "1234"
}
```

**Response:**
```json
{
  "payment_id": 1,
  "tenant_id": 1,
  "lease_id": 1,
  "payment_date": "2023-01-05",
  "amount": 1500.00,
  "payment_method": "check",
  "payment_type": "rent",
  "memo": "January 2023 rent",
  "reference_number": "1234",
  "receipt_image_url": null
}
```

## Report Endpoints

### Generate Balance Report

Generates a financial balance report at different levels of detail.

**Endpoint:** `GET /reports/balance`

**Query Parameters:**
- `property_id` (optional): Generate report for a specific property
- `unit_id` (optional): Generate report for a specific unit

**Response for Property-level Report:**
```json
{
  "property_id": 1,
  "property_name": "Sunset Apartments",
  "report_date": "2023-05-15",
  "unit_count": 20,
  "occupied_units": 18,
  "total_due": 27000.00,
  "total_paid": 25500.00,
  "total_balance": 1500.00,
  "units_with_balance": 3,
  "unit_balances": [
    {
      "unit_id": 5,
      "unit_name": "105",
      "occupied": true,
      "tenant_count": 2,
      "rent_amount": 1500.00,
      "total_due": 1500.00,
      "total_paid": 750.00,
      "balance": 750.00,
      "has_missing_payments": true,
      "missing_payment_count": 1
    }
  ]
}
```

## HTML Report Viewer

The system also provides a user-friendly HTML interface for viewing financial reports.

**Endpoint:** `/report-viewer/`

This interface allows you to:
- View financial summaries for all properties
- See detailed financial information for specific properties or units
- View payment history and balance information for specific tenants

## Error Handling

All API endpoints follow consistent error handling patterns. Error responses include a meaningful message that helps diagnose the issue.

Example error response:

```json
{
  "detail": "Property with ID 999 not found"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Clients are limited to 100 requests per minute. If you exceed this limit, you'll receive a 429 Too Many Requests response.

## API Versioning

The current API version is v1. All endpoints are accessible under the `/v1/` prefix.

For example:
```
GET /v1/properties/
```

Future versions of the API will use different prefixes (e.g., `/v2/`).

## Additional Resources

- [OpenAPI Documentation](/docs) - Interactive API documentation
- [GitHub Repository](https://github.com/cmagganas/mlops-prop-mgmt) - Source code and issue tracking
