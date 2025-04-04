from contextlib import asynccontextmanager
from pathlib import Path

from api.config import settings
from api.routers import auth as auth_router
from api.routers import lease as lease_router
from api.routers import payment as payment_router
from api.routers import property as property_router
from api.routers import report as report_router
from api.routers import report_viewer as report_viewer_router
from api.routers import tenant as tenant_router
from api.routers import unit as unit_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

THIS_DIR = Path(__file__).parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI.

    Handles startup and shutdown events for the application."""
    # Startup logic
    print(f"Starting {settings.app_name} {settings.app_version}")
    yield
    # Shutdown logic
    print(f"Shutting down {settings.app_name}")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    This factory function allows for easier testing and deployment
    by separating app creation from running the server.

    Returns:

        A configured FastAPI application"""
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(auth_router.router)  # Add the auth router
    app.include_router(property_router.router)
    app.include_router(unit_router.router)
    app.include_router(tenant_router.router)
    app.include_router(lease_router.router)
    app.include_router(payment_router.router)
    app.include_router(report_router.router)
    app.include_router(report_viewer_router.router)

    # Root endpoint with health check
    @app.get("/healthz", tags=["health"])
    async def health_check() -> dict:
        """Check API health status."""
        return {"status": "healthy", "message": f"{settings.app_name} is running"}

    built_fontend_dir = THIS_DIR / "static"
    app.mount(
        "/",
        StaticFiles(directory=str(built_fontend_dir), html=True),
        name="frontend",
    )

    return app


if __name__ == "__main__":
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
