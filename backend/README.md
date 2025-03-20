# Property Management API - Lambda Deployment Guide

This document provides guidance on deploying and maintaining the Property Management API as an AWS Lambda function with API Gateway integration.

## Architecture Overview

The Property Management API uses the following AWS services:
- **AWS Lambda** - Runs the FastAPI application using Mangum adapter
- **API Gateway** - Provides HTTP endpoints that proxy to Lambda
- **Amazon Cognito** - Handles user authentication
- **Lambda Layers** - Contains Python dependencies

## Deployment Process

### Prerequisites
- AWS CLI installed and configured
- Python 3.11+
- Docker (for building Lambda layers with binary dependencies)

### Deployment Steps

1. **Package the Lambda function**:
   ```bash
   cd backend
   # For ARM64 architecture (AWS Graviton)
   ./scripts/package-lambda-docker-fixed-arm64.sh

   # For x86_64 architecture
   ./scripts/package-lambda-docker-fixed.sh
   ```

2. **Create a Lambda function** in AWS Console:
   - Runtime: Python 3.11
   - Architecture: ARM64 (for arm64 package) or x86_64
   - Handler: `aws_lambda_handler.handler`
   - Function name: `property-mgmt-lambda`

3. **Create a Lambda Layer** with dependencies:
   - Upload `lambda-layer.zip`
   - Compatible runtime: Python 3.11
   - Compatible architecture: Match your Lambda function

4. **Configure environment variables** for the Lambda function (matching your `.env` file):
   - `API_URL` - The API Gateway URL (e.g., `https://kdm5sqbe9i.execute-api.us-west-1.amazonaws.com/prod`)
   - `API_BASE_URL` - The base URL for OAuth callbacks (e.g., `https://kdm5sqbe9i.execute-api.us-west-1.amazonaws.com/prod`)
   - `COGNITO_CLIENT_ID` - From Cognito User Pool App Client
   - `COGNITO_CLIENT_SECRET` - From Cognito User Pool App Client
   - `COGNITO_DOMAIN` - Your Cognito domain
   - `COGNITO_USER_POOL_ID` - Your Cognito User Pool ID
   - `REDIRECT_URI` - Authentication callback URL (e.g., `https://kdm5sqbe9i.execute-api.us-west-1.amazonaws.com/prod/auth/callback`)

5. **Create API Gateway**:
   - Create a REST API
   - Create a `/{proxy+}` resource with `ANY` method
   - Create a root resource (`/`) with `ANY` method
   - Configure both to use Lambda Proxy integration with the Lambda function
   - Enable CORS if needed
   - Deploy to a stage named `prod`

6. **Update Cognito App Client**:
   - Add callback URL matching your API Gateway URL
   - Configure appropriate OAuth scopes

## Important Considerations

### API Gateway Stage Name in URLs

When deploying with API Gateway, all URLs include the stage name (e.g., `/prod`) in the path. The application has been configured to detect when running in Lambda and automatically prepend `/prod` to all generated URLs.

If you deploy to a different stage name, update the `get_base_url()` function in `api/routers/report_viewer.py` to use the correct stage name:

```python
def get_base_url():
    """Get the base URL for API Gateway stage if in AWS Lambda environment."""
    if is_lambda:
        # When deployed to AWS Lambda with API Gateway, include the stage name
        return "/your-stage-name"  # Change this to match your API Gateway stage
    return ""
```

### Static Asset Paths in API Gateway

When serving a frontend application through API Gateway with Lambda, all static asset paths need to include the stage name (e.g., `/prod/static/js/main.js`). The application handles this by:

1. Detecting when running in Lambda environment
2. Dynamically rewriting asset paths in HTML to include the stage name
3. Mounting static files separately

**TODO:** Update the `main.py` file to fix static file serving with API Gateway:
```python
# In the create_app function:

if is_lambda:
    # Mount static files at /static
    app.mount(
        "/static",
        StaticFiles(directory=str(built_fontend_dir / "static")),
        name="static",
    )

    # Mount the root HTML at /
    @app.get("/", tags=["frontend"])
    async def serve_index():
        """Serve the index.html file."""
        index_path = built_fontend_dir / "index.html"
        if index_path.exists():
            with open(index_path, "r") as f:
                content = f.read()
            # Modify static file references to include the stage name
            content = content.replace('src="/', 'src="/prod/')
            content = content.replace('href="/', 'href="/prod/')
            return HTMLResponse(content=content)
else:
    # In local development, mount everything at / as before
    app.mount(
        "/",
        StaticFiles(directory=str(built_fontend_dir), html=True),
        name="frontend",
    )
```

### Troubleshooting

1. **"Internal Server Error"**: Check Lambda logs in CloudWatch for detailed error messages

2. **"Forbidden" errors when clicking links**: Ensure the API Gateway stage name is correctly reflected in the URLs

3. **Blank screen on root URL**: Check if static asset paths include the API Gateway stage name (`/prod/`)

4. **Template rendering issues**: The Lambda environment uses the `/tmp` directory for template storage since the function's filesystem is read-only

## Local Development

For local development:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -e .
uvicorn api.main:app --reload
```

## Redeploying After Changes

1. Make your changes to the application code
2. Repackage the Lambda function:
   ```bash
   ./scripts/package-lambda-docker-fixed-arm64.sh
   ```
3. Upload only the `lambda.zip` file (no need to update the layer unless dependencies change)
4. Test your changes by accessing the API Gateway URL
