"""Maratron AI MCP Server Package."""

__version__ = "1.0.0"
__description__ = "Maratron AI MCP Database Server for running application integration"

from .api import MaratronAPI, maratron_api, quick_add_run, quick_get_runs
from .config import get_config, reload_config
from .health import comprehensive_health_check, startup_validation
from .logging_config import setup_logging, get_logger
from .server import (
    # MCP Tools (Actions)
    add_user, update_user_email, delete_user,
    add_run, add_shoe,
    set_current_user_tool, get_current_user_tool,
    switch_user_context_tool, clear_user_context_tool,
    update_user_preferences_tool, update_conversation_context_tool,
    
    # MCP Resources (Content) - Note: These are async functions, not direct imports
    # Use the API class for easier access
)

__all__ = [
    # Main API
    "MaratronAPI", "maratron_api", "quick_add_run", "quick_get_runs",
    
    # Configuration and setup
    "get_config", "reload_config", "setup_logging", "get_logger",
    
    # Health and validation
    "comprehensive_health_check", "startup_validation",
    
    # MCP Tools (direct access)
    "add_user", "update_user_email", "delete_user",
    "add_run", "add_shoe", 
    "set_current_user_tool", "get_current_user_tool",
    "switch_user_context_tool", "clear_user_context_tool",
    "update_user_preferences_tool", "update_conversation_context_tool",
]