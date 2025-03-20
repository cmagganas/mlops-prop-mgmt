from api.main import create_app
from mangum import Mangum

# Initialize the FastAPI application
app = create_app()

# Create the handler for AWS Lambda
handler = Mangum(app)
