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


### Next steps

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
