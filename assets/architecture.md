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

class Payment(Base):
    __tablename__ = "payments"
    
    payment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.lease_id"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.property_id"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.unit_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    
    # Relationships
    lease = relationship("Lease", back_populates="payments")

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