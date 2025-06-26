#!/usr/bin/env python3
"""Simple development server for mcp dev compatibility."""

import sys
from pathlib import Path

# Add src to Python path for development
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# Import everything from the main server module
from maratron_ai.server import *

# The mcp object is already imported and available globally