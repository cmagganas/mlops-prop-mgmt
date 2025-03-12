#!/usr/bin/env python
"""
Complexity Analyzer Script.

This script identifies complex functions that may need refactoring,
measuring cyclomatic complexity, number of local variables, and function length.
"""

import ast
import os
import sys
from typing import (
    Dict,
    List,
)


class ComplexityVisitor(ast.NodeVisitor):
    """AST visitor to analyze function complexity."""

    def __init__(self):
        """Initialize complexity visitor."""
        self.functions = []
        self.current_function = None
        self.branch_count = 0
        self.local_vars = set()
        self.line_count = 0

    def visit_FunctionDef(self, node):
        """Visit function definition nodes."""
        old_function = self.current_function
        old_branch_count = self.branch_count
        old_local_vars = self.local_vars
        old_line_count = self.line_count

        self.current_function = node.name
        self.branch_count = 1  # Base complexity is 1
        self.local_vars = set()
        # Calculate line count (end line - start line + 1)
        try:
            self.line_count = node.end_lineno - node.lineno + 1
        except (AttributeError, TypeError):
            # If end_lineno is not available, estimate based on body
            self.line_count = sum(1 for _ in ast.walk(node))

        # Analyze function body
        for item in node.body:
            self.visit(item)

        # Record function complexity
        self.functions.append(
            {
                "name": self.current_function,
                "lineno": node.lineno,
                "complexity": self.branch_count,
                "local_vars": len(self.local_vars),
                "line_count": self.line_count,
            }
        )

        # Restore previous state (for nested functions)
        self.current_function = old_function
        self.branch_count = old_branch_count
        self.local_vars = old_local_vars
        self.line_count = old_line_count

    def visit_If(self, node):
        """Visit if statements (increases complexity)."""
        self.branch_count += 1
        self.generic_visit(node)

    def visit_For(self, node):
        """Visit for loops (increases complexity)."""
        self.branch_count += 1
        self.generic_visit(node)

    def visit_While(self, node):
        """Visit while loops (increases complexity)."""
        self.branch_count += 1
        self.generic_visit(node)

    def visit_Try(self, node):
        """Visit try blocks (increases complexity for each except)."""
        self.branch_count += len(node.handlers)
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        """Visit except handlers (already counted in visit_Try)."""
        self.generic_visit(node)

    def visit_Assign(self, node):
        """Visit assignments to track local variables."""
        if self.current_function:
            for target in node.targets:
                if isinstance(target, ast.Name) and isinstance(target.ctx, ast.Store):
                    self.local_vars.add(target.id)
        self.generic_visit(node)


def analyze_file(file_path: str) -> List[Dict]:
    """Analyze a Python file for complex functions."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    try:
        tree = ast.parse(content)
        visitor = ComplexityVisitor()
        visitor.visit(tree)
        return visitor.functions
    except SyntaxError:
        print(f"Syntax error in {file_path}, skipping")
        return []


def print_complexity_report(
    file_path: str,
    functions: List[Dict],
    complexity_threshold: int = 10,
    vars_threshold: int = 10,
    lines_threshold: int = 50,
) -> bool:
    """Print a report of complex functions that may need refactoring."""
    complex_functions = [
        f
        for f in functions
        if f["complexity"] > complexity_threshold
        or f["local_vars"] > vars_threshold
        or f["line_count"] > lines_threshold
    ]

    if not complex_functions:
        return False

    print(f"\nComplex functions in {file_path}:")
    print("=" * 80)

    for func in complex_functions:
        issues = []
        if func["complexity"] > complexity_threshold:
            issues.append(f"high cyclomatic complexity ({func['complexity']} > {complexity_threshold})")
        if func["local_vars"] > vars_threshold:
            issues.append(f"too many local variables ({func['local_vars']} > {vars_threshold})")
        if func["line_count"] > lines_threshold:
            issues.append(f"too many lines ({func['line_count']} > {lines_threshold})")

        print(f"Line {func['lineno']}: Function '{func['name']}'")
        print(f"  Issues: {', '.join(issues)}")
        print("  Refactoring suggestions:")

        if func["complexity"] > complexity_threshold:
            print("    - Break complex conditionals into separate functions")
            print("    - Use early returns to reduce nesting")

        if func["local_vars"] > vars_threshold:
            print("    - Group related variables into data structures")
            print("    - Extract logic into helper functions")

        if func["line_count"] > lines_threshold:
            print("    - Extract repeated code into separate functions")
            print("    - Consider the Single Responsibility Principle")

        print()

    return True


def process_file(file_path: str, complexity_threshold: int, vars_threshold: int, lines_threshold: int) -> None:
    """Process a single Python file."""
    functions = analyze_file(file_path)
    print_complexity_report(file_path, functions, complexity_threshold, vars_threshold, lines_threshold)


def process_directory(directory: str, complexity_threshold: int, vars_threshold: int, lines_threshold: int) -> None:
    """Process all Python files in a directory recursively."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                process_file(os.path.join(root, file), complexity_threshold, vars_threshold, lines_threshold)


def main() -> None:
    """Main entry point."""
    complexity_threshold = 10
    vars_threshold = 10
    lines_threshold = 50

    if len(sys.argv) < 2:
        print(
            "Usage: python find_complex_functions.py <file_or_directory> [complexity_threshold] [vars_threshold] [lines_threshold]"
        )
        return

    path = sys.argv[1]

    # Parse optional thresholds
    if len(sys.argv) > 2:
        complexity_threshold = int(sys.argv[2])
    if len(sys.argv) > 3:
        vars_threshold = int(sys.argv[3])
    if len(sys.argv) > 4:
        lines_threshold = int(sys.argv[4])

    if os.path.isfile(path) and path.endswith(".py"):
        process_file(path, complexity_threshold, vars_threshold, lines_threshold)
    elif os.path.isdir(path):
        process_directory(path, complexity_threshold, vars_threshold, lines_threshold)
    else:
        print(f"Invalid path: {path}")


if __name__ == "__main__":
    main()
