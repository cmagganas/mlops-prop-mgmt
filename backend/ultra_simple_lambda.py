def handler(event, context):
    """
    A minimal Lambda handler that doesn't use any external dependencies.
    This is just to verify Lambda execution basics are working.
    """
    print("Event received:", event)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": '{"message": "Hello from Lambda! This handler is working."}',
        "isBase64Encoded": False,
    }
