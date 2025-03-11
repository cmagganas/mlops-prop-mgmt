# Lucid Chart System Architecture Context

## UI

* sign in with email
* see dashboard, where you can look at tenants
  * billing per tenant
    * outstanding balance
    * their payments
  * maintenance requests per property
  * expense tracking per property

## Entity Relationship Diagram

Properties (1) ────┐
                   │
                   ▼
                Units (many)
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
Tenant_History  Tenants (many)  Leases (many)
      │            │            │
      └────────────┘            │
                   │            │
                   └───────┐    │
                           ▼    │
                    Lease_Tenants
                           │    │
                           └────┘
                               │
                               ▼
                          Payments (many)

## Assignments

### Step 1

Entity Relationship Diagram
Decide what actions you want to do to those entities
Payments?
Submit a payment
Can add an image
Edit a payment
Delete a payment?
UI (mockup)
...

Step 2

Decide Gradio or JS

If gradio: do a quick POC

* deploy a gradio app on lambda
* try to add Cogito "Authorization Code Flow" grant type (the login flow with JWTs)

If JS
copy/paste the minecraft PaaS (awscdk-minecraft); get the slimmest version of this running that you possibly can
start to fill it in with your pages / logic
GET /dashboard (no token)
Cognito Hosted UI
Return 301 Redirect: /login
GET /login (no token)

Return 301 Redirect: cognito login page URL
If login successful, redirect back to app
GET /login?token=<the new jwt>

sequenceDiagram```
    participant User
    participant FastAPI
    participant Cognito
    User->>FastAPI: GET /login
    FastAPI->>User: Redirect to Cognito Login
    User->>Cognito: GET /oauth2/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=REDIRECT_URI
    Cognito->>User: Redirect to /callback?code=AUTH_CODE
    User->>FastAPI: GET /callback?code=AUTH_CODE
    FastAPI->>Cognito: POST /oauth2/token (exchange AUTH_CODE)
    Cognito->>FastAPI: {access_token, id_token} (JWTs)
    FastAPI->>User: Set HttpOnly Cookie {id_token} (JWT stored)

    User->>FastAPI: GET /protected (includes Cookie with id_token)
    FastAPI->>Cognito: GET /.well-known/jwks.json (fetch public keys)
    Cognito->>FastAPI: {JWKS Keys}
    FastAPI->>FastAPI: Verify JWT Signature using JWKS
    FastAPI->>FastAPI: Decode JWT, check expiration, verify claims
    FastAPI->>User: Return protected resource if valid
    ``

## Database Tables

### Properties Table
```sql
CREATE TABLE properties (
    property_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);
```

### Units Table
```sql
CREATE TABLE units (
    unit_id UUID PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    property_id UUID NOT NULL,
    description TEXT,
    beds INTEGER,
    baths DECIMAL(3,1),
    sq_ft INTEGER,
    FOREIGN KEY (property_id) REFERENCES properties(property_id)
);
```

### Tenants Table
```sql
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit_id UUID,
    unit_name VARCHAR(100),
    lease_id UUID,
    FOREIGN KEY (unit_id) REFERENCES units(unit_id),
    FOREIGN KEY (lease_id) REFERENCES leases(lease_id)
);
```

### Leases Table
```sql
CREATE TABLE leases (
    lease_id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(property_id),
    FOREIGN KEY (unit_id) REFERENCES units(unit_id)
);
```

### Lease_Tenants Table (Junction table for multiple tenants per lease)
```sql
CREATE TABLE lease_tenants (
    lease_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (lease_id, tenant_id),
    FOREIGN KEY (lease_id) REFERENCES leases(lease_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);
```

### Payments Table
```sql
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY,
    lease_id UUID NOT NULL,
    property_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    FOREIGN KEY (lease_id) REFERENCES leases(lease_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id),
    FOREIGN KEY (unit_id) REFERENCES units(unit_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);
```

### Tenant_History Table (for tracking active and past tenants)
```sql
CREATE TABLE tenant_history (
    unit_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    PRIMARY KEY (unit_id, tenant_id),
    FOREIGN KEY (unit_id) REFERENCES units(unit_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);
```

## Relationship Diagram

```
Properties (1) ────┐
                   │
                   ▼
                Units (many)
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
Tenant_History  Tenants (many)  Leases (many)
      │            │            │
      └────────────┘            │
                   │            │
                   └───────┐    │
                           ▼    │
                    Lease_Tenants
                           │    │
                           └────┘
                               │
                               ▼
                          Payments (many)
```

## Notes on Design

1. I've added a junction table `lease_tenants` to handle the many-to-many relationship between leases and tenants.

2. Created a `tenant_history` table to track active and past tenants instead of embedding lists in the Units table.

3. Added necessary fields to the Payments table like amount and payment_date.

4. All IDs are represented as UUIDs, which is a good practice for distributed systems.

5. The circular reference between Tenants and Leases might need to be resolved depending on your business logic (e.g., a tenant could exist without a lease initially).

This design follows standard relational database principles while preserving all the relationships you specified in your requirements.