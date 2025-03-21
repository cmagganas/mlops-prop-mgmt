import os
from pathlib import Path

from api.auth.jwt import get_current_user
from api.auth.middleware import add_auth_middleware
from api.config import settings
from api.routers import auth
from fastapi import (
    Depends,
    FastAPI,
    Request,
)
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    HTMLResponse,
    RedirectResponse,
)
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Directory paths
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Check if running in Lambda
IS_LAMBDA = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None
# API Gateway stage name (typically 'prod' or 'dev')
API_STAGE = os.environ.get("API_GATEWAY_STAGE", "prod")

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title="Property Management API",
        description="API for property management system",
        version="0.1.0",
        root_path=settings.root_path,
    )

    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add routers
    app.include_router(auth.router)

    # Configure templates
    templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

    # Mount static files - must be done before adding routes
    app.mount(
        "/static",
        StaticFiles(directory=str(STATIC_DIR)),
        name="static",
    )

    # Define routes
    @app.get("/", tags=["frontend"])
    async def root():
        """Redirect to login page."""
        return RedirectResponse(url="/login")

    @app.get("/login", tags=["auth"], response_class=HTMLResponse)
    async def login_page(request: Request):
        """Render the login page."""
        login_url = f"{request.url_for('login')}"
        context = {
            "request": request,
            "login_url": login_url,
        }
        return templates.TemplateResponse("login.html", context)

    @app.get("/dashboard", tags=["frontend"], response_class=HTMLResponse)
    async def dashboard(request: Request, user: dict = Depends(get_current_user)):
        """Serve the dashboard for authenticated users."""
        return templates.TemplateResponse(
            "dashboard.html", 
            {"request": request, "user": user}
        )
    
    @app.get("/logout", tags=["auth"])
    async def logout(request: Request):
        """Log out and redirect to login page."""
        response = RedirectResponse(url="/login")
        # Clear cookies
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="id_token")
        response.delete_cookie(key="refresh_token")
        return response

    @app.get("/api/status", tags=["api"])
    async def status():
        """Return API status information."""
        return {
            "status": "ok",
            "version": "0.1.0",
            "environment": "lambda" if IS_LAMBDA else "local",
        }

    # Add custom exception handlers
    @app.exception_handler(404)
    async def not_found_exception_handler(request: Request, exc: HTTPException):
        """Handle 404 errors gracefully."""
        if request.url.path.startswith("/api/"):
            # Return JSON for API routes
            return {"error": "Resource not found", "path": request.url.path}
        else:
            # Redirect to login for frontend routes
            return RedirectResponse(url="/login")

    # Add the auth middleware
    add_auth_middleware(app)

    return app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:create_app()", host="0.0.0.0", port=8000, reload=True)
