#!/bin/bash
set -ex

# Clean up artifacts
rm -rf lambda_pkg lambda_pkg.zip || true

# Create directory
mkdir -p lambda_pkg

# Copy the application files
if [ -f "aws_lambda_handler.py" ]; then
    cp aws_lambda_handler.py lambda_pkg/
else
    # Create a simple Lambda handler
    echo 'from mangum import Mangum
from api.main import create_app

app = create_app()
handler = Mangum(app)' > lambda_pkg/aws_lambda_handler.py
fi

# Copy API code
if [ -d "src/api" ]; then
    mkdir -p lambda_pkg/api
    cp -r src/api/* lambda_pkg/api/
elif [ -d "api" ]; then
    cp -r api lambda_pkg/
fi

# Install dependencies directly into the lambda package
# Using older versions of libraries that have fewer binary compatibility issues
cd lambda_pkg
pip install --target . \
    fastapi==0.95.2 \
    mangum==0.17.0 \
    pydantic==1.10.8 \
    starlette==0.27.0 \
    python-jose[cryptography] \
    python-multipart \
    httpx \
    boto3

# Remove unnecessary files to reduce package size
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name "*.dist-info" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +
find . -type f -name "*.pyc" -exec rm {} +

# Create zip package
zip -r ../lambda_pkg.zip ./*
cd ..

echo "Created lambda_pkg.zip for deployment"
echo "Handler: aws_lambda_handler.handler" 