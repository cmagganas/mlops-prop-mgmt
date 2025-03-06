# Project Overview
You are building a property management platform for a small family business for rental units in multifamily residential buildings. The platform should have role based access control with username (email) and password (forgot password goes to email). Admin accounts control all things, managers can add info and make changes, assistants can only add information and have limited visibility of information and properties. No tenant/renter portal access at this time.

(Ideally things the solo dev understands well and easy to maintain)
Stack:
- Python (business logic)
- FastAPI
- Frontend: NextJS 14, shadcn, tailwind, Lucid Icon https://youtu.be/2PjmPU07KNs?feature=shared&t=243
- Alternate Frontend: Flask

# Core Functionalities

* Upload one/many rental deposit transactions
   * Transaction should include [tenant, unit, property, date, amount, term, type]
* Table of Properties
* Table of Owners/Admin
* Table of Tenants:
   * [name, contact_info, type (past, present future), unit, property]
* Tables for each property which includes rows with:
   * [unit, property, occupancy_status, tenants, lease_term, rent_amount, type]
* Expense tracker, upload expenses and assign to each property
   * [date, type, payee, memo, category, property, amount]
* Reports:
   * RentalTracker: balance of all tenants by property, filter by property and balance (past due over threshold e.g. > 1 month or $X)
   * ExpenseTracker: expenses filtered by [property, payee, category, year, month]
   * TaskTracker: kanban and/or calendar or tasks to do
     [task, type, property, assigned_to, due_date, status]

# Feature Details

## Feature 1: Tenant Balance System

### Data Structures
- **Tenant profile**
  - Name
  - Contact information
  - Tenant ID

- **Unit association**
  - Which unit tenant occupies
  - Unit identifier

- **Property association**
  - Which property contains the unit
  - Property identifier

### Financial Tracking
- **Payment records**
  - Amount
  - Date
  - Payment method
  - Receipt number

- **Charge records**
  - Amount
  - Date
  - Description
  - Due date

- **Balance calculation**
  - Formula: Paid - Owed
  - Example: $1000 Jan paid - $1000 Jan owed - $1000 Feb owed = $1000 total owed

### Relationships
- **Tenant to unit mapping**
- **Unit to property mapping**

### Platform Purpose
- Internal tool for business partners
- Centralize information to replace manual spreadsheets
- Admin-only access (not tenant-facing)

### Core Functionality
- Searchable database of linked information
  - Tenants, units, property info

## Feature 2: Centralized Property and Tenant Information

### Property Data Structure
- **Property Details**
  - Property ID (primary key)
  - Address (street, city, state, zip)
  - Acquisition date
  - Purchase price
  - Current valuation
  - Property type (single family, multi-family, commercial)
  - Year built
  - Square footage
  - Notes/description

- **Unit Details**
  - Unit ID (primary key)
  - Property ID (foreign key)
  - Unit number/identifier
  - Bedrooms
  - Bathrooms
  - Square footage
  - Monthly rent amount
  - Status (occupied, vacant, maintenance)
  - Amenities
  - Notes

### Tenant Data Structure (Extended)
- **Tenant Details**
  - Tenant ID (primary key)
  - Unit ID (foreign key)
  - First name
  - Last name
  - Email
  - Phone number
  - Emergency contact
  - Lease start date
  - Lease end date
  - Security deposit amount
  - Pet information
  - Vehicle information
  - Status (active, former, eviction)
  - Notes

### Relationships
- One property has many units (1:N)
- One unit has one or more tenants (1:N)

## Feature 3: Rent Lease Creation

### Lease Template Data Structure
- **Template**
  - Template ID
  - Template name
  - Template version
  - Created date
  - Last modified date
  - Default content (formatted text)

### Lease Data Structure
- **Lease**
  - Lease ID (primary key)
  - Template ID (foreign key)
  - Unit ID (foreign key)
  - Tenant ID (foreign key)
  - Start date
  - End date
  - Monthly rent amount
  - Security deposit
  - Late fee terms
  - Pet policy
  - Other terms
  - Signatures (tenant, landlord)
  - Date signed
  - Status (draft, active, expired, terminated)
  - Generated document reference/link

### Lease Generation Functionality
- Variable field replacement (tenant name, unit, dates, rent amount)
- Document storage/retrieval
- Version tracking
- Signature tracking

# Authentication Flow

```
sequenceDiagram
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
``` 