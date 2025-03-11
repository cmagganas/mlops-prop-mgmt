from typing import (
    Any,
    Dict,
    List,
    Optional,
)

import uvicorn
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
)
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

# Initialize FastAPI with metadata for Swagger UI
app = FastAPI(
    title="Property Management API",
    description="API for managing properties, units, tenants, and payments",
    version="0.1.0",
    docs_url="/docs",  # Swagger UI endpoint (default)
    redoc_url="/redoc",  # ReDoc endpoint (alternative documentation)
)


# Example Pydantic models
class PropertyBase(BaseModel):
    """Base property information model."""

    name: str = Field(..., description="Name of the property")
    address: str = Field(..., description="Address of the property")


class PropertyCreate(PropertyBase):
    """Model for creating a new property."""

    pass


class Property(PropertyBase):
    """Complete property model including the ID."""

    id: int = Field(..., description="Unique identifier for the property")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {"id": 1, "name": "Sunset Apartments", "address": "123 Main Street, Anytown, USA"}
        },
    )


# In-memory storage for demo purposes
properties_db: List[Dict[str, Any]] = [
    {"id": 1, "name": "Sunset Apartments", "address": "123 Main Street, Anytown, USA"},
    {"id": 2, "name": "Ocean View Condos", "address": "456 Beach Road, Coastville, USA"},
]


# Basic CRUD routes with documentation
@app.get("/properties/", response_model=List[Property], tags=["properties"])
async def get_properties(
    skip: int = Query(0, description="Number of properties to skip"),
    limit: int = Query(10, description="Maximum number of properties to return"),
) -> List[Property]:
    """
    Retrieve a list of properties with pagination.

    - **skip**: Number of properties to skip (for pagination)
    - **limit**: Maximum number of properties to return
    """
    return properties_db[skip : skip + limit]


@app.get("/properties/{property_id}", response_model=Property, tags=["properties"])
async def get_property(property_id: int) -> Property:
    """
    Retrieve a specific property by ID.

    - **property_id**: The unique identifier of the property
    """
    for property_item in properties_db:
        if property_item["id"] == property_id:
            return property_item
    raise HTTPException(status_code=404, detail="Property not found")


@app.post("/properties/", response_model=Property, tags=["properties"])
async def create_property(property: PropertyCreate) -> Property:
    """
    Create a new property.

    - **property**: Property data to create
    """
    new_id = max(p["id"] for p in properties_db) + 1 if properties_db else 1
    new_property = {"id": new_id, **property.model_dump()}
    properties_db.append(new_property)
    return new_property


@app.put("/properties/{property_id}", response_model=Property, tags=["properties"])
async def update_property(property_id: int, property: PropertyCreate) -> Property:
    """
    Update an existing property.

    - **property_id**: The unique identifier of the property to update
    - **property**: Updated property data
    """
    for i, property_item in enumerate(properties_db):
        if property_item["id"] == property_id:
            properties_db[i] = {"id": property_id, **property.model_dump()}
            return properties_db[i]
    raise HTTPException(status_code=404, detail="Property not found")


@app.delete("/properties/{property_id}", response_model=dict, tags=["properties"])
async def delete_property(property_id: int) -> dict:
    """
    Delete a property.

    - **property_id**: The unique identifier of the property to delete
    """
    for i, property_item in enumerate(properties_db):
        if property_item["id"] == property_id:
            del properties_db[i]
            return {"success": True, "message": f"Property {property_id} deleted"}
    raise HTTPException(status_code=404, detail="Property not found")


# Root endpoint with health check
@app.get("/", tags=["health"])
async def health_check() -> dict:
    """API health check endpoint."""
    return {"status": "healthy", "message": "Property Management API is running"}


# Only run the server directly if this file is executed directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
