import os
import sys

# Add the package directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from api.main import create_app
    from mangum import Mangum

    # Initialize the app
    app = create_app()

    # Create the handler
    handler = Mangum(app)

except Exception as e:
    # This will show up in CloudWatch logs
    import traceback

    print(f"Error initializing Lambda handler: {str(e)}")
    print(traceback.format_exc())

    # Create a simple handler that returns the error
    def handler(event, context):
        return {"statusCode": 500, "body": f"Application initialization error: {str(e)}"}
