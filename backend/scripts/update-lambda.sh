#!/bin/bash
set -ex

# Configuration
LAMBDA_FUNCTION_NAME="property-mgmt-lambda"
AWS_REGION="us-west-1"

# Navigate to the backend directory
cd "$(dirname "$0")/.."

# Clean up previous builds
rm -f lambda.zip
rm -rf build
mkdir -p build

# Check AWS CLI configuration
echo "Checking AWS CLI configuration..."
if ! aws sts get-caller-identity &>/dev/null; then
  echo "AWS CLI is not configured properly. Please run 'aws configure' to set up your credentials."
  echo "You may need to create or select a profile with the right permissions."
  echo "Alternatives:"
  echo "1. Use AWS_PROFILE environment variable: AWS_PROFILE=your-profile $0"
  echo "2. Set AWS credentials directly: AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... $0"
  exit 1
fi

echo "Packaging Lambda code only (without layer)..."

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