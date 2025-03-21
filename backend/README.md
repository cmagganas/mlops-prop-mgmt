# Property Management API

A scalable API built with FastAPI for managing properties, units, tenants, and payments.

## Features

- **Authentication**: AWS Cognito integration with JWT validation
- **Property Management**: CRUD operations for properties, units, tenants, and leases
- **Payment Tracking**: Record and monitor tenant payments
- **Reporting**: Generate financial and tenant reports
- **API Documentation**: Auto-generated Swagger UI documentation

## Architecture

The application follows a modern API design with the following components:

- **FastAPI**: For high-performance API endpoints
- **Pydantic**: For data validation and settings management
- **AWS Cognito**: For user authentication
- **AWS Lambda**: For serverless deployment
- **AWS API Gateway**: For API management and routing

## Local Development

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- AWS account with Cognito user pool configured

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r src/api/requirements.txt
```

4. Create a `.env` file in the project root with the following configuration:

```
REACT_APP_AWS_REGION=<aws-region>
REACT_APP_COGNITO_REGION=<cognito-region>
REACT_APP_COGNITO_USER_POOL_ID=<user-pool-id>
REACT_APP_COGNITO_CLIENT_ID=<client-id>
REACT_APP_COGNITO_DOMAIN=<domain-prefix>
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FRONTEND_URL=http://localhost:8000
REACT_APP_REDIRECT_URI=http://localhost:8000/auth/callback
```

5. Run the development server:

```bash
cd src
python -m api.main
```

The API will be available at http://localhost:8000

## AWS Lambda Deployment

### Prerequisites

- AWS CLI installed and configured
- AWS Lambda function created
- AWS API Gateway configured to trigger the Lambda function

### Deployment Steps

1. Make sure your AWS credentials are configured:

```bash
aws configure
```

2. Update the Lambda function name and other settings in `deploy-lambda.sh` if needed.

3. Run the deployment script:

```bash
cd backend
chmod +x deploy-lambda.sh
./deploy-lambda.sh
```

4. Configure the API Gateway to:
   - Use Lambda proxy integration
   - Set up CORS if needed
   - Configure custom domain if desired

5. Deploy the API Gateway changes:

```bash
aws apigateway create-deployment --rest-api-id <api-id> --stage-name <stage-name>
```

## API Documentation

After deployment, the API documentation is available at:

- Local: http://localhost:8000/api/docs
- AWS: https://<api-id>.execute-api.<region>.amazonaws.com/<stage>/api/docs

## Authentication

The API uses AWS Cognito for authentication. The flow is as follows:

1. Unauthenticated users are redirected to `/login`
2. Users click "Sign in with AWS Cognito" to initiate the OAuth flow
3. After successful authentication, users are redirected back to the application
4. JWT tokens are stored in HTTP-only cookies for secure authentication
5. Protected routes verify the JWT token before processing requests
