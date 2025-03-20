#!/bin/bash
set -ex

# Clean up artifacts
rm -rf lambda-env || true
rm -f lambda-layer.zip || true
rm -f lambda.zip || true

# Create directories for packaging
mkdir -p lambda-env/python
mkdir -p build

# Install dependencies to the lambda layer directory
pip install -t ./lambda-env/python -r requirements.txt

# Bundle frontend if it exists (check first if frontend build directory exists)
if [ -d "../frontend/build" ]; then
    echo "Including frontend build assets..."
    cp -r ../frontend/build/* ./src/api/static/
else
    echo "No frontend build found. Please run 'npm run build' in the frontend directory."
    echo "Continuing without frontend assets..."
fi

# Bundle dependencies in a layer zip file
cd lambda-env
zip -r ../lambda-layer.zip ./
cd ..

# Bundle application code in a separate zip file
cd src
zip -r ../lambda.zip ./
cd ..

echo "Created lambda-layer.zip (dependencies) and lambda.zip (application code)"
echo "You can now deploy these to AWS Lambda" 