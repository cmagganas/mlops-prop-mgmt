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


## AWS Lambda Deployment

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with your credentials
- AWS Cognito User Pool configured with:
  - App Client with hosted UI
  - Callback URL to your API Gateway URL: `https://<api-id>.execute-api.<region>.amazonaws.com/prod/auth/callback`
  - Sign-out URL to your API Gateway URL: `https://<api-id>.execute-api.<region>.amazonaws.com/prod`

### Deployment Steps

1. **Build the frontend** (optional):
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to Lambda**:
   ```bash
   # Basic deployment (code only)
   ./scripts/lambda-deploy.sh

   # Deploy with a new Lambda layer
   ./scripts/lambda-deploy.sh --package-layer

   # Specify function name and region
   ./scripts/lambda-deploy.sh --function-name my-lambda --region us-east-1
   ```

3. **Validate locally**:
   ```bash
   # Test Lambda functionality in local environment
   ./scripts/validate_lambda.py --open-browser
   ```

### Configuration

The Lambda function requires the following environment variables:

- `REACT_APP_COGNITO_REGION`: Your Cognito region
- `REACT_APP_COGNITO_USER_POOL_ID`: Your Cognito User Pool ID
- `REACT_APP_COGNITO_CLIENT_ID`: Your Cognito App Client ID
- `REACT_APP_COGNITO_CLIENT_SECRET`: Your Cognito App Client Secret (if applicable)
- `REACT_APP_REDIRECT_URI`: Your API Gateway callback URL

### Script Overview

- `scripts/lambda-deploy.sh`: Packages and deploys the application to AWS Lambda
  - Handles AWS credentials automatically
  - Includes frontend assets or creates test HTML if none exist
  - Options to package dependencies as a Lambda layer

- `scripts/validate_lambda.py`: Local testing script for Lambda functionality
  - Simulates AWS Lambda environment
  - Creates test static files
  - Validates static file serving and API functionality

- `scripts/auth/`: Authentication testing utilities
  - `check_cognito.py`: Validates Cognito configuration
  - `test_auth_flow.py`: Tests the complete authentication flow

### Important Implementation Details

- The AWS Lambda handler in `backend/src/aws_lambda_handler.py` configures Mangum to:
  - Handle API Gateway stage prefix (`/prod`)
  - Disable ASGI lifespan events for Lambda compatibility

- Static files are served with proper API Gateway stage paths
- Authentication handles redirects through the API Gateway stage
