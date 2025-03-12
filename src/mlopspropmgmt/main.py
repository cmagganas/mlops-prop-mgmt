from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings
from .routers import property as property_router
from .routers import unit as unit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI.

    Handles startup and shutdown events for the application.
    """
    # Startup logic
    print(f"Starting {settings.app_name} {settings.app_version}")
    yield
    # Shutdown logic
    print(f"Shutting down {settings.app_name}")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    This factory function allows for easier testing and deployment
    by separating app creation from running the server.

    Returns:
        A configured FastAPI application
    """
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        lifespan=lifespan,
    )

    # Register routers
    app.include_router(property_router.router)
    app.include_router(unit_router.router)

    # Root endpoint with health check
    @app.get("/", tags=["health"])
    async def health_check() -> dict:
        """API health check endpoint."""
        return {"status": "healthy", "message": f"{settings.app_name} is running"}

    return app


app = create_app()
