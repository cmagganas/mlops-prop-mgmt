#!/bin/bash
set -ex

# Clean up artifacts
rm -rf lambda_mini_env lambda_mini.zip || true

# Create directories
mkdir -p lambda_mini_env/python

# Install only the essential dependencies to avoid binary compatibility issues
pip install --target ./lambda_mini_env/python \
    --only-binary=:all: \
    fastapi==0.110.0 \
    mangum==0.17.0 \
    pydantic==2.4.2  # Older version that has better compatibility

# Copy the mini_test files
cp -r mini_test/* lambda_mini_env/

# Create zip package
cd lambda_mini_env
zip -r ../lambda_mini.zip ./*
cd ..

echo "Created lambda_mini.zip for deployment" 