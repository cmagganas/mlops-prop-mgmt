#!/usr/bin/env python
"""
Compatibility check script for the Property Management System.

This script verifies your Python environment is compatible with the project
and provides recommendations for resolving any issues.
"""

import importlib.util
import platform
import sys


def check_python_version():
    """Check if Python version is compatible."""
    print(f"Checking Python version...")
    python_version = sys.version_info
    version_str = f"{python_version.major}.{python_version.minor}.{python_version.micro}"

    if python_version.major == 3 and python_version.minor >= 7:
        if python_version.minor >= 12:
            print(
                f"✓ Python version {version_str} is supported, but some development tools may have compatibility issues."
            )
            print("  Consider using Python 3.10 or 3.11 for the best development experience.")
            return True
        else:
            print(f"✓ Python version {version_str} is fully supported.")
            return True
    else:
        print(f"✗ Python version {version_str} is not supported. Please use Python 3.7 or higher.")
        return False


def check_dependencies():
    """Check if key dependencies can be imported."""
    dependencies = {
        "fastapi": "FastAPI",
        "uvicorn": "Uvicorn",
        "pydantic": "Pydantic",
    }

    all_found = True
    print("\nChecking for key dependencies...")

    for module_name, display_name in dependencies.items():
        if importlib.util.find_spec(module_name) is not None:
            print(f"✓ {display_name} is installed")
        else:
            print(f"✗ {display_name} is not installed")
            all_found = False

    if not all_found:
        print("\nInstall missing dependencies with:")
        print("  pip install -e .[dev]")

    return all_found


def check_os_compatibility():
    """Check if the operating system is compatible."""
    print("\nChecking operating system compatibility...")
    system = platform.system()

    if system in ["Linux", "Darwin", "Windows"]:
        print(f"✓ {system} is supported")
        return True
    else:
        print(f"? {system} might have compatibility issues")
        return False


def main():
    """Run all compatibility checks."""
    print("=" * 60)
    print(" Property Management System Environment Compatibility Check ")
    print("=" * 60)

    python_ok = check_python_version()
    dependencies_ok = check_dependencies()
    os_ok = check_os_compatibility()

    print("\n" + "=" * 60)
    if python_ok and dependencies_ok and os_ok:
        print("✅ Your environment appears to be compatible!")
        print("   You can proceed with the following command to run the application:")
        print("   ./start.sh  or  make run")
    else:
        print("⚠️  Some compatibility issues were detected.")
        print("   Please resolve them before running the application.")
    print("=" * 60)


if __name__ == "__main__":
    main()
