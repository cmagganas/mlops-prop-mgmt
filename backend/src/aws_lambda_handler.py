"""
AWS Lambda handler for the Property Management API.

This module serves as the entry point for AWS Lambda when deployed.
It wraps the FastAPI application with Mangum to adapt it for Lambda and API Gateway.
"""

from api.main import create_app
from mangum import Mangum

# Create the FastAPI application
app = create_app()

# Create the Lambda handler using Mangum
# Configure Mangum to properly handle API Gateway stage name
# - strip_base_path=False: Don't strip the base path (API Gateway stage name)
# - lifespan="off": Disable lifespan events for better Lambda compatibility
# - api_gateway_base_path="prod": The API Gateway stage name
handler = Mangum(
    app, 
    lifespan="off",
    api_gateway_base_path="prod",
    strip_base_path=False
)

# For testing purposes only - will be removed in production
if __name__ == "__main__":
    print("Lambda handler created successfully!")
