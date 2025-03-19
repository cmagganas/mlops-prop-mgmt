#!/bin/bash

# test_installation.sh
# Automated test script for verifying the installation process

set -e  # Exit on any error

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TEST_DIR="$(pwd)/installation_test"
REPO_DIR="$TEST_DIR/mlops-prop-mgmt"
VENV_DIR="$TEST_DIR/test-venv"
LOG_FILE="$TEST_DIR/installation_test.log"
SUCCESS_COUNT=0
FAILURE_COUNT=0

# Print with timestamp
log() {
    local timestamp="[$(date +"%Y-%m-%d %H:%M:%S")]"
    local message="$timestamp $1"
    echo -e "$message"

    # Only write to log file if it exists
    if [ -f "$LOG_FILE" ]; then
        echo -e "$message" >> "$LOG_FILE"
    fi
}

# Ensure execution from project root
check_directory() {
    if [ ! -f "./pyproject.toml" ] || [ ! -f "./run.sh" ]; then
        echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
        echo -e "${YELLOW}Make sure pyproject.toml and run.sh exist in the current directory.${NC}"
        exit 1
    fi
}

# Setup test environment
setup() {
    echo -e "${BLUE}Setting up test environment...${NC}"

    # Create test directory if it doesn't exist
    mkdir -p "$TEST_DIR"

    # Create the repo directory
    mkdir -p "$REPO_DIR"

    # Create log file
    touch "$LOG_FILE"

    # Now that the log file exists, we can use the log function
    log "Installation test started at $(date)"

    # Copy current project to test directory
    log "Copying project to test directory..."
    rsync -a --exclude=venv --exclude=.venv --exclude=node_modules --exclude=.git ./ "$REPO_DIR/"

    log "${GREEN}Test environment setup complete.${NC}"
}

# Create a clean virtual environment
create_venv() {
    log "${BLUE}Creating virtual environment at $VENV_DIR...${NC}"
    python -m venv "$VENV_DIR"
    log "${GREEN}Virtual environment created.${NC}"
}

# Activate the virtual environment
activate_venv() {
    log "Activating virtual environment..."
    source "$VENV_DIR/bin/activate"
}

# Cleanup previous test
cleanup() {
    log "${BLUE}Cleaning up previous test...${NC}"

    # Deactivate virtual environment if active
    if [[ "$VIRTUAL_ENV" == "$VENV_DIR" ]]; then
        deactivate || true
    fi

    # Remove virtual environment
    if [ -d "$VENV_DIR" ]; then
        rm -rf "$VENV_DIR"
    fi

    # Remove node_modules if exists
    if [ -d "$REPO_DIR/frontend/node_modules" ]; then
        rm -rf "$REPO_DIR/frontend/node_modules"
    fi

    # Remove .env file
    if [ -f "$REPO_DIR/.env" ]; then
        rm -f "$REPO_DIR/.env"
    fi

    log "${GREEN}Cleanup complete.${NC}"
}

# Setup environment
setup_env() {
    log "${BLUE}Setting up environment variables...${NC}"
    if [ ! -f "$REPO_DIR/.env" ]; then
        if [ -f "$REPO_DIR/.env.example" ]; then
            cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
            log "Created .env file from .env.example"
        else
            log "${RED}No .env.example file found. Creating minimal .env file.${NC}"
            # Create a minimal .env file
            cat > "$REPO_DIR/.env" <<EOL
# Minimal environment configuration for testing
PROPMGMT_API_URL=http://localhost:8000
PROPMGMT_FRONTEND_URL=http://localhost:3000
PROPMGMT_DEBUG=true
REACT_APP_API_URL=http://localhost:8000
EOL
        fi
    fi
    log "${GREEN}Environment setup complete.${NC}"
}

# Mock npm install to avoid actually installing node modules
mock_npm_install() {
    log "${BLUE}Mocking npm install...${NC}"
    mkdir -p "$REPO_DIR/frontend/node_modules"
    touch "$REPO_DIR/frontend/node_modules/.test_marker"
    log "${GREEN}Mock npm installation complete.${NC}"
}

# Override functions in run.sh to avoid actual npm install
patch_run_sh() {
    log "${BLUE}Patching run.sh to avoid actual npm install...${NC}"
    # Create a backup
    cp "$REPO_DIR/run.sh" "$REPO_DIR/run.sh.bak"

    # Replace the install_frontend function
    sed -i.bak '/function install_frontend/,/^}/c\
function install_frontend {\
    echo "Installing frontend dependencies (MOCK for testing)..."\
    if [ ! -d "$THIS_DIR/frontend" ]; then\
        echo "Error: frontend directory not found in $THIS_DIR. Make sure you'\''re running this script from the project root."\
        exit 1\
    fi\
    mkdir -p "$THIS_DIR/frontend/node_modules";\
    touch "$THIS_DIR/frontend/node_modules/.test_marker";\
    echo "Frontend dependencies mocked successfully"\
}' "$REPO_DIR/run.sh"

    # Add a TESTING environment variable to run.sh
    echo -e "\n# Added for automated testing\nexport TESTING=true\n" >> "$REPO_DIR/run.sh"

    # Modify the install function to skip the prompt in testing mode
    sed -i.bak2 's/read -p "Run post-install cleanup to remove obsolete files? (y\/n): " run_cleanup/if [[ "$TESTING" == "true" ]]; then run_cleanup="y"; else read -p "Run post-install cleanup to remove obsolete files? (y\/n): " run_cleanup; fi/' "$REPO_DIR/run.sh"

    log "${GREEN}Patched run.sh successfully.${NC}"
}

# Restore original run.sh
restore_run_sh() {
    if [ -f "$REPO_DIR/run.sh.bak" ]; then
        mv "$REPO_DIR/run.sh.bak" "$REPO_DIR/run.sh"
        log "Restored original run.sh"
    fi
}

# Test installation profile
test_installation() {
    local profile="$1"
    local expected_packages="$2"

    log "${BLUE}===== Testing installation profile: $profile =====${NC}"

    # Clean up previous test
    cleanup

    # Create and activate venv
    create_venv
    activate_venv

    # Setup environment
    setup_env

    # Patch run.sh to mock npm install
    patch_run_sh

    # Change to repo directory
    cd "$REPO_DIR"

    # Run installation
    log "Running installation for profile: $profile"
    bash run.sh install "$profile" > "$TEST_DIR/install_$profile.log" 2>&1 || {
        log "${RED}Installation failed for profile: $profile${NC}"
        cat "$TEST_DIR/install_$profile.log" >> "$LOG_FILE"
        FAILURE_COUNT=$((FAILURE_COUNT+1))
        return 1
    }

    # Check for expected packages
    log "Checking installed packages..."
    local missing_packages=0
    for pkg in $expected_packages; do
        # Handle special case for pre-commit which is installed as pre_commit
        if [ "$pkg" == "pre-commit" ] && pip list | grep -i "pre_commit" > /dev/null; then
            continue
        elif ! pip list | grep -i "$pkg" > /dev/null; then
            log "${RED}Missing expected package: $pkg${NC}"
            missing_packages=$((missing_packages+1))
        fi
    done

    # Check if frontend dependencies are installed
    if [ ! -d "$REPO_DIR/frontend/node_modules" ]; then
        log "${RED}Frontend dependencies not installed${NC}"
        missing_packages=$((missing_packages+1))
    fi

    # Verify environment syncing
    if [ ! -f "$REPO_DIR/frontend/.env" ]; then
        log "${RED}Environment variables not synced to frontend${NC}"
        missing_packages=$((missing_packages+1))
    fi

    # Report result
    if [ $missing_packages -eq 0 ]; then
        log "${GREEN}Installation successful for profile: $profile${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT+1))
    else
        log "${RED}Installation verification failed for profile: $profile${NC}"
        log "${RED}$missing_packages expected components missing${NC}"
        FAILURE_COUNT=$((FAILURE_COUNT+1))
        return 1
    fi

    # Restore original run.sh
    restore_run_sh

    # Deactivate virtual environment
    deactivate
    return 0
}

# Test each installation profile
run_tests() {
    log "${BLUE}Starting installation tests...${NC}"

    # Test dev installation (was called "default" before)
    test_installation "dev" "fastapi uvicorn pydantic pre-commit pytest black"

    # Test prod installation
    test_installation "prod" "fastapi uvicorn pydantic authlib boto3"

    # Test minimal installation
    test_installation "minimal" "fastapi uvicorn pydantic authlib"

    # Test custom components installation
    test_installation "auth,database" "fastapi uvicorn pydantic authlib sqlalchemy"

    # Test individual component installation
    test_installation "database" "fastapi uvicorn pydantic sqlalchemy"
}

# Report results
report_results() {
    echo ""
    log "${BLUE}===== Installation Test Results =====${NC}"
    log "Total tests: $((SUCCESS_COUNT + FAILURE_COUNT))"
    log "${GREEN}Passed: $SUCCESS_COUNT${NC}"
    log "${RED}Failed: $FAILURE_COUNT${NC}"

    if [ $FAILURE_COUNT -eq 0 ]; then
        log "${GREEN}All installation profiles passed!${NC}"
    else
        log "${RED}Some installation profiles failed. Check the log for details: $LOG_FILE${NC}"
    fi
}

# Cleanup test directory after all tests
final_cleanup() {
    log "${BLUE}Cleaning up test environment...${NC}"
    if [ -d "$TEST_DIR" ]; then
        # Ask before removing
        read -p "Remove test directory? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$TEST_DIR"
            log "${GREEN}Test directory removed.${NC}"
        else
            log "${YELLOW}Test directory kept at: $TEST_DIR${NC}"
        fi
    fi
}

# Main function
main() {
    echo -e "${BLUE}===== Installation Test Script =====${NC}"
    echo -e "${YELLOW}This script will test all installation profiles to verify they work correctly.${NC}"
    echo -e "${YELLOW}It will create a temporary test environment and may take several minutes to complete.${NC}"
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Test cancelled.${NC}"
        exit 1
    fi

    check_directory
    setup
    run_tests
    report_results
    final_cleanup
}

# Run the script
main
