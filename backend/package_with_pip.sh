#!/bin/bash
set -ex

# Clean up artifacts
rm -rf lambda_pip lambda_pip.zip || true

# Create directory
mkdir -p lambda_pip

# Copy the mini_test files (excluding api directory)
cp mini_test/aws_lambda_handler.py lambda_pip/
mkdir -p lambda_pip/api
cp mini_test/api/__init__.py lambda_pip/api/
cp mini_test/api/main.py lambda_pip/api/

# Install dependencies directly into the lambda package
# Using an older version of pydantic that has fewer binary dependencies
cd lambda_pip
pip install --target . \
    fastapi==0.95.2 \
    mangum==0.17.0 \
    pydantic==1.10.8 \
    starlette==0.27.0

# Remove unnecessary files to reduce package size
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name "*.dist-info" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +
find . -type f -name "*.pyc" -exec rm {} +

# Create zip package
zip -r ../lambda_pip.zip ./*
cd ..

echo "Created lambda_pip.zip for deployment"
echo "Handler: aws_lambda_handler.handler" 