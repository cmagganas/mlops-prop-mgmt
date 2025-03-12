#!/usr/bin/env python
"""
F-string Fixer Script.

This script identifies and fixes f-strings that don't contain any placeholders,
converting them to regular strings.
"""

import ast
import os
import re
import sys


class FStringVisitor(ast.NodeVisitor):
    """AST visitor to find f-strings without placeholders."""

    def __init__(self):
        """Initialize visitor with empty list of problem locations."""
        self.problems = []

    def visit_JoinedStr(self, node):
        """Visit f-string node and check if it has no placeholders."""
        has_placeholder = False
        for value in node.values:
            if isinstance(value, ast.FormattedValue):
                has_placeholder = True
                break

        if not has_placeholder:
            self.problems.append((node.lineno, node.col_offset))

        self.generic_visit(node)


def find_fstring_problems(file_path):
    """Find f-strings without placeholders in a Python file."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    try:
        tree = ast.parse(content)
        visitor = FStringVisitor()
        visitor.visit(tree)
        return visitor.problems, content
    except SyntaxError:
        print(f"Syntax error in {file_path}, skipping")
        return [], content


def fix_fstring_problems(file_path, problems, content):
    """Fix f-strings without placeholders in a Python file."""
    if not problems:
        return

    lines = content.split("\n")
    problem_lines = {}

    for line_no, _ in problems:
        if line_no - 1 not in problem_lines:
            problem_lines[line_no - 1] = lines[line_no - 1]

    fixed_count = 0
    for line_no, line in problem_lines.items():
        # Simple regex to find f-strings
        new_line = re.sub(r'f(["\'])((?:\\.|[^\\])*?)\1', r"\1\2\1", line)
        if new_line != line:
            lines[line_no] = new_line
            fixed_count += 1

    if fixed_count > 0:
        print(f"Fixing {fixed_count} f-string issues in {file_path}")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))


def process_file(file_path):
    """Process a single Python file."""
    problems, content = find_fstring_problems(file_path)
    fix_fstring_problems(file_path, problems, content)


def process_directory(directory):
    """Process all Python files in a directory recursively."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                process_file(os.path.join(root, file))


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python fix_fstrings.py <file_or_directory>")
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
