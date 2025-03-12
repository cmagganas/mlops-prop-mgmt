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

# install core and development Python dependencies into the currently activated venv
function install {
    # Check if pyproject.toml exists in the current directory
    if [ ! -f "$THIS_DIR/pyproject.toml" ]; then
        echo "Error: pyproject.toml not found in $THIS_DIR. Make sure you're running this script from the project root."
        exit 1
    fi

    python -m pip install --upgrade pip
    python -m pip install --editable "$THIS_DIR/[dev]"

    # Install pre-commit hooks if pre-commit is installed
    if command -v pre-commit >/dev/null 2>&1; then
        echo "Setting up pre-commit hooks..."
        pre-commit install
    else
        echo "pre-commit not found. Hooks not installed. Run 'pip install pre-commit' and then 'pre-commit install' to set up hooks."
    fi
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

# build a wheel and sdist from the Python source code
function build {
    python -m build --sdist --wheel "$THIS_DIR/"
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
    compgen -A function | cat -n
}

# run the FastAPI application
function run {
    echo "Starting FastAPI application..."
    echo "View the API docs at: http://localhost:8000/docs"
    echo "View the HTML reports at: http://localhost:8000/report-viewer/"
    python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
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
