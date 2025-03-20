#!/usr/bin/env python
"""
Local validation script for Lambda static file serving and FastAPI handling.

This script simulates the AWS Lambda environment locally to validate:
1. Static file serving with API Gateway stage prefix (/prod)
2. API endpoint functionality
3. Authentication flow handling

Usage:
    ./scripts/validate_lambda.py [--open-browser] [--port PORT]
"""

import argparse
import os
import shutil
import sys
import tempfile
import threading
import traceback
import webbrowser
from pathlib import Path

import uvicorn


def create_test_files(temp_dir: str) -> None:
    """Create test HTML, CSS, and JS files in the temp directory."""
    # Create index.html
    with open(os.path.join(temp_dir, "index.html"), "w") as f:
        f.write("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lambda Static File Test</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Lambda Static File Serving Test</h1>
        <p>If you see this page with styling, static file serving works!</p>
        <div id="test-result">JavaScript loading: Waiting...</div>
        <div id="api-result">API test: Not started</div>
        <button id="test-api">Test API</button>
    </div>
    <script src="script.js"></script>
</body>
</html>
        """.strip())

    # Create styles.css
    with open(os.path.join(temp_dir, "styles.css"), "w") as f:
        f.write("""
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background-color: #f4f4f9;
}
.container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
h1 {
    color: #4a5568;
    margin-top: 0;
}
#test-result, #api-result {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 4px;
}
#test-result {
    background-color: #fef3c7;
    color: #92400e;
}
#api-result {
    background-color: #e0f2fe;
    color: #075985;
}
button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}
button:hover {
    background-color: #2563eb;
}
        """.strip())

    # Create script.js
    with open(os.path.join(temp_dir, "script.js"), "w") as f:
        f.write("""
document.addEventListener('DOMContentLoaded', function() {
    // Test JavaScript loading
    document.getElementById('test-result').textContent = 'JavaScript loaded successfully!';
    document.getElementById('test-result').style.backgroundColor = '#dcfce7';
    document.getElementById('test-result').style.color = '#166534';
    
    // Setup API test button
    document.getElementById('test-api').addEventListener('click', async function() {
        const apiResult = document.getElementById('api-result');
        apiResult.textContent = 'Testing API...';
        
        try {
            // Test API endpoint with and without stage prefix
            const endpoints = ['/health', '/prod/health'];
            let successEndpoint = null;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const data = await response.json();
                        successEndpoint = endpoint;
                        apiResult.textContent = `API test successful on ${endpoint}! Response: ${JSON.stringify(data)}`;
                        apiResult.style.backgroundColor = '#dcfce7';
                        apiResult.style.color = '#166534';
                        break;
                    }
                } catch (err) {
                    console.error(`Error testing ${endpoint}:`, err);
                }
            }
            
            if (!successEndpoint) {
                apiResult.textContent = 'API test failed on all endpoints.';
                apiResult.style.backgroundColor = '#fee2e2';
                apiResult.style.color = '#b91c1c';
            }
        } catch (err) {
            apiResult.textContent = `API test error: ${err.message}`;
            apiResult.style.backgroundColor = '#fee2e2';
            apiResult.style.color = '#b91c1c';
        }
    });
});
        """.strip())


def setup_environment(temp_dir: str) -> None:
    """Set up environment variables for the test."""
    # Set AWS environment variables
    os.environ["AWS_REGION"] = "us-west-1"
    os.environ["AWS_ACCESS_KEY_ID"] = "mock-access-key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "mock-secret-key"
    os.environ["AWS_SESSION_TOKEN"] = "mock-session-token"
    os.environ["STATIC_FILES_DIR"] = temp_dir
    
    # Set Cognito environment variables
    os.environ["REACT_APP_COGNITO_REGION"] = "us-west-1"
    os.environ["REACT_APP_COGNITO_USER_POOL_ID"] = "us-west-1_mockpool"
    os.environ["REACT_APP_COGNITO_CLIENT_ID"] = "mock-client-id"
    os.environ["REACT_APP_COGNITO_CLIENT_SECRET"] = "mock-client-secret"
    os.environ["REACT_APP_REDIRECT_URI"] = f"http://localhost:8000/auth/callback"
    os.environ["REACT_APP_DEBUG"] = "true"
    
    # Print environment variables for debugging
    print("\nEnvironment Variables:")
    for key, value in sorted(
        [(k, v) for k, v in os.environ.items() if k.startswith(("AWS_", "REACT_APP_", "STATIC_"))],
        key=lambda x: x[0]
    ):
        if "SECRET" in key or "KEY" in key:
            print(f"  {key}=***REDACTED***")
        else:
            print(f"  {key}={value}")


def start_server(port: int) -> None:
    """Start the FastAPI server in simulation mode."""
    print("\n" + "-" * 60)
    print(f"Starting server on http://localhost:{port}")
    print("Simulating AWS Lambda environment with API Gateway stage: /prod")
    print("\nTest instructions:")
    print(f"1. Open your browser to http://localhost:{port}/prod")
    print("2. Verify the page loads with proper styling")
    print("3. Check that the JavaScript test passes")
    print("4. Click 'Test API' to validate API endpoints")
    print("5. Check browser console for any 404 errors")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 60 + "\n")

    # Add backend/src directory to sys.path
    script_dir = Path(__file__).parent
    backend_src_dir = script_dir.parent / "backend" / "src"
    if backend_src_dir.exists():
        sys.path.append(str(backend_src_dir))
    else:
        backend_src_dir = script_dir.parent / "backend"
        if backend_src_dir.exists():
            sys.path.append(str(backend_src_dir))
    
    print(f"Looking for API module in: {backend_src_dir}")
    print(f"Python path: {sys.path}")

    # Import FastAPI application
    try:
        # Try importing from backend module structure first
        try:
            from api.main import create_app
        except ImportError:
            # Fall back to backend.api module structure
            from backend.api.main import create_app
        
        app = create_app()
        uvicorn.run(app, host="0.0.0.0", port=port)
    except ImportError:
        print("ERROR: Could not import the FastAPI application.")
        print("Make sure the backend/src directory is in your PYTHONPATH.")
        print("Try running this script from the project root directory.")
        print(f"Current directory: {os.getcwd()}")
        print("Checking for possible module paths:")
        for path in sys.path:
            if os.path.exists(os.path.join(path, "api")):
                print(f"  Found 'api' in {path}")
            if os.path.exists(os.path.join(path, "backend")):
                print(f"  Found 'backend' in {path}")
        raise


def cleanup(temp_dir: str) -> None:
    """Clean up temporary files and reset environment."""
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    # Reset environment variables
    for var in [
        "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY",
        "AWS_SESSION_TOKEN", "STATIC_FILES_DIR", 
        "REACT_APP_COGNITO_REGION", "REACT_APP_COGNITO_USER_POOL_ID",
        "REACT_APP_COGNITO_CLIENT_ID", "REACT_APP_COGNITO_CLIENT_SECRET",
        "REACT_APP_REDIRECT_URI", "REACT_APP_DEBUG"
    ]:
        if var in os.environ:
            del os.environ[var]


def main() -> None:
    """Run the validation script."""
    parser = argparse.ArgumentParser(
        description="Validate Lambda static file serving locally"
    )
    parser.add_argument(
        "--open-browser",
        action="store_true",
        help="Automatically open browser when server starts",
    )
    parser.add_argument(
        "--port", type=int, default=8000, help="Port to run the server on"
    )
    args = parser.parse_args()

    # Create temporary directory for static files
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Set up environment variables
        setup_environment(temp_dir)
        
        # Create test files
        create_test_files(temp_dir)
        
        # Open browser if requested
        if args.open_browser:
            url = f"http://localhost:{args.port}/prod"
            threading.Timer(2.0, lambda: webbrowser.open(url)).start()
        
        # Start the server
        start_server(args.port)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception:  # pylint: disable=broad-except
        print("Error during server startup:")
        traceback.print_exc()
    finally:
        cleanup(temp_dir)


if __name__ == "__main__":
    main()
