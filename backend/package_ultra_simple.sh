#!/bin/bash
set -ex

# Clean up artifacts
rm -rf ultra_simple ultra_simple.zip || true

# Create directory
mkdir -p ultra_simple

# Copy the ultra simple handler
cp ultra_simple_lambda.py ultra_simple/lambda_function.py

# Create zip package
cd ultra_simple
zip -r ../ultra_simple.zip lambda_function.py
cd ..

echo "Created ultra_simple.zip for deployment"
echo "Handler: lambda_function.handler" 