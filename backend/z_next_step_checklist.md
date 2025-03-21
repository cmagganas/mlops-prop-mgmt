# Lambda Deployment Checklist and Troubleshooting Guide

## Deployment Steps

1. ✅ Create an `aws_lambda_handler.py` file that looks like this

```python
from api.main import create_app
from mangum import Mangum

app = create_app()
handler = Mangum(app)
```

2. ✅ Package your code (including the handler) into a lambda function
   - ✅ Created packaging scripts: `package-lambda-docker-fixed-arm64.sh` for ARM64 architecture
   - ✅ Created `requirements.txt` for Lambda dependencies
   - ✅ Created Lambda deployment packages:
     - ✅ `lambda.zip` - Contains application code
     - ✅ `lambda-layer.zip` - Contains dependencies

3. ✅ Deploy the lambda function
   - ✅ Create a new Lambda function in AWS console
   - ✅ Upload the `lambda.zip` package to the Lambda function
   - ✅ Create a Lambda layer from `lambda-layer.zip` and attach it to the function
   - ✅ Configure the handler as `aws_lambda_handler.handler`
   - ✅ Fixed "No module named 'pydantic_core._pydantic_core'" error by using the proper architecture-compatible packaging

4. ✅ Set environment variables needed by the lambda function
   - ✅ Copy environment variables from `.env` to Lambda environment variables

5. ✅ Create an API Gateway and set it up to proxy all requests to the lambda function
   - ✅ Create a new REST API in API Gateway
   - ✅ Configure a proxy resource for all routes (`/{proxy+}`)
   - ✅ Create a root resource with ANY method
   - ✅ Connect it to the Lambda function
   - ✅ Deploy the API to a stage (e.g., `prod`)

6. ✅ Configure callback URLs
   - ✅ Add the API Gateway URL as callback URL to Cognito
   - ✅ Set it as an env var to the lambda function (`REDIRECT_URI`)

7. ✅ Fix API Gateway stage name in URLs
   - ✅ Added `get_base_url()` function to detect Lambda environment and include `/prod` stage name in all URLs
   - ✅ Updated all template rendering to include base_url in generated links
   - ✅ Created comprehensive README with deployment instructions and considerations

8. ❌ Fix static file serving for frontend assets
   - ❌ Update `main.py` to handle API Gateway stage name in static file paths
   - ❌ Modify index.html serving to replace static asset URLs with stage-prefixed versions
   - ❌ Re-deploy the Lambda package with updated code

## Fixed Issues

### 1. Architecture Mismatch in Lambda Layer
Fixed by creating architecture-specific packaging scripts:
- Used Docker to build dependencies for the correct architecture (ARM64)
- Created proper Lambda layer with compatible binary dependencies

### 2. Template Generation in Read-Only File System
The Lambda environment has a read-only file system except for the `/tmp` directory. Fixed by:
- Detecting when running in Lambda and using `/tmp/templates` for template storage
- Adding fallback to in-memory template rendering if file operations fail
- Properly handling errors during template generation

### 3. Missing API Gateway Stage in URLs
When deployed with API Gateway, all URLs must include the stage name (e.g., `/prod`):
- Added a `get_base_url()` function that returns `/prod` when in Lambda environment
- Updated all template rendering to include the stage name in all links
- Created documentation about this consideration

### 4. Static Asset Paths in Frontend
Problem: Static assets (JS/CSS) are referenced with paths that don't include the API Gateway stage name
Solution:
- Mount static files separately at `/static` in the FastAPI app
- Dynamically rewrite HTML content to include `/prod/` prefix in all asset URLs
- Customize root endpoint to serve the modified HTML
