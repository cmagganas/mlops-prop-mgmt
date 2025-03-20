#!/bin/bash
set -ex

# Configuration
LAMBDA_FUNCTION_NAME="property-mgmt-lambda"
LAMBDA_LAYER_NAME="property-mgmt-lambda-layer-arm64"
AWS_REGION="us-west-1"  # Make sure this matches your Cognito region

# Build the packages if they don't exist
if [ ! -f "lambda.zip" ] || [ ! -f "lambda-layer.zip" ]; then
    echo "Lambda packages not found. Building them first..."
    bash scripts/package-lambda-docker-fixed-arm64.sh
fi

echo "Deploying Lambda function and layer..."

# Upload the Lambda code
echo "Uploading Lambda function code..."
echo "This needs to be done manually through the AWS Console due to permission issues."
echo ""
echo "Manual steps:"
echo "1. Go to AWS Lambda console"
echo "2. Select your function: ${LAMBDA_FUNCTION_NAME}"
echo "3. Upload the lambda.zip file in the Code source section"
echo ""

# Publish the layer
echo "Manual steps for creating Lambda layer:"
echo "1. Go to AWS Lambda console > Layers"
echo "2. Click 'Create layer'"
echo "3. Name: ${LAMBDA_LAYER_NAME}"
echo "4. Upload the lambda-layer.zip file"
echo "5. Compatible runtimes: Python 3.11"
echo "6. Compatible architecture: arm64"
echo "7. Click 'Create'"
echo ""

echo "Manual steps to configure Lambda function with layer:"
echo "1. Go to your Lambda function"
echo "2. Scroll down to Layers section"
echo "3. Click 'Add a layer'"
echo "4. Select 'Custom layers'"
echo "5. Select the layer you just created: ${LAMBDA_LAYER_NAME}"
echo "6. Click 'Add'"
echo ""

echo "Preparation complete!"
echo "Follow the manual steps above to deploy to AWS."
