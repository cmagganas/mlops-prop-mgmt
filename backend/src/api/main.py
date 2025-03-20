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

# Check if running in AWS Lambda
is_lambda = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None


def get_base_url():
    """Get the base URL for API Gateway stage if in AWS Lambda environment."""
    if is_lambda:
        # When deployed to AWS Lambda with API Gateway, include the stage name
        return "/prod"
    return ""


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

    built_frontend_dir = THIS_DIR / "static"

    # Create the static directory if it doesn't exist
    os.makedirs(built_frontend_dir, exist_ok=True)

    if is_lambda:
        # In Lambda, we need to handle static files differently due to API Gateway stage name

        # First, check if there's a nested static directory or use the main static directory
        static_dir = built_frontend_dir / "static" if (built_frontend_dir / "static").exists() else built_frontend_dir

        # Mount static files at /static path
        app.mount(
            "/static",
            StaticFiles(directory=str(static_dir)),
            name="static",
        )

        # Custom handler for root path to serve index.html with modified paths
        @app.get("/", tags=["frontend"])
        async def serve_index():
            """Serve the index.html file with API Gateway stage-prefixed paths."""
            index_path = built_frontend_dir / "index.html"
            if index_path.exists():
                try:
                    with open(index_path, "r") as f:
                        content = f.read()

                    # Get the base URL for the environment (includes stage name in Lambda)
                    base_url = get_base_url()

                    # Modify static file references to include the stage name
                    # First replace absolute paths starting with /
                    content = content.replace('src="/', f'src="{base_url}/')
                    content = content.replace('href="/', f'href="{base_url}/')

                    # Then handle relative paths that might need to be made absolute with the stage name
                    # Only modify paths that don't already have the base_url prefix
                    if base_url:
                        content = content.replace('src="static/', f'src="{base_url}/static/')
                        content = content.replace('href="static/', f'href="{base_url}/static/')

                    # Add some debug info in development mode
                    if settings.debug:
                        debug_info = f"""
                        <!--
                        Debug Info:
                        - Environment: {"Lambda" if is_lambda else "Local"}
                        - Base URL: {base_url}
                        - Static Dir: {static_dir}
                        -->
                        """
                        content = content.replace("</head>", f"{debug_info}</head>")

                    return HTMLResponse(content=content)
                except Exception as e:
                    error_html = f"""
                    <html>
                    <head><title>Error</title></head>
                    <body>
                        <h1>Error loading index.html</h1>
                        <p>{str(e)}</p>
                        <h2>Debug Info:</h2>
                        <pre>
                        Index path: {index_path}
                        Exists: {index_path.exists()}
                        Lambda: {is_lambda}
                        Static dir: {static_dir}
                        </pre>
                    </body>
                    </html>
                    """
                    return HTMLResponse(content=error_html, status_code=500)

            # Fallback if index.html doesn't exist
            return HTMLResponse(
                content=f"""
                <html>
                <head><title>Property Management API</title></head>
                <body>
                    <h1>Welcome to Property Management API</h1>
                    <p>Frontend not found at {index_path}</p>
                    <p>Running in {"Lambda" if is_lambda else "Local"} environment</p>
                    <p>Base URL: {get_base_url()}</p>
                </body>
                </html>
                """
            )

    else:
        # In local development, mount everything at / as before
        app.mount(
            "/",
            StaticFiles(directory=str(built_frontend_dir), html=True),
            name="frontend",
        )

    return app


if __name__ == "__main__":
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
