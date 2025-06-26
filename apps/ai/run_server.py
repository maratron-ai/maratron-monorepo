#!/usr/bin/env python3
"""Development entry point for the Maratron AI MCP Server."""

import sys
from pathlib import Path

# Add src to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# Import the server module and expose the mcp object
from maratron_ai.server import mcp, main

# For mcp dev compatibility, expose the server object
server = mcp
app = mcp

if __name__ == "__main__":
    main()