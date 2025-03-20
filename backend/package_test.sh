#!/bin/bash
set -ex

# Cleanup
rm -rf test_lambda || true
rm -f test_lambda.zip || true

# Create directories
mkdir -p test_lambda

# Copy minimal test files
cp -r mini_test/* test_lambda/

# Install dependencies to the package
pip install --target ./test_lambda fastapi mangum

# Create zip package
cd test_lambda
zip -r ../test_lambda.zip ./*
cd ..

echo "Created test_lambda.zip for deployment" 