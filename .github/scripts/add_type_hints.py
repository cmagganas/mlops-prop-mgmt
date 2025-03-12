#!/usr/bin/env python
"""
Type Annotation Helper Script.

This script scans Python files and identifies functions missing type annotations,
providing hints to help add appropriate types.
"""

import ast
import os
import sys
from typing import (
    Dict,
    List,
)


class TypeAnnotationVisitor(ast.NodeVisitor):
    """AST visitor to find functions missing type annotations."""

    def __init__(self):
        """Initialize visitor with empty list of functions missing annotations."""
        self.missing_annotations = []

    def visit_FunctionDef(self, node):
        """Visit function definition nodes to check for annotations."""
        # Ignore private methods starting with underscore
        if not node.name.startswith("_") or node.name == "__init__":
            # Check return annotation
            missing_return = node.returns is None

            # Check parameters annotations
            missing_params = []
            for arg in node.args.args:
                # Skip 'self' in methods
                if arg.arg != "self" and arg.annotation is None:
                    missing_params.append(arg.arg)

            if missing_return or missing_params:
                self.missing_annotations.append(
                    {
                        "name": node.name,
                        "lineno": node.lineno,
                        "missing_return": missing_return,
                        "missing_params": missing_params,
                    }
                )

        self.generic_visit(node)


def guess_parameter_types(param_name: str) -> str:
    """Guess parameter types based on common naming conventions."""
    param_name = param_name.lower()

    if any(param_name.endswith(suffix) for suffix in ["_id", "id"]):
        return "str"
    elif any(param_name.startswith(prefix) for prefix in ["is_", "has_", "should_"]):
        return "bool"
    elif any(substring in param_name for substring in ["count", "num", "amount", "index", "size"]):
        return "int"
    elif any(substring in param_name for substring in ["price", "cost", "balance"]):
        return "float"
    elif any(substring in param_name for substring in ["date", "time"]):
        return "datetime.datetime"
    elif any(param_name.endswith(suffix) for suffix in ["_list", "list"]):
        return "List[Any]"
    elif any(param_name.endswith(suffix) for suffix in ["_dict", "dict", "config", "settings"]):
        return "Dict[str, Any]"
    elif any(param_name.endswith(suffix) for suffix in ["_set", "set"]):
        return "Set[Any]"
    else:
        return "Any"


def guess_return_type(func_name: str) -> str:
    """Guess return type based on function name conventions."""
    func_name = func_name.lower()

    if any(func_name.startswith(prefix) for prefix in ["is_", "has_", "should_", "check_"]):
        return "bool"
    elif any(func_name.startswith(prefix) for prefix in ["get_", "fetch_", "retrieve_"]):
        if any(substring in func_name for substring in ["list", "all"]):
            return "List[Dict[str, Any]]"
        else:
            return "Dict[str, Any]"
    elif any(func_name.startswith(prefix) for prefix in ["calculate_", "compute_"]):
        return "float"
    elif any(func_name.startswith(prefix) for prefix in ["create_", "generate_"]):
        return "Dict[str, Any]"
    elif any(func_name.startswith(prefix) for prefix in ["update_", "modify_"]):
        return "Dict[str, Any]"
    elif any(func_name.startswith(prefix) for prefix in ["delete_", "remove_"]):
        return "bool"
    else:
        return "Any"


def scan_file(file_path: str) -> List[Dict]:
    """Scan a Python file for functions missing type annotations."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    try:
        tree = ast.parse(content)
        visitor = TypeAnnotationVisitor()
        visitor.visit(tree)
        return visitor.missing_annotations
    except SyntaxError:
        print(f"Syntax error in {file_path}, skipping")
        return []


def print_annotation_suggestions(file_path: str, missing_annotations: List[Dict]) -> None:
    """Print suggestions for adding type annotations."""
    if not missing_annotations:
        return

    print(f"\nSuggested type annotations for {file_path}:")
    print("=" * 80)

    for func in missing_annotations:
        print(f"Line {func['lineno']}: Function '{func['name']}'")

        # Suggest parameter types
        if func["missing_params"]:
            print("  Parameter annotations:")
            for param in func["missing_params"]:
                suggested_type = guess_parameter_types(param)
                print(f"    {param}: {suggested_type}")

        # Suggest return type
        if func["missing_return"]:
            suggested_return = guess_return_type(func["name"])
            print(f"  Return annotation: -> {suggested_return}")

        print()


def process_file(file_path: str) -> None:
    """Process a single Python file."""
    missing_annotations = scan_file(file_path)
    print_annotation_suggestions(file_path, missing_annotations)


def process_directory(directory: str) -> None:
    """Process all Python files in a directory recursively."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                process_file(os.path.join(root, file))


def main() -> None:
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python add_type_hints.py <file_or_directory>")
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
