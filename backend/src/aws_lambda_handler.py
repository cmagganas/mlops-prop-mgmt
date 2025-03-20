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
handler = Mangum(app)

# For testing purposes only - will be removed in production
if __name__ == "__main__":
    print("Lambda handler created successfully!")
