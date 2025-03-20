#!/usr/bin/env python
"""Validation script for testing the Lambda static file serving fixes.

This script:
1. Simulates the AWS Lambda environment locally
2. Creates test static files
3. Starts a FastAPI server with the Lambda configuration
4. Validates that static files are served correctly with the stage prefix
"""

import os
import sys
import tempfile
import shutil
import webbrowser
from pathlib import Path
import time
import threading
import uvicorn
import contextlib
import argparse

# Parse command line arguments
parser = argparse.ArgumentParser(description="Validate static file serving in Lambda environment")
parser.add_argument("--open-browser", action="store_true", help="Open browser automatically")
parser.add_argument("--port", type=int, default=8000, help="Port to run the test server on")
args = parser.parse_args()

# Add the src directory to the path
script_dir = Path(__file__).parent
src_dir = script_dir.parent / "src"
sys.path.append(str(src_dir))

# Create a temporary directory for test files
temp_dir = Path(tempfile.mkdtemp())
static_dir = temp_dir / "api" / "static"
os.makedirs(static_dir, exist_ok=True)

# Set environment variables to simulate Lambda
os.environ["AWS_LAMBDA_FUNCTION_NAME"] = "test-function"

# Set mock Cognito settings for testing - using REACT_APP_ prefix as specified in config.py
os.environ["REACT_APP_COGNITO_REGION"] = "mock-region"
os.environ["REACT_APP_COGNITO_USER_POOL_ID"] = "mock-user-pool-id"
os.environ["REACT_APP_COGNITO_CLIENT_ID"] = "mock-client-id"
os.environ["REACT_APP_COGNITO_CLIENT_SECRET"] = "mock-client-secret"
os.environ["REACT_APP_REDIRECT_URI"] = "http://localhost:8000/auth/callback"
os.environ["TESTING"] = "true"
os.environ["REACT_APP_DEBUG"] = "true"

# Create test assets
def create_test_files():
    """Create test HTML and asset files."""
    # Create index.html
    with open(static_dir / "index.html", "w") as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
    <title>Lambda Static File Test</title>
    <link rel="stylesheet" href="/css/styles.css">
    <script src="/js/app.js"></script>
</head>
<body>
    <div class="container">
        <h1>Lambda Static File Serving Test</h1>
        <p>This page tests if static files are correctly served with stage prefix.</p>
        <div id="status">Loading assets...</div>
        <div class="buttons">
            <button onclick="testFetch('/api/healthz')">Test API Health</button>
            <button onclick="testFetch('/prod/api/healthz')">Test API with /prod/</button>
        </div>
        <div id="results"></div>
    </div>
</body>
</html>
""")
    
    # Create CSS directory and file
    os.makedirs(static_dir / "css", exist_ok=True)
    with open(static_dir / "css" / "styles.css", "w") as f:
        f.write("""
body {
    font-family: Arial, sans-serif;
    margin: 40px;
    background-color: #f5f5f5;
}
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
h1 {
    color: #2c3e50;
}
#status {
    padding: 10px;
    margin: 20px 0;
    border-radius: 4px;
    font-weight: bold;
}
.success {
    background-color: #d4edda;
    color: #155724;
}
.error {
    background-color: #f8d7da;
    color: #721c24;
}
.buttons {
    margin: 20px 0;
}
button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
}
#results {
    margin-top: 20px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
}
""")
    
    # Create JS directory and file
    os.makedirs(static_dir / "js", exist_ok=True)
    with open(static_dir / "js" / "app.js", "w") as f:
        f.write("""
document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    
    // Check if CSS was loaded properly
    const isCssLoaded = Array.from(document.styleSheets).some(sheet => {
        return sheet.href && sheet.href.includes('/css/styles.css');
    });
    
    if (isCssLoaded) {
        statusDiv.textContent = 'CSS loaded successfully!';
        statusDiv.classList.add('success');
    } else {
        statusDiv.textContent = 'CSS failed to load properly';
        statusDiv.classList.add('error');
    }
    
    // Add info about environment
    resultsDiv.innerHTML = `
        <h3>Environment Info:</h3>
        <pre>
Protocol: ${window.location.protocol}
Host: ${window.location.host}
Path: ${window.location.pathname}
Base URL: ${window.location.origin}
CSS URL: ${Array.from(document.styleSheets).map(s => s.href).join('\\n        ')}
JS Path: ${document.currentScript ? document.currentScript.src : 'unknown'}
        </pre>
    `;
    
    console.log('Script loaded successfully');
});

function testFetch(url) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML += `<p>Fetching: ${url}...</p>`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            resultsDiv.innerHTML += `<p class="success">Success: ${JSON.stringify(data)}</p>`;
        })
        .catch(error => {
            resultsDiv.innerHTML += `<p class="error">Error: ${error.message}</p>`;
        });
}
""")

def start_server(port):
    """Start a FastAPI server with our application."""
    # Import our app only after setting up the environment
    from api.main import create_app
    app = create_app()
    
    print(f"Starting test server on http://localhost:{port}")
    print("The server is configured to simulate Lambda environment")
    print(f"- Running with AWS_LAMBDA_FUNCTION_NAME={os.environ.get('AWS_LAMBDA_FUNCTION_NAME')}")
    print(f"- Using static files from {static_dir}")
    print("- Using mock Cognito settings (with REACT_APP_ prefix) for testing")
    print()
    print("This test validates:")
    print("1. Static file serving with stage prefix (/prod/)")
    print("2. HTML content modification for static assets")
    print("3. API endpoint access with and without stage prefix")
    print()
    print("Press Ctrl+C to stop the server and clean up")
    
    # Open browser if requested
    if args.open_browser:
        threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    
    # Start the server
    uvicorn.run(app, host="127.0.0.1", port=port)

def cleanup():
    """Clean up temporary files and environment variables."""
    shutil.rmtree(temp_dir, ignore_errors=True)
    # Remove environment variables we set
    for var in ["AWS_LAMBDA_FUNCTION_NAME", "REACT_APP_COGNITO_REGION", "REACT_APP_COGNITO_USER_POOL_ID", 
                "REACT_APP_COGNITO_CLIENT_ID", "REACT_APP_COGNITO_CLIENT_SECRET", 
                "REACT_APP_REDIRECT_URI", "TESTING", "REACT_APP_DEBUG"]:
        os.environ.pop(var, None)
    print("\nCleanup completed. Temporary files and environment variables removed.")

# Main execution
try:
    print("Setting up test environment...")
    create_test_files()
    
    # Print test instructions
    print("\n" + "="*50)
    print("TEST VALIDATION INSTRUCTIONS:")
    print("="*50)
    print("1. Open http://localhost:8000 in your browser")
    print("2. Verify the page loads with proper styling (CSS is working)")
    print("3. Verify the JavaScript status shows 'CSS loaded successfully!'")
    print("4. Test API endpoints with both buttons")
    print("5. Check browser developer tools (Network tab) for any 404 errors")
    print("6. Inspect CSS and JS links in browser dev tools to confirm path structure")
    print("="*50 + "\n")
    
    # Start the server
    start_server(args.port)
    
except KeyboardInterrupt:
    print("\nTest server stopped by user.")
except Exception as e:
    print(f"\nAn error occurred: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    cleanup() 