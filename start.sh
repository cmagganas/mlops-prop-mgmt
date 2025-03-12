#!/bin/bash

# Simple startup script for the property management application

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
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

# Install dependencies if needed
if ! python -c "import fastapi" &> /dev/null; then
    echo "Installing dependencies..."
    bash run.sh install
fi

# Run compatibility check
echo "Checking environment compatibility..."
python check_env.py

# If compatibility check returns an error, ask user if they want to continue
if [ $? -ne 0 ]; then
    read -p "Continue anyway? (y/n) " choice
    case "$choice" in
        y|Y ) echo "Continuing despite compatibility issues...";;
        * ) echo "Exiting."; exit 1;;
    esac
fi

# Run the application
echo "Starting the application..."
bash run.sh run

# Deactivate on exit
trap "deactivate" EXIT
