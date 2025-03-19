#!/bin/bash

# Simple startup script for the property management application

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js and npm are required but not found"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration values and restart this script."
    exit 1
fi

# Prompt for installation type
if ! python -c "import fastapi" &> /dev/null; then
    echo -e "\nInstallation type:"
    echo "1) Development - Full setup with all tools (default)"
    echo "2) Production - All components without development tools"
    echo "3) Minimal - Basic setup with core and auth only"
    echo "4) Custom - Select specific components"
    read -p "Enter your choice (default: 1): " install_choice

    case "$install_choice" in
        2) install_type="prod";;
        3) install_type="minimal";;
        4) install_type="custom";;
        *) install_type="dev";;
    esac

    echo "Installing dependencies ($install_type)..."
    bash run.sh install "$install_type"
else
    # Always sync environment variables
    bash run.sh sync_env
fi

# Run compatibility check
echo -e "\nChecking environment compatibility..."
python .github/scripts/check_env.py 2>/dev/null || true

# Ask if user wants to run backend, frontend, or both
echo -e "\nWhat would you like to run?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both backend and frontend (default)"
read -p "Enter your choice: " choice

case "$choice" in
    1) component="backend";;
    2) component="frontend";;
    *) component="all";;
esac

# Run the application
echo -e "\nStarting the application ($component)..."
bash run.sh run $component

# Deactivate on exit
trap "deactivate" EXIT
