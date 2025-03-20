import os
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
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

THIS_DIR = Path(__file__).parent

# Determine if running in Lambda
is_lambda = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None


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
        A configured FastAPI application
    """
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
    @app.get("/healthz", tags=["health"], operation_id="health_check")
    async def health_check() -> dict:
        """Check API health status."""
        return {"status": "healthy", "message": f"{settings.app_name} is running"}

    # Path to built frontend files
    built_frontend_dir = THIS_DIR / "static"

    # Configure static file serving based on environment
    if is_lambda:
        # Mount static files at /static
        app.mount(
            "/static",
            StaticFiles(directory=str(built_frontend_dir / "static")),
            name="static",
        )

        # Mount the root HTML at /
        @app.get("/", tags=["frontend"], operation_id="serve_index")
        async def serve_index():
            """Serve the index.html file."""
            index_path = built_frontend_dir / "index.html"
            if index_path.exists():
                with open(index_path, "r") as f:
                    content = f.read()
                # Modify static file references to include the stage name
                content = content.replace('src="/', 'src="/prod/')
                content = content.replace('href="/', 'href="/prod/')
                return HTMLResponse(content=content)

    else:
        # In local development, mount everything at / as before
        app.mount(
            "/",
            StaticFiles(directory=str(built_frontend_dir), html=True),
            name="frontend",
        )

    @app.get("/api/status", tags=["diagnostics"])
    async def status():
        """Return API status information."""
        return {
            "status": "ok",
            "environment": "lambda" if is_lambda else "local",
            "version": "0.1.0",  # Replace with your actual version
        }

    return app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:create_app()", host="0.0.0.0", port=8000, reload=True)
