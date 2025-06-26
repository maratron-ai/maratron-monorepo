"""MCP Tools for User Context Management."""
import json
from typing import Optional
from .context import (
    get_user_context_manager, 
    get_current_user_session, 
    get_current_user_id,
    require_user_context,
    UserPreferences
)
from ..database_utils import handle_database_errors
from .security import (
    secure_user_operation,
    get_security_validator,
    validate_user_operation
)


@handle_database_errors
@secure_user_operation("set_current_user")
async def set_current_user(user_id: str) -> str:
    """Set the current user context for subsequent operations.
    
    Args:
        user_id: The ID of the user to set as current context
        
    Returns:
        Status message with user information
    """
    try:
        manager = get_user_context_manager()
        session = await manager.set_current_user(user_id)
        
        user_info = {
            'user_id': session.user_id,
            'session_id': session.session_id,
            'user_data': session.cached_user_data,
            'preferences': session.preferences.dict() if session.preferences else None
        }
        
        return f"✅ User context set successfully:\n" + \
               f"User: {user_info['user_data'].get('name', 'Unknown')} ({user_id})\n" + \
               f"Training Level: {user_info['user_data'].get('training_level', 'Not set')}\n" + \
               f"Recent Runs: {user_info['user_data'].get('recent_runs_count', 0)} in last 30 days\n" + \
               f"Distance Unit: {session.preferences.distance_unit if session.preferences else 'miles'}\n" + \
               f"Session ID: {session.session_id}"
               
    except ValueError as e:
        return f"❌ Error: {e}"
    except Exception as e:
        return f"❌ Failed to set user context: {e}"


@handle_database_errors
async def get_current_user() -> str:
    """Get the current user's profile and context information.
    
    Returns:
        Current user's profile, preferences, and session info
    """
    session = get_current_user_session()
    if not session:
        return "❌ No user context set. Use set_current_user first."
    
    user_data = session.cached_user_data
    preferences = session.preferences
    context = session.conversation_context
    
    response = f"👤 **Current User Context**\n\n"
    response += f"**User Information:**\n"
    response += f"• Name: {user_data.get('name', 'Unknown')}\n"
    response += f"• Email: {user_data.get('email', 'Unknown')}\n"
    response += f"• Training Level: {user_data.get('training_level', 'Not set')}\n"
    response += f"• Goals: {', '.join(user_data.get('goals', []))}\n"
    response += f"• Recent Runs: {user_data.get('recent_runs_count', 0)} in last 30 days\n\n"
    
    if preferences:
        response += f"**Preferences:**\n"
        response += f"• Distance Unit: {preferences.distance_unit}\n"
        response += f"• Timezone: {preferences.timezone}\n"
        response += f"• Detailed Responses: {'Yes' if preferences.detailed_responses else 'No'}\n"
        response += f"• Include Social Data: {'Yes' if preferences.include_social_data else 'No'}\n"
        response += f"• Max Results: {preferences.max_results_per_query}\n\n"
    
    response += f"**Session Information:**\n"
    response += f"• Session ID: {session.session_id}\n"
    response += f"• Created: {session.created_at.strftime('%Y-%m-%d %H:%M UTC')}\n"
    response += f"• Last Activity: {session.last_activity.strftime('%Y-%m-%d %H:%M UTC')}\n\n"
    
    response += f"**Conversation Context:**\n"
    response += f"• Last Topic: {context.last_topic or 'None'}\n"
    response += f"• Last Action: {context.last_action or 'None'}\n"
    response += f"• Mood: {context.conversation_mood}\n"
    response += f"• Recent Mentions: {len(context.mentioned_runs)} runs, {len(context.mentioned_shoes)} shoes"
    
    return response


@handle_database_errors
async def switch_user_context(user_id: str) -> str:
    """Switch to a different user context.
    
    Args:
        user_id: The ID of the user to switch to
        
    Returns:
        Status message confirming the switch
    """
    try:
        manager = get_user_context_manager()
        old_user_id = get_current_user_id()
        
        session = await manager.switch_user_context(user_id)
        
        return f"🔄 User context switched successfully:\n" + \
               f"Previous User: {old_user_id or 'None'}\n" + \
               f"Current User: {session.cached_user_data.get('name', 'Unknown')} ({user_id})\n" + \
               f"Session ID: {session.session_id}"
               
    except ValueError as e:
        return f"❌ Error: {e}"
    except Exception as e:
        return f"❌ Failed to switch user context: {e}"


@handle_database_errors
async def clear_user_context() -> str:
    """Clear the current user context.
    
    Returns:
        Confirmation message
    """
    manager = get_user_context_manager()
    old_user_id = get_current_user_id()
    
    manager.clear_current_user()
    
    return f"🧹 User context cleared. Previous user: {old_user_id or 'None'}"


@handle_database_errors
async def update_user_preferences(preferences_json: str) -> str:
    """Update user preferences for the current user.
    
    Args:
        preferences_json: JSON string with preference updates
        
    Returns:
        Status message with updated preferences
    """
    session = get_current_user_session()
    if not session:
        return "❌ No user context set. Use set_current_user first."
    
    # Validate preferences JSON
    validator = get_security_validator()
    valid, message = validator.validate_preferences_json(preferences_json)
    if not valid:
        return f"❌ Invalid preferences: {message}"
    
    try:
        preferences = json.loads(preferences_json)
        manager = get_user_context_manager()
        await manager.update_user_preferences(preferences)
        
        return f"✅ User preferences updated successfully:\n" + \
               json.dumps(session.preferences.dict(), indent=2)
               
    except json.JSONDecodeError:
        return "❌ Invalid JSON format for preferences."
    except Exception as e:
        return f"❌ Failed to update preferences: {e}"


@handle_database_errors
async def update_conversation_context(context_json: str) -> str:
    """Update conversation context for the current user.
    
    Args:
        context_json: JSON string with context updates
        
    Returns:
        Status message with updated context
    """
    session = get_current_user_session()
    if not session:
        return "❌ No user context set. Use set_current_user first."
    
    # Validate context JSON
    validator = get_security_validator()
    valid, message = validator.validate_context_json(context_json)
    if not valid:
        return f"❌ Invalid context: {message}"
    
    try:
        context_updates = json.loads(context_json)
        manager = get_user_context_manager()
        await manager.update_conversation_context(**context_updates)
        
        return f"✅ Conversation context updated successfully:\n" + \
               f"Last Topic: {session.conversation_context.last_topic}\n" + \
               f"Last Action: {session.conversation_context.last_action}\n" + \
               f"Mood: {session.conversation_context.conversation_mood}"
               
    except json.JSONDecodeError:
        return "❌ Invalid JSON format for context."
    except Exception as e:
        return f"❌ Failed to update context: {e}"


@handle_database_errors
async def get_session_info(user_id: Optional[str] = None) -> str:
    """Get session information for a user (or current user if not specified).
    
    Args:
        user_id: Optional user ID. If not provided, uses current user.
        
    Returns:
        Session information
    """
    if not user_id:
        user_id = get_current_user_id()
        if not user_id:
            return "❌ No user context set and no user_id provided."
    
    manager = get_user_context_manager()
    session_info = manager.get_session_info(user_id)
    
    if not session_info:
        return f"❌ No active session found for user {user_id}."
    
    return f"📊 **Session Information for {user_id}:**\n" + \
           f"Session ID: {session_info['session_id']}\n" + \
           f"Created: {session_info['created_at']}\n" + \
           f"Last Activity: {session_info['last_activity']}\n" + \
           f"Is Current User: {'Yes' if session_info['is_current'] else 'No'}\n" + \
           f"Cached Data: {', '.join(session_info['cached_data_keys'])}"


@handle_database_errors 
async def list_active_sessions() -> str:
    """List all currently active user sessions.
    
    Returns:
        List of active sessions
    """
    manager = get_user_context_manager()
    current_user = get_current_user_id()
    
    if not manager.active_sessions:
        return "📭 No active sessions."
    
    response = f"📋 **Active Sessions ({len(manager.active_sessions)}):**\n\n"
    
    for user_id, session in manager.active_sessions.items():
        is_current = "👑 " if user_id == current_user else "   "
        user_name = session.cached_user_data.get('name', 'Unknown')
        
        response += f"{is_current}**{user_name}** ({user_id})\n"
        response += f"   Session: {session.session_id[:20]}...\n"
        response += f"   Last Activity: {session.last_activity.strftime('%H:%M UTC')}\n"
        response += f"   Duration: {(session.last_activity - session.created_at).total_seconds() / 60:.0f} minutes\n\n"
    
    return response


# Context-aware helper functions for other MCP tools
def get_user_distance_unit() -> str:
    """Get the current user's preferred distance unit."""
    session = get_current_user_session()
    if session and session.preferences:
        return session.preferences.distance_unit
    return "miles"  # default


def get_user_max_results() -> int:
    """Get the current user's preferred max results per query."""
    session = get_current_user_session()
    if session and session.preferences:
        return session.preferences.max_results_per_query
    return 10  # default


def should_include_social_data() -> bool:
    """Check if current user wants social data included."""
    session = get_current_user_session()
    if session and session.preferences:
        return session.preferences.include_social_data
    return True  # default


def wants_detailed_responses() -> bool:
    """Check if current user wants detailed responses."""
    session = get_current_user_session()
    if session and session.preferences:
        return session.preferences.detailed_responses
    return True  # default


def get_user_name() -> str:
    """Get the current user's name."""
    session = get_current_user_session()
    if session:
        return session.cached_user_data.get('name', 'User')
    return 'User'


def track_conversation_topic(topic: str):
    """Track the current conversation topic."""
    session = get_current_user_session()
    if session:
        session.conversation_context.last_topic = topic
        session.update_activity()


def track_last_action(action: str):
    """Track the last action performed."""
    session = get_current_user_session()
    if session:
        session.conversation_context.last_action = action
        session.update_activity()