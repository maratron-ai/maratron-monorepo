"""Easy-to-use API wrapper for web application integration."""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from .server import (
    # Tools
    add_user, update_user_email, delete_user,
    add_run, add_shoe,
    set_current_user_tool, get_current_user_tool,
    update_user_preferences_tool, update_conversation_context_tool,
    get_session_history,
    
    # Resources  
    database_schema, user_profile,
    user_recent_runs, user_run_summary, user_shoes,
    database_stats,
    
    # Utilities
    health_check, cleanup
)

logger = logging.getLogger(__name__)


class MaratronAPI:
    """High-level API for Maratron AI MCP Server integration."""
    
    def __init__(self, auto_cleanup: bool = True):
        """Initialize the API.
        
        Args:
            auto_cleanup: Whether to automatically cleanup resources
        """
        self.auto_cleanup = auto_cleanup
        self._current_user_id: Optional[str] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit with cleanup."""
        if self.auto_cleanup:
            await self.cleanup()
    
    # User Management
    async def create_user(self, name: str, email: str) -> Dict[str, Any]:
        """Create a new user."""
        try:
            result = await add_user(name, email)
            if "✅ Created user" in result:
                user_id = result.split("ID: ")[1]
                return {"success": True, "user_id": user_id, "message": result}
            else:
                return {"success": False, "error": result}
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_user_email(self, user_id: str, email: str) -> Dict[str, Any]:
        """Update user's email address."""
        try:
            result = await update_user_email(user_id, email)
            success = "✅ Updated email" in result
            return {"success": success, "message": result}
        except Exception as e:
            logger.error(f"Error updating user email: {e}")
            return {"success": False, "error": str(e)}
    
    async def delete_user(self, user_id: str) -> Dict[str, Any]:
        """Delete a user."""
        try:
            result = await delete_user(user_id)
            success = "✅ Deleted user" in result
            return {"success": success, "message": result}
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return {"success": False, "error": str(e)}
    
    # User Context Management
    async def set_user_context(self, user_id: str) -> Dict[str, Any]:
        """Set the current user context."""
        try:
            result = await set_current_user_tool(user_id)
            if "✅ User context set" in result:
                self._current_user_id = user_id
                return {"success": True, "user_id": user_id, "message": result}
            else:
                return {"success": False, "error": result}
        except Exception as e:
            logger.error(f"Error setting user context: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_current_user(self) -> Dict[str, Any]:
        """Get current user context information."""
        try:
            result = await get_current_user_tool()
            if "❌" not in result:
                return {"success": True, "data": result}
            else:
                return {"success": False, "error": result}
        except Exception as e:
            logger.error(f"Error getting current user: {e}")
            return {"success": False, "error": str(e)}
    
    # Running Data
    async def add_run(self, user_id: str, date: str, duration: str, distance: float, 
                     distance_unit: str = "miles", name: str = None, notes: str = None,
                     training_environment: str = None, pace: str = None,
                     elevation_gain: float = None, shoe_id: str = None) -> Dict[str, Any]:
        """Add a run for a user."""
        try:
            result = await add_run(user_id, date, duration, distance, distance_unit, name, notes, 
                                 training_environment, pace, elevation_gain, shoe_id)
            if "✅ Added run" in result:
                run_id = result.split("ID: ")[1] if "ID: " in result else None
                return {"success": True, "run_id": run_id, "message": result}
            else:
                return {"success": False, "error": result}
        except Exception as e:
            logger.error(f"Error adding run: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_runs(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Get user's recent runs."""
        try:
            result = await user_recent_runs(user_id)
            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"Error getting user runs: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_run_summary(self, user_id: str, period: str = "30d") -> Dict[str, Any]:
        """Get user's running summary for a period."""
        try:
            result = await user_run_summary(user_id, period)
            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"Error getting run summary: {e}")
            return {"success": False, "error": str(e)}
    
    # Shoe Management
    async def add_shoe(self, user_id: str, name: str, max_distance: float,
                      distance_unit: str = "miles", notes: str = None, 
                      current_distance: float = 0.0, retired: bool = False) -> Dict[str, Any]:
        """Add a shoe to user's collection."""
        try:
            result = await add_shoe(user_id, name, max_distance, distance_unit, notes, 
                                  current_distance, retired)
            if "✅ Added shoe" in result:
                shoe_id = result.split("ID: ")[1] if "ID: " in result else None
                return {"success": True, "shoe_id": shoe_id, "message": result}
            else:
                return {"success": False, "error": result}
        except Exception as e:
            logger.error(f"Error adding shoe: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_shoes(self, user_id: str) -> Dict[str, Any]:
        """Get user's shoe collection."""
        try:
            result = await user_shoes(user_id)
            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"Error getting user shoes: {e}")
            return {"success": False, "error": str(e)}
    
    # Profile and Preferences
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user's complete profile."""
        try:
            result = await user_profile(user_id)
            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_preferences(self, preferences_json: str) -> Dict[str, Any]:
        """Update user preferences."""
        try:
            result = await update_user_preferences_tool(preferences_json)
            success = "✅" in result
            return {"success": success, "message": result}
        except Exception as e:
            logger.error(f"Error updating preferences: {e}")
            return {"success": False, "error": str(e)}
    
    # System Information
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        try:
            result = await database_stats()
            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {"success": False, "error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check system health."""
        try:
            result = await health_check()
            return {"success": True, "healthy": result}
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            await cleanup()
            logger.info("Maratron API cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")


# Convenience functions for simple use cases
async def quick_add_run(user_id: str, date: str, duration: str, distance: float) -> str:
    """Quick function to add a run."""
    api = MaratronAPI()
    try:
        await api.set_user_context(user_id)
        result = await api.add_run(user_id, date, duration, distance)
        return result["message"] if result["success"] else result["error"]
    finally:
        await api.cleanup()


async def quick_get_runs(user_id: str) -> str:
    """Quick function to get user runs."""
    api = MaratronAPI()
    try:
        await api.set_user_context(user_id)
        result = await api.get_user_runs(user_id)
        return result["data"] if result["success"] else result["error"]
    finally:
        await api.cleanup()


# Context manager for API usage
@asynccontextmanager
async def maratron_api():
    """Context manager for automatic cleanup."""
    api = MaratronAPI()
    try:
        yield api
    finally:
        await api.cleanup()