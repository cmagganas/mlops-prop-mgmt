#!/bin/bash
set -e

# Configuration
LAMBDA_FUNCTION_NAME=${LAMBDA_FUNCTION_NAME:-"property-mgmt-lambda"}
AWS_REGION=${AWS_REGION:-"us-west-1"}
PYTHON_RUNTIME=${PYTHON_RUNTIME:-"python3.11"}

# Directory setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/src"
BUILD_DIR="${SCRIPT_DIR}/build"
LAYER_DIR="${BUILD_DIR}/layer"
LAYER_PYTHON_DIR="${LAYER_DIR}/python"
LAMBDA_DIR="${BUILD_DIR}/lambda"

echo "=== Property Management API Lambda Deployment ==="
echo "Function Name: ${LAMBDA_FUNCTION_NAME}"
echo "AWS Region: ${AWS_REGION}"
echo "Python Runtime: ${PYTHON_RUNTIME}"

# Clean up previous builds
echo "Cleaning up previous builds..."
rm -rf ${BUILD_DIR}
mkdir -p ${LAYER_PYTHON_DIR}
mkdir -p ${LAMBDA_DIR}

# Replace the Docker dependency installation with this direct approach
echo "Installing dependencies directly..."
pip install -r "${SRC_DIR}/api/requirements.txt" --target "${LAYER_PYTHON_DIR}"

# Copy application code
echo "Copying application code..."
mkdir -p ${LAMBDA_DIR}/api
cp -r ${SRC_DIR}/api/* ${LAMBDA_DIR}/api/

# Copy the existing Lambda handler
echo "Copying Lambda handler..."
cp "${SRC_DIR}/aws_lambda_handler.py" "${LAMBDA_DIR}/"

# Create Lambda layer package
echo "Creating Lambda layer package..."
echo "Checking layer directory contents:"
find ${LAYER_DIR} -type f | head -5
echo "Total files in layer directory: $(find ${LAYER_DIR} -type f | wc -l)"

# For quick testing, use an existing layer zip
if [ -f "lambda-layer.zip" ]; then
    echo "Using existing lambda-layer.zip file"
    cp lambda-layer.zip ${BUILD_DIR}/lambda-layer.zip
else
    # Create the layer zip ourselves
    cd ${LAYER_DIR}
    zip -r ../lambda-layer.zip python
fi

# Create Lambda function package
echo "Creating Lambda function package..."
cd ${LAMBDA_DIR}
zip -r ../lambda-function.zip .

# Update Lambda function code
echo "Updating Lambda function code..."
aws lambda update-function-code \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --zip-file fileb://${BUILD_DIR}/lambda-function.zip \
    --region ${AWS_REGION}

# Publish Lambda layer
echo "Publishing Lambda layer..."
LAYER_VERSION=$(aws lambda publish-layer-version \
    --layer-name "${LAMBDA_FUNCTION_NAME}-deps" \
    --description "Dependencies for Property Management API" \
    --zip-file fileb://${BUILD_DIR}/lambda-layer.zip \
    --compatible-runtimes ${PYTHON_RUNTIME} \
    --region ${AWS_REGION} \
    --query 'LayerVersionArn' \
    --output text)

# Update Lambda configuration to use the layer
echo "Configuring Lambda function to use layer: ${LAYER_VERSION}"
aws lambda update-function-configuration \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --layers ${LAYER_VERSION} \
    --region ${AWS_REGION}

echo "Deployment completed successfully!"
echo "Layer ARN: ${LAYER_VERSION}" 