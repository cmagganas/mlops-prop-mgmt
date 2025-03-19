# Installation Testing Process

This document describes the automated testing process for the various installation profiles of the property management application.

## Overview

The project includes an automated test script (`tests/test_installation.sh`) that verifies all installation profiles work correctly by:

1. Creating an isolated test environment
2. Testing each installation profile in sequence
3. Verifying expected packages are installed
4. Checking environment variables are properly synchronized

## Installation Profiles Tested

The script tests the following installation profiles:

- **dev**: Full development setup with all tools and dependencies
- **prod**: Production dependencies without development tools
- **minimal**: Minimal installation with core functionality and auth only
- **custom components**: Custom combinations of components (e.g., auth,database)
- **individual components**: Testing specific components in isolation

## How the Test Works

The test script performs these steps for each profile:

1. **Setup**: Creates a temporary test directory with a copy of the project
2. **Environment**: Creates an isolated virtual environment
3. **Configuration**: Copies environment variables from .env.example
4. **Installation**: Executes the installation process for the profile
5. **Verification**: Checks for expected packages and environment variables
6. **Cleanup**: Removes temporary files and virtual environments

## Running the Tests

You can run the installation tests with:

```bash
# Make the test script executable
chmod +x tests/test_installation.sh

# Run the test script
./tests/test_installation.sh
```

The script will ask for confirmation before starting the tests, which may take several minutes to complete.

## Test Output

The script provides detailed output on each test phase and generates a summary at the end showing:

- Total number of tests run
- Number of tests passed
- Number of tests failed
- Location of detailed logs for any failed tests

A temporary directory named `installation_test` is created during testing, containing:
- A copy of the project
- Test logs for each installation profile
- A main log file with all test results

After testing, you'll be prompted whether to keep or remove this directory.

## Special Considerations

- The test script mocks npm installation to avoid actually installing Node.js dependencies
- It patches the run.sh script to work in a non-interactive mode
- It handles package name discrepancies (e.g., pre-commit vs pre_commit)
