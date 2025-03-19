#!/bin/bash

set -e

#####################
# --- Constants --- #
#####################

THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
MINIMUM_TEST_COVERAGE_PERCENT=0


##########################
# --- Task Functions --- #
##########################


function build {
    # build the frontend to static, minified files
    # export .env file so that the right values get substituted into the frontend
    # during the build, e.g. the cognito user pool id
    rm -rf "$THIS_DIR/frontend/build" || true
    source "$THIS_DIR/frontend/.env"
    cd "$THIS_DIR/frontend" && npm run build

    # copy them into the backend dir to be packaged
    rm -rf "$THIS_DIR/backend/src/api/static" || true
    cp -r "$THIS_DIR/frontend/build" "$THIS_DIR/backend/src/api/static"
}

function serve {
    cd "$THIS_DIR/backend"
    source "$THIS_DIR/frontend/.env"
    uv run -m api.main
}

# Copy environment variables from root .env to frontend/.env
function sync_env {
    echo "Syncing environment variables from root .env to frontend/.env..."

    # Check if root .env exists
    if [ ! -f "$THIS_DIR/.env" ]; then
        echo "Error: .env file not found in $THIS_DIR. Please create it from .env.example first."
        exit 1
    fi

    # Extract and write only REACT_APP_ variables to frontend/.env
    grep "^REACT_APP_" "$THIS_DIR/.env" > "$THIS_DIR/frontend/.env"

    echo "Environment variables synced successfully!"
}

# install backend Python dependencies into the currently activated venv
function install_backend {
    echo "Installing backend dependencies..."
    # Check if pyproject.toml exists in the current directory
    if [ ! -f "$THIS_DIR/pyproject.toml" ]; then
        echo "Error: pyproject.toml not found in $THIS_DIR. Make sure you're running this script from the project root."
        exit 1
    fi

    python -m pip install --upgrade pip

    # Installation profiles
    local install_type=${1:-"dev"}

    case "$install_type" in
        "dev")
            # Full development installation with all tools
            echo "Installing development dependencies (full)..."
            python -m pip install --editable "$THIS_DIR/[dev]"
            ;;
        "prod")
            # Production dependencies (everything except dev tools)
            echo "Installing production dependencies..."
            python -m pip install --editable "$THIS_DIR/[prod]"
            ;;
        "minimal")
            # Minimal installation with just core and auth
            echo "Installing minimal dependencies (core + auth)..."
            python -m pip install --editable "$THIS_DIR/[auth]"
            ;;
        "custom")
            # Get custom component list
            read -p "Enter component list (comma-separated, e.g. 'auth,database,aws'): " components
            echo "Installing custom components: $components"
            python -m pip install --editable "$THIS_DIR/[$components]"
            ;;
        *)
            # Specific component
            echo "Installing component: $install_type"
            python -m pip install --editable "$THIS_DIR/[$install_type]"
            ;;
    esac

    # Install pre-commit hooks if pre-commit is installed and we're in dev mode
    if [[ "$install_type" == "dev" ]] && command -v pre-commit >/dev/null 2>&1; then
        echo "Setting up pre-commit hooks..."
        pre-commit install
    elif [[ "$install_type" == "dev" ]]; then
        echo "pre-commit not found. Hooks not installed. Run 'pip install pre-commit' and then 'pre-commit install' to set up hooks."
    fi

    echo "Backend installation completed for profile: $install_type"
}

# Install frontend Node.js dependencies
function install_frontend {
    echo "Installing frontend dependencies..."
    if [ ! -d "$THIS_DIR/frontend" ]; then
        echo "Error: frontend directory not found in $THIS_DIR. Make sure you're running this script from the project root."
        exit 1
    fi

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo "Error: npm is required but not found. Please install Node.js and npm."
        exit 1
    fi

    # Sync environment variables before installing
    sync_env

    cd "$THIS_DIR/frontend" && npm install
    echo "Frontend dependencies installed successfully"
}

# remove obsolete requirements files since we're using pyproject.toml
function cleanup_requirements {
    echo "Checking for obsolete requirements files..."

    # List of files to check
    files=(
        "$THIS_DIR/backend/requirements.txt"
        "$THIS_DIR/backend/requirements.dev.txt"
    )

    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "Found obsolete file: $file"
            read -p "Remove it? (y/n): " choice
            if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
                rm "$file"
                echo "Removed: $file"
            else
                echo "Kept: $file"
            fi
        fi
    done

    echo "Requirements cleanup completed."
}

# execute after installation to ensure project structure is clean
function post_install_cleanup {
    cleanup_requirements
}

# Update the install function to run post-install cleanup
function install {
    local install_type=${1:-"dev"}

    # Handle the special case for custom component selection
    if [[ "$install_type" == "custom" ]]; then
        install_backend "custom"
    else
        install_backend "$install_type"
    fi

    install_frontend

    # Ask if user wants to run cleanup
    echo ""
    read -p "Run post-install cleanup to remove obsolete files? (y/n): " run_cleanup
    if [[ "$run_cleanup" == "y" || "$run_cleanup" == "Y" ]]; then
        post_install_cleanup
    fi

    echo "All dependencies installed successfully!"
}

# Display help for installation options
function install_help {
    echo "=================================="
    echo "Installation Options"
    echo "=================================="
    echo "Usage: ./run.sh install [OPTION]"
    echo ""
    echo "Available options:"
    echo "  dev             Full development setup with all dependencies and tools (default)"
    echo "  prod            Production dependencies only (no test/dev tools)"
    echo "  minimal         Minimal installation with core functionality and auth only"
    echo "  custom          Interactive prompt to select specific components"
    echo "  auth            Authentication components only"
    echo "  database        Database components only"
    echo "  aws             AWS integration components only"
    echo "  http-client     HTTP client components only"
    echo "  static-code-qa  Code quality tools only"
    echo "  test            Testing tools only"
    echo ""
    echo "Examples:"
    echo "  ./run.sh install               # Install dev dependencies (default)"
    echo "  ./run.sh install prod          # Install production dependencies"
    echo "  ./run.sh install auth,database # Install auth and database components only"
    echo "  ./run.sh install custom        # Interactive component selection"
    echo ""
    echo "Note: Frontend dependencies are always installed by default."
    echo "=================================="
}

# run linting, formatting, and other static code quality tools
function lint {
    pre-commit run --all-files
}

# same as `lint` but with any special considerations for CI
function lint:ci {
    # We skip no-commit-to-branch since that blocks commits to `main`.
    # All merged PRs are commits to `main` so this must be disabled.
    SKIP=no-commit-to-branch pre-commit run --all-files
}

# execute tests that are not marked as `slow` and exclude auth tests
function test:quick {
    run-tests "-m" "not slow" "-k" "not aws and not test_aws_cognito" ${@}
}

# execute tests against the installed package; assumes the wheel is already installed
function test:ci {
    INSTALLED_PKG_DIR="$(python -c 'import backend.app; print(backend.app.__path__[0])')"
    # in CI, we must calculate the coverage for the installed package, not the src/ folder
    COVERAGE_DIR="$INSTALLED_PKG_DIR" run-tests
}

# (example) ./run.sh test tests/test_states_info.py::test__slow_add
function run-tests {
    PYTEST_EXIT_STATUS=0

    # clean the test-reports dir
    rm -rf "$THIS_DIR/test-reports" || mkdir "$THIS_DIR/test-reports"

    # execute the tests, calculate coverage, and generate coverage reports in the test-reports dir
    python -m pytest ${@:-"$THIS_DIR/tests/"} \
        --cov "${COVERAGE_DIR:-$THIS_DIR/backend}" \
        --cov-report html \
        --cov-report term \
        --cov-report xml \
        --junit-xml "$THIS_DIR/test-reports/report.xml" \
        --cov-fail-under "$MINIMUM_TEST_COVERAGE_PERCENT" || ((PYTEST_EXIT_STATUS+=$?))
    mv coverage.xml "$THIS_DIR/test-reports/" || true
    mv htmlcov "$THIS_DIR/test-reports/" || true
    mv .coverage "$THIS_DIR/test-reports/" || true
    return $PYTEST_EXIT_STATUS
}

function test:wheel-locally {
    deactivate || true
    rm -rf test-env || true
    python -m venv test-env
    source test-env/bin/activate
    clean || true
    pip install build
    build
    pip install ./dist/*.whl pytest pytest-cov
    test:ci
    deactivate || true
}

# serve the html test coverage report on localhost:8000
function serve-coverage-report {
    python -m http.server --directory "$THIS_DIR/test-reports/htmlcov/" 8000
}


function release:test {
    lint
    clean
    build
    publish:test
}

function release:prod {
    release:test
    publish:prod
}

function publish:test {
    try-load-dotenv || true
    twine upload dist/* \
        --repository testpypi \
        --username=__token__ \
        --password="$TEST_PYPI_TOKEN"
}

function publish:prod {
    try-load-dotenv || true
    twine upload dist/* \
        --repository pypi \
        --username=__token__ \
        --password="$PROD_PYPI_TOKEN"
}

# remove all files generated by tests, builds, or operating this codebase
function clean {
    rm -rf dist build coverage.xml test-reports
    find . \
      -type d \
      \( \
        -name "*cache*" \
        -o -name "*.dist-info" \
        -o -name "*.egg-info" \
        -o -name "*htmlcov" \
      \) \
      -not -path "*env/*" \
      -exec rm -r {} + || true

    find . \
      -type f \
      -name "*.pyc" \
      -not -path "*env/*" \
      -exec rm {} +
}

# export the contents of .env as environment variables
function try-load-dotenv {
    if [ ! -f "$THIS_DIR/.env" ]; then
        echo "no .env file found"
        return 1
    fi

    while read -r line; do
        export "$line"
    done < <(grep -v '^#' "$THIS_DIR/.env" | grep -v '^$')
}

# print all functions in this file
function help {
    echo "$0 <task> <args>"
    echo "Tasks:"
    compgen -A function | grep -v "^_" | sort | cat -n
    echo ""
    echo "For detailed installation options: $0 install_help"
}

# run the FastAPI application
function run_backend {
    echo "Starting FastAPI application..."
    echo "View the API docs at: http://localhost:8000/docs"
    echo "View the HTML reports at: http://localhost:8000/report-viewer/"
    python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
}

# run the frontend React application
function run_frontend {
    echo "Starting React frontend application..."
    echo "View the frontend at: http://localhost:3000"
    cd "$THIS_DIR/frontend" && npm start
}

# run both backend and frontend in parallel
function run_all {
    echo "Starting both backend and frontend applications..."
    # Use & to run in background and wait to keep both processes running
    run_backend & run_frontend &
    wait
}

# run the application (backend, frontend, or both)
function run {
    local component=${1:-"backend"}

    case "$component" in
        backend)
            run_backend
            ;;
        frontend)
            run_frontend
            ;;
        all)
            run_all
            ;;
        *)
            echo "Unknown component: $component"
            echo "Usage: $0 run [backend|frontend|all]"
            exit 1
            ;;
    esac
}

function start_development_server() {
    echo "Starting FastAPI development server..."
    # Run the application with auto-reload for development
    python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
}

function start_application() {
    if [[ -d ".venv" ]]; then
        echo "Using virtual environment at .venv"
        source .venv/bin/activate
    fi

    echo "Starting application..."

    if [[ "$APP_ENV" == "development" ]]; then
        start_development_server
    else
        # For production, first check if the package is installed
        if ! python -c "import backend.app" &>/dev/null; then
            echo "Package not installed. Please install it first:"
            echo "pip install -e ."
            exit 1
        fi

        INSTALLED_PKG_DIR="$(python -c 'import backend.app; print(backend.app.__path__[0])')"
        echo "Using installed package at: $INSTALLED_PKG_DIR"
        python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
    fi
}

TIMEFORMAT="Task completed in %3lR"
time ${@:-help}
