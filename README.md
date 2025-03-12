# Property Management System

A FastAPI-based application for managing properties, units, tenants, and financial reports.

## Recent Updates

- **HTML Report Viewer**: Added a user-friendly web interface for visualizing financial reports
- **Simplified Setup**: Created startup scripts and improved documentation for easier onboarding
- **Test Improvements**: Fixed test configuration to skip auth-related tests for now
- **Environment Configuration**: Added sample .env file and configuration structure
- **Architecture Documentation**: Added comprehensive architecture overview
- **Compatibility Checks**: Added environment compatibility verification script

This project now provides both API endpoints and HTML visualizations for property management data, with a focus on financial reporting. The system maintains data on properties, units, tenants, leases, and payments, generating various financial reports that can be viewed through either JSON API responses or the HTML report viewer.

## Setup

### Prerequisites
- Python 3.7 or higher (Python 3.10-3.11 recommended for best compatibility with all tools)
- Make (optional, for using make commands)

**Note on Python 3.12**: While the application should run with Python 3.12, some development tools might have compatibility issues. If you experience pre-commit or other development tool errors, consider using Python 3.11.

### Checking Environment Compatibility

Before installing, you can check if your environment is compatible:

```bash
# Run the compatibility check script
python .github/scripts/check_env.py
```

This will verify your Python version, check for key dependencies, and validate OS compatibility.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cmagganas/mlops-prop-mgmt.git
   cd mlops-prop-mgmt
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the package with development dependencies:
   ```bash
   make install
   # OR
   bash run.sh install
   # OR
   pip install -e ".[dev]"
   ```

4. Set up pre-commit hooks:
   ```bash
   pre-commit install
   ```

### Quick Start

For the fastest way to get up and running:

```bash
# One command setup and run
./start.sh
```

This script will:
- Create a virtual environment if needed
- Install dependencies if they're missing
- Check environment compatibility
- Start the application

### Running the Application

Run the application using:

```bash
make run
# OR
bash run.sh run
# OR
python -m uvicorn src.mlopspropmgmt.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API Docs: http://localhost:8000/docs
- HTML Report Viewer: http://localhost:8000/report-viewer/

## Viewing the HTML Reports

The application includes a user-friendly HTML report viewer for displaying financial data:

1. Start the application as described above
2. Navigate to http://localhost:8000/report-viewer/
3. From the reports home page, you can access:
   - Property reports - View financial summaries for all properties or specific properties
   - Unit reports - See detailed financial information for specific units
   - Tenant reports - View payment history and balance information for specific tenants

Each report includes:
- Navigation links to other reports
- Summary cards showing key financial metrics
- Data tables with payment history
- Color-coded balances (green for paid/positive, red for outstanding)

## Development

### Available Make Commands

- `make install` - Install the package and development dependencies
- `make run` - Run the FastAPI application
- `make lint` - Run linting checks
- `make test` - Run tests
- `make test-quick` - Run quick tests (excluding slow and auth tests)
- `make build` - Build the package
- `make clean` - Clean build artifacts
- `make serve-coverage-report` - Serve the test coverage report

## Project Structure

See [architecture.md](assets/architecture.md) for a detailed overview of the project structure.

## Development Guidelines

### Code Style and Linting

This project uses pre-commit hooks to enforce code style and catch common issues. To ensure your code passes the checks:

1. Install pre-commit hooks:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

2. Run pre-commit manually before committing:
   ```bash
   pre-commit run --all-files
   ```

3. Use the provided helper scripts to fix common issues:

   - Fix docstring formatting issues:
     ```bash
     python .github/scripts/fix_docstrings.py src/mlopspropmgmt
     ```

   - Fix f-strings without placeholders:
     ```bash
     python .github/scripts/fix_fstrings.py src/mlopspropmgmt
     ```

   - Get suggestions for missing type annotations:
     ```bash
     python .github/scripts/add_type_hints.py src/mlopspropmgmt
     ```

   - Find complex functions that need refactoring:
     ```bash
     python .github/scripts/find_complex_functions.py src/mlopspropmgmt
     ```

4. For complex functions with high cyclomatic complexity:
   - Consider breaking them down into smaller functions
   - Extract repeated logic into helper functions
   - Use more descriptive variable names to improve readability

5. Add type annotations to function signatures to improve type checking:
   ```python
   def get_property_report(property_id: str) -> dict:
       """Get a property report.

       Args:
           property_id: The ID of the property

       Returns:
           A dictionary containing the property report data
       """
       # Function implementation
   ```

### Temporarily Bypassing Pre-commit Hooks

If you need to commit changes while still working on fixing linting issues:

```bash
git commit --no-verify -m "Your commit message"
```

However, aim to gradually fix all linting issues to maintain code quality.
