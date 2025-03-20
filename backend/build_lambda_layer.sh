#!/bin/bash
set -ex

# Clean up artifacts
rm -rf lambda-env lambda-package lambda-layer.zip lambda.zip || true

# Pull the Lambda Python Docker image matching your Lambda runtime
docker pull public.ecr.aws/lambda/python:3.11

# Build dependencies in a Lambda-compatible environment
docker run --rm \
    --volume $(pwd):/var/task \
    public.ecr.aws/lambda/python:3.11 \
    pip install -r requirements.txt -t /var/task/lambda-env/python

# Create layer zip
cd lambda-env
zip -r ../lambda-layer.zip .
cd ..

# Create function package (without dependencies)
mkdir -p lambda-package
cp -r src/api lambda-package/
cp aws_lambda_handler.py lambda-package/

# Zip function code
cd lambda-package
zip -r ../lambda.zip .
cd ..

echo "Created lambda.zip and lambda-layer.zip" 