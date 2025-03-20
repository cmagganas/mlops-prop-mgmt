#!/bin/bash
set -e

# Configuration
LAMBDA_FUNCTION_NAME=${LAMBDA_FUNCTION_NAME:-"property-mgmt-lambda"}
AWS_REGION=${AWS_REGION:-"us-west-1"}
PACKAGE_LAYER=${PACKAGE_LAYER:-false}
INCLUDE_FRONTEND=${INCLUDE_FRONTEND:-true}

# Usage function
usage() {
  echo "Lambda Deployment Script for Property Management API"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --function-name NAME   Lambda function name (default: $LAMBDA_FUNCTION_NAME)"
  echo "  --region REGION        AWS region (default: $AWS_REGION)"
  echo "  --package-layer        Also package and update the Lambda layer"
  echo "  --no-frontend          Don't include frontend assets"
  echo "  --help                 Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --function-name my-lambda --region us-east-1 --package-layer"
  exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --function-name)
      LAMBDA_FUNCTION_NAME="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --package-layer)
      PACKAGE_LAYER=true
      shift
      ;;
    --no-frontend)
      INCLUDE_FRONTEND=false
      shift
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Functions
prompt_for_credentials() {
  echo "AWS credentials required for deployment"

  if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
    export AWS_ACCESS_KEY_ID
  fi

  if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    read -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    export AWS_SECRET_ACCESS_KEY
  fi

  # For SSO/temporary credentials, we also need a session token
  if [[ "$AWS_ACCESS_KEY_ID" == ASIA* ]]; then
    echo "Detected temporary credentials (SSO or STS)"
    if [ -z "$AWS_SESSION_TOKEN" ]; then
      read -p "Enter AWS Session Token: " AWS_SESSION_TOKEN
      export AWS_SESSION_TOKEN
    fi
  fi
}

# Navigate to the backend directory
cd "$(dirname "$0")/../backend"

# Clean up previous builds
rm -f lambda.zip lambda-layer.zip
rm -rf build
mkdir -p build

# Check AWS CLI configuration
echo "Checking AWS CLI configuration..."
if ! aws sts get-caller-identity &>/dev/null; then
  echo "AWS CLI is not configured properly."
  prompt_for_credentials

  # Verify credentials again
  if ! aws sts get-caller-identity &>/dev/null; then
    echo "Authentication failed. Please check your credentials."
    echo ""
    echo "IMPORTANT: For SSO/temporary credentials (Access Key IDs starting with 'ASIA'),"
    echo "you must also provide an AWS_SESSION_TOKEN along with your access key and secret."
    exit 1
  fi
fi

echo "AWS authentication successful!"
echo "Deploying Lambda function: $LAMBDA_FUNCTION_NAME in region: $AWS_REGION"

# Package the Lambda function code
echo "Creating Lambda function package..."

# Include frontend assets if specified
if [ "$INCLUDE_FRONTEND" = true ]; then
  if [ -d "../frontend/build" ]; then
    echo "Including frontend build assets..."
    mkdir -p ./src/api/static
    cp -r ../frontend/build/* ./src/api/static/
  else
    echo "No frontend build found. Creating a minimal index.html for testing..."
    mkdir -p ./src/api/static
    cat > ./src/api/static/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Static File Test</title>
  <link rel="stylesheet" href="/css/test.css">
  <script src="/js/test.js"></script>
</head>
<body>
  <h1>Static File Test</h1>
  <p>This is a test HTML file to verify static file serving with API Gateway stage name.</p>
  <p>If you can see this page with proper styling and the button works, then static file serving is working correctly!</p>
  <button id="testButton">Click Me</button>
  <div id="result"></div>
</body>
</html>
EOF

    mkdir -p ./src/api/static/css
    cat > ./src/api/static/css/test.css << EOF
body {
  font-family: Arial, sans-serif;
  margin: 40px;
  background-color: #f5f5f5;
}
h1 {
  color: #2c3e50;
}
p {
  color: #333;
}
button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
#result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
}
EOF

    mkdir -p ./src/api/static/js
    cat > ./src/api/static/js/test.js << EOF
document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('testButton');
  const result = document.getElementById('result');

  button.addEventListener('click', function() {
    result.textContent = 'JavaScript is working! Button clicked at ' + new Date().toLocaleTimeString();
  });

  console.log('Page loaded with correct JavaScript file');
});
EOF
  fi
fi

# Create Lambda code package
cd ./src
zip -r ../lambda.zip .
cd ..

echo "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --zip-file fileb://lambda.zip \
  --region "$AWS_REGION" \
  --output json

# Package and update the Lambda layer if requested
if [ "$PACKAGE_LAYER" = true ]; then
  echo "Creating Lambda layer package..."
  mkdir -p build/python
  pip install -r requirements.txt -t build/python

  # Remove unnecessary files to reduce package size
  find build/python -name "*.pyc" | xargs rm -f
  find build/python -name "__pycache__" | xargs rm -rf
  find build/python -name "*.dist-info" | xargs rm -rf

  # Create Lambda layer zip
  cd build
  zip -r ../lambda-layer.zip python
  cd ..

  echo "Updating Lambda layer..."
  LAYER_VERSION=$(aws lambda publish-layer-version \
    --layer-name "${LAMBDA_FUNCTION_NAME}-layer" \
    --zip-file fileb://lambda-layer.zip \
    --compatible-runtimes python3.11 \
    --region "$AWS_REGION" \
    --output json)

  LAYER_VERSION_ARN=$(echo $LAYER_VERSION | jq -r '.LayerVersionArn')

  # Update the function to use the new layer
  aws lambda update-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --layers "$LAYER_VERSION_ARN" \
    --region "$AWS_REGION"
fi

echo "Lambda deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Check Lambda CloudWatch logs to verify function is running correctly"
echo "2. Test API Gateway endpoint: https://<api-id>.execute-api.$AWS_REGION.amazonaws.com/prod/"
