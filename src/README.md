# Property Management API

A FastAPI-based application for managing properties, units, tenants, leases, and payments for rental properties. This API provides comprehensive reporting capabilities for financial tracking and management.

## Project Structure

- `mlopspropmgmt/`: Main application package
  - `config/`: Configuration settings
  - `data/`: Sample data for development/demo
  - `db/`: Database repositories (in-memory for demo)
  - `models/`: Pydantic models for data validation
  - `routers/`: API route definitions
  - `templates/`: HTML templates for report viewing

- `tests/`: Automated tests

## Features

### Core Entity Management

- Properties: Create, read, update, and delete property information
- Units: Manage units within properties
- Tenants: Track tenant information and relationships to units
- Leases: Manage lease agreements and terms
- Payments: Record and track payments by tenants

### Financial Reporting System

The API includes a comprehensive financial reporting system with both JSON API endpoints and HTML visualizations:

#### API Endpoints

Access via Swagger UI at <http://localhost:8000/docs>:

- `/reports/balance/tenant/{tenant_id}`: Tenant balance reports
- `/reports/balance/unit/{unit_id}`: Unit balance reports
- `/reports/balance/property/{property_id}`: Property balance reports
- `/reports/balance`: All properties summary report
- `/reports/balance/summary`: Flexible report endpoint with filtering

#### HTML Report Viewer

User-friendly HTML reports at <http://localhost:8000/report-viewer/>:

- Reports Home: Dashboard with links to all reports
- Property Reports: Financial summaries for all properties or specific properties
- Unit Reports: Detailed financial information for specific units
- Tenant Reports: Payment history and balance information for specific tenants

## Running the Application

```bash
# From the project root
python run.py
```

The server will start on <http://0.0.0.0:8000>

## Report Viewer Features

- **Navigation Bar**: Easy navigation between different report types
- **Summary Cards**: Financial information organized in readable card layouts
- **Data Tables**: Tables showing payment history, missing payments, etc.
- **Color-Coded Balances**: Green for paid/positive balances, red for outstanding balances

## Next Potential Enhancements

1. **Data Visualization**
   - Add charts and graphs for better data visualization
   - Implement dashboards with key performance indicators

2. **Advanced Filtering**
   - Add date range filters for historical reporting
   - Implement advanced search/filter capabilities

3. **Export Options**
   - Add PDF report generation
   - Implement CSV/Excel export functionality

4. **Comparative Analytics**
   - Add month-to-month comparison features
   - Implement year-over-year financial tracking

5. **Further UI Enhancements**
   - Add responsive design for mobile viewing
   - Implement print-friendly report formats

## Development Guidelines

- Follow FastAPI best practices
- Use Pydantic for data validation
- Keep routes modular and organized
- Write comprehensive tests for all features
