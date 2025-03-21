# Property Management System

A FastAPI and React-based application for managing properties, units, tenants, and financial reports.

## Features

- **Modular Dependencies**: Restructured project with component-based dependency management
- **Unified Installation Process**: Simplified setup for both backend and frontend components
- **Consolidated Environment Configuration**: Single .env file for all settings
- **HTML Report Viewer**: Added a user-friendly web interface for visualizing financial reports
- **AWS Cognito Authentication**: Secure authentication flow using Cognito and JWT tokens

## Prerequisites

- Python 3.11+
- AWS Cognito User Pool configured with:
  - App Client with hosted UI
  - Callback URL: `http://localhost:8000/auth/callback`
  - Sign-out URL: `http://localhost:8000`

## Quick Start

1. Clone and setup:
```bash
git clone <repo-url>
cd mlops-prop-mgmt

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
uv pip install -e ".[auth,aws]"
```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Run the application:
```bash
cd backend
uv run -m api.main
```

Visit http://localhost:8000 to access the application.

### Project Structure
```
mlops-prop-mgmt/
├── backend/
│   └── src/
│       └── api/
│           ├── auth/       # Authentication handlers
│           ├── models/     # Data models
│           ├── routers/    # API routes
│           ├── static/     # Built frontend files
│           └── main.py     # Application entry point
├── .env                    # Environment configuration
└── pyproject.toml         # Project dependencies
```

### do these steps still work?

Use these commands to start the application:

```bash
# Start the backend API server
make start-backend

# Start the frontend development server
make start-frontend

# Start both at once
make start-all
```

### Authentication Flow

1. User navigates to the login page
2. User clicks "Sign In" and is redirected to AWS Cognito Hosted UI
3. After successful authentication, Cognito redirects to the backend callback endpoint
4. The backend exchanges the authorization code for tokens and sets secure cookies
5. Protected routes verify the JWT token on each request

## Development and Deployment Status

### Current State
- Application runs in Lambda and redirects to login page
- Authentication middleware correctly handles API Gateway stage paths
- Fixed several issues with path handling in FastAPI routes

### Known Issues
- Lambda layer deployment may still have issues with empty ZIP files
  - Consider using direct pip install rather than Docker approach
  - Manual upload of lambda-layer.zip as temporary workaround
- Need to ensure API Gateway has explicit resource for /login path
- Test events may require source IP in requestContext for Lambda testing

### Next Steps
1. Complete API Gateway configuration:
   - Add dedicated resource for /login (not using proxy)
   - Redeploy API after configuration changes
2. Test authentication flow end-to-end
3. Implement remaining business features (tenant payment, expense tracking)
4. Add proper error handling for production readiness
