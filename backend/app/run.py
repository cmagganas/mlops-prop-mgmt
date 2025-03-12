"""Backend app module.

This module provides functionality for running the backend application."""

import uvicorn

from backend.app.config import settings

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
