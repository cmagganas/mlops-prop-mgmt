#!/usr/bin/env python
"""
Docstring Fixer Script

This script helps standardize docstring formatting across the codebase.
It fixes common docstring formatting issues like:
- Ensuring first line ends with a period
- Proper formatting of section headers
- Adding blank lines after sections
"""

import os
import re
import sys


def fix_module_docstring(content):
    """Add a module docstring if missing."""
    if not content.startswith('"""'):
        # Check if there are imports or code at the top
        if content.startswith("import ") or content.startswith("from "):
            module_name = os.path.basename(sys.argv[1]) if len(sys.argv) > 1 else "module"
            module_name = os.path.splitext(module_name)[0]
            docstring = f'"""{module_name.replace("_", " ").title()} module.\n\nThis module provides functionality for {module_name.replace("_", " ")}.\n"""\n\n'
            return docstring + content
    return content


def fix_docstring_format(content):
    """Fix common docstring formatting issues."""
    # Pattern to match triple-quoted docstrings
    docstring_pattern = r'"""(.*?)"""'

    def format_docstring(match):
        docstring = match.group(1)
        lines = docstring.strip().split("\n")

        # Ensure first line ends with a period if it doesn't already
        if lines and not lines[0].rstrip().endswith((".", "?", "!")):
            lines[0] = lines[0].rstrip() + "."

        # Fix section headers (Args:, Returns:, etc.)
        for i in range(len(lines)):
            # Check for section headers like "Args:", "Returns:", etc.
            section_match = re.match(
                r"^\s*(Args|Returns|Raises|Yields|Examples|Attributes|Note|Warning):\s*$", lines[i]
            )
            if section_match:
                # Ensure there's a blank line before section (if not at the beginning)
                if i > 0 and lines[i - 1].strip():
                    lines[i] = "\n" + lines[i]

                # Ensure there's a blank line after the section
                if i < len(lines) - 1 and lines[i + 1].strip():
                    lines[i] = lines[i] + "\n"

        return '"""' + "\n".join(lines) + '"""'

    # Apply the formatting to all docstrings
    return re.sub(docstring_pattern, format_docstring, content, flags=re.DOTALL)


def process_file(file_path):
    """Process a single Python file."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Apply fixes
    new_content = content
    if not re.search(r'""".*?"""', new_content, re.DOTALL):
        new_content = fix_module_docstring(new_content)
    new_content = fix_docstring_format(new_content)

    # Write back if changes were made
    if new_content != content:
        print(f"Fixing docstrings in {file_path}")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)


def process_directory(directory):
    """Process all Python files in a directory recursively."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                process_file(os.path.join(root, file))


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python fix_docstrings.py <file_or_directory>")
        return

    path = sys.argv[1]
    if os.path.isfile(path) and path.endswith(".py"):
        process_file(path)
    elif os.path.isdir(path):
        process_directory(path)
    else:
        print(f"Invalid path: {path}")


if __name__ == "__main__":
    main()
