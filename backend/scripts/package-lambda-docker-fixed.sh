#!/bin/bash
set -ex

# Clean up artifacts
rm -rf build/lambda-env || true
rm -f build/lambda-layer.zip || true
rm -f build/lambda.zip || true
rm -f lambda-layer.zip || true
rm -f lambda.zip || true

# Create build directory
mkdir -p build
BUILD_DIR="$(pwd)/build"
LAMBDA_LAYER_DIR="${BUILD_DIR}/lambda-env"
mkdir -p "${LAMBDA_LAYER_DIR}/python"

# Get user and group ID for Docker to use proper permissions
USER_ID=$(id -u)
GROUP_ID=$(id -g)

# Use the AWS Lambda Python image to ensure compatibility
docker logout || true  # log out to use the public ecr
# Use x86_64 architecture which matches AWS Lambda default
docker pull public.ecr.aws/lambda/python:3.11

# Install dependencies using the Lambda Docker image with proper permissions
docker run --rm \
    --user ${USER_ID}:${GROUP_ID} \
    --volume "$(pwd)":/out \
    --entrypoint /bin/bash \
    public.ecr.aws/lambda/python:3.11 \
    -c '\
    pip install --upgrade pip && \
    pip install \
        -r /out/requirements.txt \
        --target /out/build/lambda-env/python && \
    # Remove boto3 and botocore as they are provided by Lambda
    rm -rf /out/build/lambda-env/python/boto3 /out/build/lambda-env/python/botocore \
    '

# Bundle frontend if it exists (optional)
if [ -d "../frontend/build" ]; then
    echo "Including frontend build assets..."
    mkdir -p ./src/api/static
    cp -r ../frontend/build/* ./src/api/static/
else
    echo "No frontend build found. Continuing without frontend assets..."
fi

# Bundle dependencies in a layer zip file
cd "${LAMBDA_LAYER_DIR}"
zip -r ../lambda-layer.zip .

# Bundle application code in a separate zip file
cd "../../src"
zip -r ../build/lambda.zip .

# Copy zip files to root directory for easier access
cd ..
cp build/lambda-layer.zip .
cp build/lambda.zip .

echo "Created lambda-layer.zip (dependencies) and lambda.zip (application code)"
echo "You can now deploy these to AWS Lambda"

# Optional: Display the layer contents to verify
echo "Verifying Lambda layer contents..."
unzip -l lambda-layer.zip | grep pydantic
