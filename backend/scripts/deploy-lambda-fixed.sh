#!/bin/bash
set -ex

# Configuration
LAMBDA_FUNCTION_NAME="property-mgmt-lambda"
LAMBDA_LAYER_NAME="property-mgmt-lambda-layer"
AWS_REGION="us-west-1"  # Make sure this matches your Cognito region

# Build the packages if they don't exist
if [ ! -f "lambda.zip" ] || [ ! -f "lambda-layer.zip" ]; then
    echo "Lambda packages not found. Building them first..."
    bash scripts/package-lambda-docker-fixed.sh
fi

echo "Deploying Lambda function and layer..."

# Upload the Lambda code
aws lambda update-function-code \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --zip-file fileb://lambda.zip \
    --region ${AWS_REGION} \
    --output json

# Publish the layer
LAYER_VERSION_ARN=$(aws lambda publish-layer-version \
    --layer-name ${LAMBDA_LAYER_NAME} \
    --description "Dependencies for property management API" \
    --compatible-runtimes python3.11 \
    --compatible-architectures x86_64 \
    --zip-file fileb://lambda-layer.zip \
    --region ${AWS_REGION} \
    --query 'LayerVersionArn' \
    --output text)

echo "Layer published with ARN: ${LAYER_VERSION_ARN}"

# Update Lambda configuration to use the new layer
aws lambda update-function-configuration \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --layers ${LAYER_VERSION_ARN} \
    --handler aws_lambda_handler.handler \
    --region ${AWS_REGION} \
    --output json

echo "Lambda function updated successfully!"
echo "Next steps:"
echo "1. Check Lambda logs to verify the function is working correctly"
echo "2. Test the API Gateway endpoint"
