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
CREATE TABLE properties (property_id UUID PRIMARY KEY,
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
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    reference_number VARCHAR,
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

## FastAPI CRUD Endpoints for Property Management System

Here's the skeleton FastAPI code for implementing CRUD operations for your property management tables. I'll keep it minimal and focus on the core functionality.

### 1. Database Setup (`database.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./property_management.db"
    
    model_config = {"env_file": ".env"}

settings = Settings()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for DB sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 2. Models (`models.py`)

```python
from sqlalchemy import Column, ForeignKey, String, Integer, Float, Date, Boolean, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from uuid import uuid4

from .database import Base

# Junction table for lease-tenant relationship
lease_tenants = Table(
    "lease_tenants",
    Base.metadata,
    Column("lease_id", UUID(as_uuid=True), ForeignKey("leases.lease_id"), primary_key=True),
    Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), primary_key=True)
)

class Property(Base):
    __tablename__ = "properties"
    
    property_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    
    # Relationships
    units = relationship("Unit", back_populates="property")

class Unit(Base):
    __tablename__ = "units"
    
    unit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    unit_name = Column(String, nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.property_id"), nullable=False)
    description = Column(String)
    beds = Column(Integer)
    baths = Column(Float)
    sq_ft = Column(Integer)
    
    # Relationships
    property = relationship("Property", back_populates="units")
    tenants = relationship("Tenant", back_populates="unit")
    tenant_history = relationship("TenantHistory", back_populates="unit")

class Tenant(Base):
    __tablename__ = "tenants"
    
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.unit_id"))
    unit_name = Column(String)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.lease_id"))
    
    # Relationships
    unit = relationship("Unit", back_populates="tenants")
    leases = relationship("Lease", secondary=lease_tenants, back_populates="tenants")
    tenant_history = relationship("TenantHistory", back_populates="tenant")
    charges = relationship("Charge", back_populates="tenant")
    payments = relationship("Payment", back_populates="tenant")

class Lease(Base):
    __tablename__ = "leases"
    
    lease_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.property_id"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.unit_id"), nullable=False)
    rent_amount = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Relationships
    tenants = relationship("Tenant", secondary=lease_tenants, back_populates="leases")
    payments = relationship("Payment", back_populates="lease")
    charges = relationship("Charge", back_populates="lease")

class Payment(Base):
    __tablename__ = "payments"
    
    payment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.lease_id"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.property_id"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.unit_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    period_month = Column(Integer, nullable=False)
    period_year = Column(Integer, nullable=False)
    reference_number = Column(String)
    
    # Relationships
    lease = relationship("Lease", back_populates="payments")
    tenant = relationship("Tenant", back_populates="payments")

class TenantHistory(Base):
    __tablename__ = "tenant_history"
    
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.unit_id"), primary_key=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), primary_key=True)
    is_active = Column(Boolean, nullable=False)
    move_in_date = Column(Date, nullable=False)
    move_out_date = Column(Date)
    
    # Relationships
    unit = relationship("Unit", back_populates="tenant_history")
    tenant = relationship("Tenant", back_populates="tenant_history")

class Charge(Base):
    __tablename__ = "charges"
    
    charge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.lease_id"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.property_id"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.unit_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    period_month = Column(Integer, nullable=False)  # 1-12
    period_year = Column(Integer, nullable=False)
    is_paid = Column(Boolean, default=False)
    
    # Relationships
    lease = relationship("Lease", back_populates="charges")
    tenant = relationship("Tenant", back_populates="charges")
```

### 3. Schemas (`schemas.py`)

```python
from typing import List
from datetime import date
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

# Property schemas
class PropertyBase(BaseModel):
    name: str
    description: str | None = None

class PropertyCreate(PropertyBase):
    pass

class Property(PropertyBase):
    property_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# Unit schemas
class UnitBase(BaseModel):
    unit_name: str
    property_id: UUID
    description: str | None = None
    beds: int | None = None
    baths: float | None = None
    sq_ft: int | None = None

class UnitCreate(UnitBase):
    pass

class Unit(UnitBase):
    unit_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# Tenant schemas
class TenantBase(BaseModel):
    name: str
    unit_id: UUID | None = None
    unit_name: str | None = None
    lease_id: UUID | None = None

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    tenant_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# Lease schemas
class LeaseBase(BaseModel):
    property_id: UUID
    unit_id: UUID
    rent_amount: float
    start_date: date
    end_date: date

class LeaseCreate(LeaseBase):
    tenant_ids: List[UUID]

class Lease(LeaseBase):
    lease_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# Payment schemas
class PaymentBase(BaseModel):
    lease_id: UUID
    property_id: UUID
    unit_id: UUID
    tenant_id: UUID
    amount: float
    payment_date: date
    period_month: int
    period_year: int
    reference_number: str | None = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    payment_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# TenantHistory schemas
class TenantHistoryBase(BaseModel):
    unit_id: UUID
    tenant_id: UUID
    is_active: bool
    move_in_date: date
    move_out_date: date | None = None

class TenantHistoryCreate(TenantHistoryBase):
    pass

class TenantHistory(TenantHistoryBase):
    model_config = ConfigDict(from_attributes=True)

# Batch operations schemas
class BatchCreate(BaseModel):
    items: List[dict]

class BatchDelete(BaseModel):
    ids: List[UUID]

# Update PaymentBase to include period tracking
class PaymentBase(BaseModel):
    lease_id: UUID
    property_id: UUID
    unit_id: UUID
    tenant_id: UUID
    amount: float
    payment_date: date
    period_month: int
    period_year: int
    reference_number: str | None = None

# Create schemas for the report
class PaymentInfo(BaseModel):
    payment_date: date
    reference_number: str | None = None
    amount: float
    period_description: str
    property_unit: str
    
    model_config = ConfigDict(from_attributes=True)

class ChargeInfo(BaseModel):
    due_date: date
    amount: float
    period_description: str
    property_unit: str
    
    model_config = ConfigDict(from_attributes=True)

class TenantBalanceReport(BaseModel):
    tenant_id: UUID
    tenant_name: str
    property_name: str
    unit_name: str
    paid: list[PaymentInfo] = []
    owed: list[ChargeInfo] = []
    balance: float
    missing_periods: list[str] = []
    
    model_config = ConfigDict(from_attributes=True)

class RentalTrackerReport(BaseModel):
    report_date: date
    tenants: list[TenantBalanceReport]
    total_balance: float
    
    model_config = ConfigDict(from_attributes=True)

class RentalTrackerRequest(BaseModel):
    property_id: UUID | None = None
    min_balance_due: float | None = None
    as_of_date: date | None = None
    min_months_behind: int = 1  # Default to 1 month behind
    sort_by_balance: bool = True  # Default to sorting by balance
```

### 4. CRUD Operations (`crud.py`)

```python
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID

from . import models, schemas

# Property CRUD
def get_properties(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Property).offset(skip).limit(limit).all()

def get_property(db: Session, property_id: UUID):
    return db.query(models.Property).filter(models.Property.property_id == property_id).first()

def create_property(db: Session, property: schemas.PropertyCreate):
    db_property = models.Property(**property.model_dump())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

def create_properties_batch(db: Session, properties: List[schemas.PropertyCreate]):
    db_properties = [models.Property(**p.model_dump()) for p in properties]
    db.add_all(db_properties)
    db.commit()
    for p in db_properties:
        db.refresh(p)
    return db_properties

def update_property(db: Session, property_id: UUID, property: schemas.PropertyCreate):
    db_property = db.query(models.Property).filter(models.Property.property_id == property_id).first()
    for key, value in property.model_dump().items():
        setattr(db_property, key, value)
    db.commit()
    db.refresh(db_property)
    return db_property

def delete_property(db: Session, property_id: UUID):
    db_property = db.query(models.Property).filter(models.Property.property_id == property_id).first()
    db.delete(db_property)
    db.commit()
    return db_property

# Unit CRUD operations
# Similar pattern for Unit, Tenant, Lease, Payment and TenantHistory...

# Charge CRUD operations
def get_charges(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Charge).offset(skip).limit(limit).all()

def get_tenant_charges(db: Session, tenant_id: UUID):
    return db.query(models.Charge).filter(models.Charge.tenant_id == tenant_id).all()

def create_charge(db: Session, charge: schemas.ChargeCreate):
    db_charge = models.Charge(**charge.model_dump())
    db.add(db_charge)
    db.commit()
    db.refresh(db_charge)
    return db_charge

def mark_charge_paid(db: Session, charge_id: UUID, is_paid: bool = True):
    db_charge = db.query(models.Charge).filter(models.Charge.charge_id == charge_id).first()
    db_charge.is_paid = is_paid
    db.commit()
    db.refresh(db_charge)
    return db_charge

# Add functions to get tenant payments
def get_tenant_payments(db: Session, tenant_id: UUID):
    return db.query(models.Payment).filter(models.Payment.tenant_id == tenant_id).all()

# Functions for the rental tracker report
def get_rental_tracker_report(
    db: Session, 
    property_id: UUID = None, 
    min_balance_due: float = 0, 
    as_of_date: date = None,
    min_months_behind: int = 1,
    sort_by_balance: bool = True
):
    # If no date specified, use today
    if not as_of_date:
        as_of_date = date.today()
    
    # Start with a query that joins tenants with their units
    query = db.query(models.Tenant).join(models.Unit, models.Tenant.unit_id == models.Unit.unit_id)
    
    # Filter by property if specified
    if property_id:
        query = query.filter(models.Unit.property_id == property_id)
    
    # Get all matching tenants
    tenants = query.all()
    
    # Build the report
    tenant_reports = []
    total_balance = 0
    
    for tenant in tenants:
        # Get property and unit info
        unit = db.query(models.Unit).filter(models.Unit.unit_id == tenant.unit_id).first()
        if not unit:
            continue
            
        property = db.query(models.Property).filter(models.Property.property_id == unit.property_id).first()
        if not property:
            continue
        
        # Get all charges and payments
        charges = db.query(models.Charge).filter(
            models.Charge.tenant_id == tenant.tenant_id,
            models.Charge.due_date <= as_of_date
        ).all()
        
        payments = db.query(models.Payment).filter(
            models.Payment.tenant_id == tenant.tenant_id,
            models.Payment.payment_date <= as_of_date
        ).all()
        
        # Calculate total owed and paid
        total_owed = sum(charge.amount for charge in charges)
        total_paid = sum(payment.amount for payment in payments)
        balance = total_owed - total_paid
        
        # Skip if balance is less than minimum
        if balance < min_balance_due:
            continue
        
        # Format payments for report
        paid_info = []
        for payment in payments:
            period_desc = f"{get_month_name(payment.period_month)} {payment.period_year}"
            property_unit = f"{property.name} Unit {unit.unit_name}"
            
            paid_info.append(schemas.PaymentInfo(
                payment_date=payment.payment_date,
                reference_number=payment.reference_number,
                amount=payment.amount,
                period_description=period_desc,
                property_unit=property_unit
            ))
        
        # Format charges for report
        owed_info = []
        periods_paid = {(p.period_month, p.period_year) for p in payments}
        periods_owed = set()
        
        for charge in charges:
            period_desc = f"{get_month_name(charge.period_month)} {charge.period_year}"
            property_unit = f"{property.name} Unit {unit.unit_name}"
            periods_owed.add((charge.period_month, charge.period_year))
            
            owed_info.append(schemas.ChargeInfo(
                due_date=charge.due_date,
                amount=charge.amount,
                period_description=period_desc,
                property_unit=property_unit
            ))
        
        # Find missing periods
        missing_periods = []
        for period in periods_owed:
            if period not in periods_paid:
                missing_periods.append(f"{get_month_name(period[0])} {period[1]}")
        
        # Skip if not enough months behind
        if len(missing_periods) < min_months_behind:
            continue
            
        # Create tenant report
        tenant_report = schemas.TenantBalanceReport(
            tenant_id=tenant.tenant_id,
            tenant_name=tenant.name,
            property_name=property.name,
            unit_name=unit.unit_name,
            paid=paid_info,
            owed=owed_info,
            balance=balance,
            missing_periods=missing_periods
        )
        
        tenant_reports.append(tenant_report)
        total_balance += balance
    
    # Sort by balance if requested (default)
    if sort_by_balance:
        tenant_reports.sort(key=lambda x: x.balance, reverse=True)
    
    # Create the full report
    return schemas.RentalTrackerReport(
        report_date=as_of_date,
        tenants=tenant_reports,
        total_balance=total_balance
    )

def get_month_name(month_number):
    """Convert month number to name"""
    return {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }.get(month_number, "Unknown")
```

### 5. API Endpoints (`main.py` or `routers/`)

```python
from fastapi import Depends, FastAPI, HTTPException, APIRouter
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from . import crud, models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Property Management API")

# Property routes
@app.post("/properties/", response_model=schemas.Property)
def create_property(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    return crud.create_property(db=db, property=property)

@app.post("/properties/batch/", response_model=List[schemas.Property])
def create_properties_batch(properties: List[schemas.PropertyCreate], db: Session = Depends(get_db)):
    return crud.create_properties_batch(db=db, properties=properties)

@app.get("/properties/", response_model=List[schemas.Property])
def read_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = crud.get_properties(db, skip=skip, limit=limit)
    return properties

@app.get("/properties/{property_id}", response_model=schemas.Property)
def read_property(property_id: UUID, db: Session = Depends(get_db)):
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@app.put("/properties/{property_id}", response_model=schemas.Property)
def update_property(property_id: UUID, property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return crud.update_property(db=db, property_id=property_id, property=property)

@app.delete("/properties/{property_id}", response_model=schemas.Property)
def delete_property(property_id: UUID, db: Session = Depends(get_db)):
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return crud.delete_property(db=db, property_id=property_id)

@app.delete("/properties/batch/")
def delete_properties_batch(property_ids: List[UUID], db: Session = Depends(get_db)):
    # Implementation goes here
    pass

# Similar routes for Unit, Tenant, Lease, Payment and TenantHistory

# Add to existing file or create a new router file
# POST /reports/rental-tracker/
@app.post("/reports/rental-tracker/", response_model=schemas.RentalTrackerReport)
async def generate_rental_tracker_report(
    request: schemas.RentalTrackerRequest = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Generate a rental tracker report showing tenant balances.
    
    Default: Shows tenants at least 1 month behind, sorted by highest amount owed.
    
    Filters:
    - property_id: Filter by specific property
    - min_balance_due: Minimum balance to include (default: 0)
    - as_of_date: Report date (default: today)
    - min_months_behind: Minimum months behind to include (default: 1)
    - sort_by_balance: Sort by balance amount desc (default: true)
    """
    return crud.get_rental_tracker_report(
        db=db,
        property_id=request.property_id,
        min_balance_due=request.min_balance_due or 0,
        as_of_date=request.as_of_date,
        min_months_behind=request.min_months_behind,
        sort_by_balance=request.sort_by_balance
    )

# GET /reports/rental-tracker/
@app.get("/reports/rental-tracker/", response_model=schemas.RentalTrackerReport)
async def get_rental_tracker_report(
    property_id: UUID = None,
    min_balance_due: float = 0,
    as_of_date: date = None,
    min_months_behind: int = 1,
    sort_by_balance: bool = True,
    db: Session = Depends(get_db)
):
    """
    Generate a rental tracker report showing tenant balances.
    
    Default: Shows tenants at least 1 month behind, sorted by highest amount owed.
    
    Filters:
    - property_id: Filter by specific property
    - min_balance_due: Minimum balance to include (default: 0)
    - as_of_date: Report date (default: today)
    - min_months_behind: Minimum months behind to include (default: 1)
    - sort_by_balance: Sort by balance amount desc (default: true)
    """
    return crud.get_rental_tracker_report(
        db=db,
        property_id=property_id,
        min_balance_due=min_balance_due,
        as_of_date=as_of_date,
        min_months_behind=min_months_behind,
        sort_by_balance=sort_by_balance
    )

# Also add routes for charge management
@app.post("/charges/", response_model=schemas.Charge)
async def create_charge(charge: schemas.ChargeCreate, db: Session = Depends(get_db)):
    return crud.create_charge(db=db, charge=charge)

@app.get("/charges/tenant/{tenant_id}", response_model=list[schemas.Charge])
async def get_tenant_charges(tenant_id: UUID, db: Session = Depends(get_db)):
    return crud.get_tenant_charges(db=db, tenant_id=tenant_id)

@app.patch("/charges/{charge_id}/mark-paid", response_model=schemas.Charge)
async def mark_charge_paid(charge_id: UUID, is_paid: bool = True, db: Session = Depends(get_db)):
    return crud.mark_charge_paid(db=db, charge_id=charge_id, is_paid=is_paid)

@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    # Check if there's a matching charge and mark it as paid
    matching_charge = db.query(models.Charge).filter(
        models.Charge.tenant_id == payment.tenant_id,
        models.Charge.period_month == payment.period_month,
        models.Charge.period_year == payment.period_year
    ).first()
    
    if matching_charge:
        matching_charge.is_paid = True
        db.commit()
    
    return crud.create_payment(db=db, payment=payment)
```

### 6. Modular Routers (Optional)

```python
# routers/properties.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/properties",
    tags=["properties"],
)

@router.post("/", response_model=schemas.Property)
def create_property(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    return crud.create_property(db=db, property=property)

# Other property routes...

# main.py
from fastapi import FastAPI
from .routers import properties, units, tenants, leases, payments

app = FastAPI(title="Property Management API")

app.include_router(properties.router)
app.include_router(units.router)
app.include_router(tenants.router)
app.include_router(leases.router)
app.include_router(payments.router)
```

### Example API Responses

A successful response will look like:

```json
{
  "report_date": "2025-04-15",
  "tenants": [
    {
      "tenant_id": "f87e5195-af78-4318-8fff-35a0234d1f8a",
      "tenant_name": "John Smith",
      "property_name": "123 Main St.",
      "unit_name": "808",
      "paid": [
        {
          "payment_date": "2025-01-01",
          "reference_number": "3218",
          "amount": 1000,
          "period_description": "January 2025",
          "property_unit": "123 Main St. Unit 808"
        },
        {
          "payment_date": "2025-02-01",
          "reference_number": "3219",
          "amount": 1000,
          "period_description": "February 2025",
          "property_unit": "123 Main St. Unit 808"
        }
      ],
      "owed": [
        {
          "due_date": "2025-01-01",
          "amount": 1000,
          "period_description": "January 2025",
          "property_unit": "123 Main St. Unit 808"
        },
        {
          "due_date": "2025-02-01",
          "amount": 1000,
          "period_description": "February 2025",
          "property_unit": "123 Main St. Unit 808"
        },
        {
          "due_date": "2025-03-01",
          "amount": 1000,
          "period_description": "March 2025",
          "property_unit": "123 Main St. Unit 808"
        },
        {
          "due_date": "2025-04-01",
          "amount": 1000,
          "period_description": "April 2025",
          "property_unit": "123 Main St. Unit 808"
        }
      ],
      "balance": 2000,
      "missing_periods": ["March 2025", "April 2025"]
    },
    {
      "tenant_id": "5a72f431-25e9-42cd-a5eb-c1fd479d47a6",
      "tenant_name": "Jane Doe",
      "property_name": "456 Oak Ave.",
      "unit_name": "12B",
      "paid": [...],
      "owed": [...],
      "balance": 1500,
      "missing_periods": ["April 2025"]
    }
  ],
  "total_balance": 3500
}
```
