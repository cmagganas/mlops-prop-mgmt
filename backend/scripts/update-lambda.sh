#!/bin/bash
set -e

# Configuration
LAMBDA_FUNCTION_NAME=${LAMBDA_FUNCTION_NAME:-"property-mgmt-lambda"}
AWS_REGION=${AWS_REGION:-"us-west-1"}

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
  
  if [ -z "$AWS_REGION" ]; then
    read -p "Enter AWS Region [$AWS_REGION]: " input_region
    export AWS_REGION=${input_region:-$AWS_REGION}
  fi
}

# Navigate to the backend directory
cd "$(dirname "$0")/.."

# Clean up previous builds
rm -f lambda.zip
rm -rf build
mkdir -p build

# Check AWS CLI configuration
echo "Checking AWS CLI configuration..."
if ! aws sts get-caller-identity &>/dev/null; then
  echo "AWS CLI is not configured properly."
  
  # Prompt for credentials interactively
  prompt_for_credentials
  
  # Verify credentials again
  if ! aws sts get-caller-identity &>/dev/null; then
    echo "Authentication failed. Please check your credentials."
    exit 1
  fi
fi

echo "AWS authentication successful!"
echo "Packaging Lambda code for function: $LAMBDA_FUNCTION_NAME in region: $AWS_REGION"

# Check if frontend build exists
if [ -d "../frontend/build" ]; then
  # Copy frontend build to static directory
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

echo "Creating Lambda package..."
cd ./src
zip -r ../lambda.zip .

cd ..
echo "Deploying Lambda function..."

aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --zip-file fileb://lambda.zip \
  --region "$AWS_REGION" \
  --output json

echo "Lambda function updated successfully!"
echo ""
echo "Next steps:"
echo "1. Check Lambda CloudWatch logs to verify function is running correctly"
echo "2. Test API Gateway endpoint: https://<api-id>.execute-api.$AWS_REGION.amazonaws.com/prod/"
echo "3. Verify static files are being served correctly"
