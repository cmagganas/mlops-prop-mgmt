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

## Development

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

### Running Tests
```bash
uv pip install -e ".[test]"
pytest
```

## Deployment

The application can be deployed as an AWS Lambda function with API Gateway:

   - Find complex functions that need refactoring:
     ```bash
     python .github/scripts/find_complex_functions.py backend/app
     ```

4. For complex functions with high cyclomatic complexity:
   - Consider breaking them down into smaller functions
   - Extract repeated logic into helper functions
   - Use more descriptive variable names to improve readability

5. Add type annotations to function signatures to improve type checking:
   ```python
   def get_property_report(property_id: str) -> dict:
       """Get a property report.

       Args:
           property_id: The ID of the property

       Returns:
           A dictionary containing the property report data
       """
       # Function implementation
   ```

### Temporarily Bypassing Pre-commit Hooks

If you need to commit changes while still working on fixing linting issues:

```bash
git commit --no-verify -m "Your commit message"
```

However, aim to gradually fix all linting issues to maintain code quality.

## Getting Started with AWS Cognito Authentication

This project has been restructured to integrate AWS Cognito authentication. The main changes include:

1. **New Directory Structure**:
   - Backend code is now in `backend/app/`
   - Frontend React application is in `frontend/`

2. **Authentication Flow**:
   - AWS Cognito is used for user authentication
   - JWT tokens are securely stored in HTTP-only cookies
   - Protected routes require valid JWT verification

### Setup AWS Cognito

1. Create a User Pool in AWS Cognito
2. Configure an App Client with the hosted UI
3. Update configuration in:
   - `backend/.env`
   - `frontend/public/static/config.dev.json`

### Starting the Application

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



Next steps

1. Create an `index.py` or `aws_lambda_handler.py` file that looks like this

```python
from api.main import create_app
from mangum import Mangum

app = create_app()
handler = Mangum(app)
```

2. Package your code (including the handler) into a lambda function. (layers, etc.) -- you'll have to install the dependencies, e.g. `pip install ...` pip install all the requirements

* Note: remember to include the bundled frontend files in the package (just use the `npm run build` command in the `bash run.sh build` command)

3. Deploy the lambda function

4. Set all env vars needed by the lambda function (everthing in your .env file)

5. Create an API GW and set it up to proxy all requests to the lambda function. No need to configure any auth on this since the fastapi handler does all that with your /auth endpoints.

6. Take the URL of the API GW and put it in 2 places

  1. add it as callback URL to cognito

  2. as an env var to the lambda function (along with all the other env vars in the .env file)