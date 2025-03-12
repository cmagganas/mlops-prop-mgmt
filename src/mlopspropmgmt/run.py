"""Mlopspropmgmt module.

This module provides functionality for mlopspropmgmt."""

import uvicorn

from mlopspropmgmt.config import settings

if __name__ == "__main__":
    uvicorn.run("mlopspropmgmt.main:app", host=settings.host, port=settings.port, reload=settings.debug)
