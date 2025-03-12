# Implementation Guide for Developers

This document provides guidelines and best practices for implementing features in the Property Management System.

## Getting Started

1. **Set up your development environment**
   - Clone the repository
   - Install dependencies using `pip install -e ".[dev]"`
   - Set up pre-commit hooks with `pre-commit install`

2. **Understand the codebase structure**
   - Review the main modules and their responsibilities
   - Familiarize yourself with the existing models and API endpoints

## Implementing New Features

### 1. Define Requirements

Before implementing a new feature:
- Clearly define the feature's scope and requirements
- Create user stories or acceptance criteria
- Identify affected components and potential impacts on existing functionality

### 2. Database Models

When adding new database models:

```python
# Example of a well-structured SQLAlchemy model
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from mlopspropmgmt.db.base import Base

class Maintenance(Base):
    """
    Represents a maintenance request for a property unit.
    """
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    unit = relationship("Unit", back_populates="maintenance_requests")
```

Best practices:
- Use descriptive names for tables and columns
- Include comprehensive docstrings
- Define appropriate indexes for frequently queried columns
- Add default values where applicable
- Implement nullable constraints appropriately

### 3. Pydantic Models

For API request/response models:

```python
# Example of a well-structured Pydantic model
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class MaintenanceRequestBase(BaseModel):
    """Base model with shared attributes for maintenance requests."""
    title: str = Field(..., description="Title of the maintenance request")
    description: str = Field(..., description="Detailed description of the issue")
    unit_id: int = Field(..., description="ID of the unit requiring maintenance")

class MaintenanceRequestCreate(MaintenanceRequestBase):
    """Model for creating a new maintenance request."""
    pass

class MaintenanceRequestUpdate(BaseModel):
    """Model for updating an existing maintenance request."""
    title: Optional[str] = Field(None, description="Updated title")
    description: Optional[str] = Field(None, description="Updated description")
    status: Optional[str] = Field(None, description="Current status of the request")

class MaintenanceRequestResponse(MaintenanceRequestBase):
    """Model for maintenance request responses."""
    id: int = Field(..., description="Unique identifier")
    status: str = Field(..., description="Current status of the request")
    created_at: datetime = Field(..., description="When the request was created")
    updated_at: datetime = Field(..., description="When the request was last updated")

    class Config:
        from_attributes = True
```

Best practices:
- Create separate models for create, update, and response operations
- Use descriptive field names with helpful descriptions
- Leverage Pydantic validation for data integrity
- Organize models logically by domain

### 4. Repository Pattern

Implement database access using the repository pattern:

```python
# Example repository implementation
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from mlopspropmgmt.db.models import Maintenance
from mlopspropmgmt.models.maintenance import MaintenanceRequestCreate, MaintenanceRequestUpdate

class MaintenanceRepository:
    """Repository for maintenance request database operations."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def create(self, maintenance_data: MaintenanceRequestCreate) -> Maintenance:
        """Create a new maintenance request."""
        maintenance = Maintenance(**maintenance_data.model_dump())
        self.session.add(maintenance)
        await self.session.commit()
        await self.session.refresh(maintenance)
        return maintenance

    async def get_by_id(self, maintenance_id: int) -> Optional[Maintenance]:
        """Get a maintenance request by ID."""
        query = select(Maintenance).where(Maintenance.id == maintenance_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def update(self, maintenance_id: int, maintenance_data: MaintenanceRequestUpdate) -> Optional[Maintenance]:
        """Update an existing maintenance request."""
        maintenance = await self.get_by_id(maintenance_id)
        if not maintenance:
            return None

        update_data = maintenance_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(maintenance, key, value)

        await self.session.commit()
        await self.session.refresh(maintenance)
        return maintenance
```

Best practices:
- Use async functions for database operations
- Implement CRUD operations consistently
- Return domain models rather than ORM models when possible
- Handle errors gracefully

### 5. API Routes

Define FastAPI routes as follows:

```python
# Example of a well-structured router
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from mlopspropmgmt.db.session import get_db
from mlopspropmgmt.db.repositories.maintenance import MaintenanceRepository
from mlopspropmgmt.models.maintenance import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse,
)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

@router.post(
    "/",
    response_model=MaintenanceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new maintenance request",
    description="Creates a new maintenance request for a specific unit."
)
async def create_maintenance_request(
    request: MaintenanceRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new maintenance request with the following information:

    - **title**: A short title describing the issue
    - **description**: Detailed description of the maintenance issue
    - **unit_id**: The ID of the unit requiring maintenance
    """
    repository = MaintenanceRepository(db)
    maintenance = await repository.create(request)
    return maintenance

@router.get(
    "/{request_id}",
    response_model=MaintenanceRequestResponse,
    summary="Get maintenance request details",
    description="Retrieves the details of a specific maintenance request."
)
async def get_maintenance_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get details for a specific maintenance request by its ID.

    If the request doesn't exist, a 404 error will be returned.
    """
    repository = MaintenanceRepository(db)
    maintenance = await repository.get_by_id(request_id)

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance request with ID {request_id} not found"
        )

    return maintenance
```

Best practices:
- Group related endpoints in a single router
- Use meaningful path parameters and query parameters
- Provide detailed docstrings and OpenAPI metadata
- Implement proper error handling with appropriate status codes
- Use dependency injection for database connections and authentication

### 6. Testing

For every new feature, implement:

1. **Unit tests** for individual components:
```python
# Example unit test
import pytest
from datetime import datetime
from mlopspropmgmt.services.report import ReportService

def test_calculate_months_between():
    """Test calculation of months between two dates."""
    report_service = ReportService()
    start_date = datetime(2023, 1, 15)
    end_date = datetime(2023, 4, 10)

    result = report_service.calculate_months_between(start_date, end_date)

    assert result == 3
```

2. **Integration tests** for API endpoints:
```python
# Example integration test
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
import pytest

from mlopspropmgmt.main import app
from mlopspropmgmt.db.repositories.maintenance import MaintenanceRepository

@pytest.mark.asyncio
async def test_create_maintenance_request(client: TestClient, db_session: AsyncSession):
    """Test creating a maintenance request via API."""
    # Test data
    test_request = {
        "title": "Broken faucet",
        "description": "The kitchen faucet is leaking",
        "unit_id": 1
    }

    # Make the request
    response = client.post("/maintenance/", json=test_request)

    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == test_request["title"]
    assert data["description"] == test_request["description"]
    assert "id" in data

    # Verify in database
    repository = MaintenanceRepository(db_session)
    saved_request = await repository.get_by_id(data["id"])
    assert saved_request is not None
    assert saved_request.title == test_request["title"]
```

## Performance Considerations

- Use async/await for I/O-bound operations
- Implement pagination for endpoints that return multiple items
- Use database indexes for frequently queried columns
- Cache frequently accessed data when appropriate
- Use efficient database queries (avoid N+1 query problems)

## Security Best Practices

- Validate all user inputs using Pydantic models
- Implement proper authentication and authorization for all endpoints
- Never expose sensitive data in API responses
- Use parameterized queries to prevent SQL injection
- Implement rate limiting for public-facing APIs
- Log security-relevant events

## Deployment Considerations

- Use environment variables for configuration
- Follow the [12-factor app methodology](https://12factor.net/)
- Implement health check endpoints
- Add appropriate logging
- Document API changes for versioning

## Code Review Checklist

Before submitting code for review, ensure:

- All tests pass
- Code follows the project's style guidelines
- New features are properly documented
- API changes are reflected in the OpenAPI documentation
- Error handling is implemented
- Security considerations are addressed
- Performance implications are considered
