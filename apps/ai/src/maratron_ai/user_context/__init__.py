"""User context management for Maratron AI MCP Server."""

from .context import (
    UserPreferences,
    ConversationContext,
    UserSession,
    UserContextManager,
    get_user_context_manager,
    get_current_user_session,
    get_current_user_id,
    require_user_context
)
from .security import (
    SecurityValidator,
    get_security_validator,
    validate_user_operation,
    secure_user_operation
)
from .tools import (
    set_current_user,
    get_current_user,
    switch_user_context,
    clear_user_context,
    update_user_preferences,
    update_conversation_context,
    get_session_info,
    list_active_sessions
)

__all__ = [
    "UserPreferences",
    "ConversationContext",
    "UserSession", 
    "UserContextManager",
    "get_user_context_manager",
    "get_current_user_session",
    "get_current_user_id",
    "require_user_context",
    "SecurityValidator",
    "get_security_validator",
    "validate_user_operation", 
    "secure_user_operation",
    "set_current_user",
    "get_current_user",
    "switch_user_context",
    "clear_user_context",
    "update_user_preferences",
    "update_conversation_context",
    "get_session_info",
    "list_active_sessions"
]