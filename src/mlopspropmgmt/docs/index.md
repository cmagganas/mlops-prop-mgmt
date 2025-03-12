# Property Management System Documentation

Welcome to the Property Management System documentation. This document serves as the central hub for all documentation related to the Property Management System.

## Overview

The Property Management System is a FastAPI-based application for managing properties, units, tenants, leases, payments, and generating financial reports. The system provides both API endpoints for programmatic access and an HTML interface for human users.

## Documentation Sections

- [API Documentation](api_documentation.md) - Complete reference for all API endpoints, request/response formats, and examples
- [Architecture](../../assets/architecture.md) - Overview of the system architecture and component design
- [Development Guidelines](../../README.md#development-guidelines) - Guidelines for developing and contributing to the project

## Quick Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/) - Official FastAPI documentation
- [Pydantic Documentation](https://docs.pydantic.dev/) - Official Pydantic documentation
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/) - Official SQLAlchemy documentation

## Project Structure

```
src/
├── mlopspropmgmt/           # Main package
│   ├── config.py            # Application configuration
│   ├── db/                  # Database models and repositories
│   ├── models/              # Data models (Pydantic models)
│   ├── routers/             # API route definitions
│   └── templates/           # HTML templates for report viewer
└── tests/                   # Tests for the application
```

## Getting Started

See the [README.md](../../README.md) for instructions on how to set up and run the application.
