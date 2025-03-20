#!/bin/bash
set -ex

# Clean up artifacts
rm -rf lambda-env || true
rm -f lambda-layer.zip || true
rm -f lambda.zip || true

# Use the AWS Lambda Python image to ensure compatibility
docker logout || true  # log out to use the public ecr
docker pull public.ecr.aws/lambda/python:3.11-arm64

# Install dependencies using the Lambda Docker image
docker run --rm \
    --volume $(pwd):/out \
    --entrypoint /bin/bash \
    public.ecr.aws/lambda/python:3.11-arm64 \
    -c ' \
    pip install \
        -r /out/requirements.txt \
        --target /out/lambda-env/python \
    '

# Bundle frontend if it exists (check if frontend build directory exists)
if [ -d "../frontend/build" ]; then
    echo "Including frontend build assets..."
    mkdir -p ./src/api/static
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