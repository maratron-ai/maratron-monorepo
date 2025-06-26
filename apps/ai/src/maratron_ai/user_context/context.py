"""User Context Management for MCP Server."""
import json
import time
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from dataclasses import dataclass, asdict
import asyncio
from ..database_utils import (
    fetch_with_timeout, 
    fetchrow_with_timeout,
    execute_with_timeout
)
from ..config import get_config

config = get_config()


class UserPreferences(BaseModel):
    """User preferences for chatbot interactions."""
    distance_unit: str = Field(default="miles", pattern="^(miles|kilometers)$")
    date_format: str = Field(default="YYYY-MM-DD")
    timezone: str = Field(default="UTC")
    language: str = Field(default="en")
    notification_enabled: bool = Field(default=True)
    detailed_responses: bool = Field(default=True)
    include_social_data: bool = Field(default=True)
    max_results_per_query: int = Field(default=10, ge=1, le=100)


@dataclass
class ConversationContext:
    """Context from recent conversation history."""
    last_topic: Optional[str] = None
    mentioned_runs: List[str] = None
    mentioned_shoes: List[str] = None
    mentioned_goals: List[str] = None
    conversation_mood: str = "neutral"  # positive, neutral, frustrated
    last_action: Optional[str] = None
    
    def __post_init__(self):
        if self.mentioned_runs is None:
            self.mentioned_runs = []
        if self.mentioned_shoes is None:
            self.mentioned_shoes = []
        if self.mentioned_goals is None:
            self.mentioned_goals = []


class UserSession:
    """Manages user session and context."""
    
    def __init__(self, user_id: str, session_id: Optional[str] = None):
        self.user_id = user_id
        self.session_id = session_id or f"session_{user_id}_{int(time.time())}"
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.preferences: Optional[UserPreferences] = None
        self.conversation_context = ConversationContext()
        self.cached_user_data: Dict[str, Any] = {}
        self.session_metadata: Dict[str, Any] = {}
        self.db_id: Optional[str] = None  # Database record ID
        self._needs_db_save = False
        
    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()
        self._needs_db_save = True
    
    def is_expired(self, timeout_minutes: int = 60) -> bool:
        """Check if session has expired."""
        expiry_time = self.last_activity + timedelta(minutes=timeout_minutes)
        return datetime.utcnow() > expiry_time
    
    def mark_dirty(self):
        """Mark session as needing database save."""
        self._needs_db_save = True
    
    def mark_clean(self):
        """Mark session as clean (saved to database)."""
        self._needs_db_save = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary for storage."""
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'preferences': self.preferences.dict() if self.preferences else None,
            'conversation_context': asdict(self.conversation_context),
            'cached_user_data': self.cached_user_data,
            'session_metadata': self.session_metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], db_id: Optional[str] = None) -> 'UserSession':
        """Create session from dictionary."""
        session = cls(data['user_id'], data.get('session_id'))
        session.created_at = datetime.fromisoformat(data['created_at'])
        session.last_activity = datetime.fromisoformat(data['last_activity'])
        session.db_id = db_id
        
        if data.get('preferences'):
            session.preferences = UserPreferences(**data['preferences'])
        
        if data.get('conversation_context'):
            session.conversation_context = ConversationContext(**data['conversation_context'])
        
        session.cached_user_data = data.get('cached_user_data', {})
        session.session_metadata = data.get('session_metadata', {})
        session._needs_db_save = False  # Just loaded from DB
        
        return session


class UserContextManager:
    """Manages user contexts and sessions."""
    
    def __init__(self):
        self.active_sessions: Dict[str, UserSession] = {}
        self.current_user_id: Optional[str] = None
        self._cleanup_task: Optional[asyncio.Task] = None
        self._save_task: Optional[asyncio.Task] = None
        self._initialized = False
        self._start_background_tasks()
    
    def _start_background_tasks(self):
        """Start background tasks for cleanup and saving."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_expired_sessions())
        if self._save_task is None or self._save_task.done():
            self._save_task = asyncio.create_task(self._periodic_save_sessions())
    
    async def _cleanup_expired_sessions(self):
        """Cleanup expired sessions periodically."""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                expired_sessions = [
                    user_id for user_id, session in self.active_sessions.items()
                    if session.is_expired()
                ]
                
                # Save and remove expired sessions
                for user_id in expired_sessions:
                    session = self.active_sessions[user_id]
                    await self._save_session_to_db(session, active=False)
                    del self.active_sessions[user_id]
                
                # Cleanup old sessions from database
                await self._cleanup_old_sessions_from_db()
                
                if expired_sessions:
                    print(f"Cleaned up {len(expired_sessions)} expired sessions")
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in session cleanup: {e}")
    
    async def _periodic_save_sessions(self):
        """Periodically save dirty sessions to database."""
        while True:
            try:
                await asyncio.sleep(60)  # Save every minute
                saved_count = 0
                
                for session in self.active_sessions.values():
                    if session._needs_db_save:
                        await self._save_session_to_db(session)
                        session.mark_clean()
                        saved_count += 1
                
                if saved_count > 0:
                    print(f"Saved {saved_count} sessions to database")
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in periodic session save: {e}")
    
    async def set_current_user(self, user_id: str) -> UserSession:
        """Set the current user and create/retrieve their session."""
        # Ensure we've recovered sessions on first use
        await self._recover_sessions_on_startup()
        
        # Validate user exists in database
        from ..server import get_pool
        pool = await get_pool()
        
        user_row = await fetchrow_with_timeout(
            pool, 
            'SELECT id, name, email FROM "Users" WHERE id=$1', 
            user_id
        )
        
        if not user_row:
            raise ValueError(f"User {user_id} not found")
        
        self.current_user_id = user_id
        
        # Get or create session
        if user_id in self.active_sessions:
            session = self.active_sessions[user_id]
            session.update_activity()
        else:
            # Try to load existing session from database first
            session = await self._load_session_from_db(user_id)
            
            if session:
                # Found existing session, update activity
                session.update_activity()
                self.active_sessions[user_id] = session
            else:
                # Create new session
                session = UserSession(user_id)
                session.mark_dirty()  # Needs to be saved
                # Load user preferences from database
                await self._load_user_preferences(session)
                # Cache basic user data
                await self._cache_user_data(session)
                self.active_sessions[user_id] = session
        
        return session
    
    def get_current_session(self) -> Optional[UserSession]:
        """Get the current user's session."""
        if self.current_user_id and self.current_user_id in self.active_sessions:
            session = self.active_sessions[self.current_user_id]
            if not session.is_expired():
                session.update_activity()
                return session
            else:
                # Session expired, remove it
                del self.active_sessions[self.current_user_id]
                self.current_user_id = None
        return None
    
    def get_current_user_id(self) -> Optional[str]:
        """Get the current user ID."""
        session = self.get_current_session()
        return session.user_id if session else None
    
    async def switch_user_context(self, user_id: str) -> UserSession:
        """Switch to a different user context."""
        return await self.set_current_user(user_id)
    
    def clear_current_user(self):
        """Clear the current user context."""
        self.current_user_id = None
    
    async def update_conversation_context(self, **context_updates):
        """Update conversation context for current user."""
        session = self.get_current_session()
        if session:
            for key, value in context_updates.items():
                if hasattr(session.conversation_context, key):
                    setattr(session.conversation_context, key, value)
            session.update_activity()
            session.mark_dirty()
    
    async def update_user_preferences(self, preferences: Dict[str, Any]):
        """Update user preferences for current user."""
        session = self.get_current_session()
        if session:
            if session.preferences:
                # Update existing preferences
                for key, value in preferences.items():
                    if hasattr(session.preferences, key):
                        setattr(session.preferences, key, value)
            else:
                # Create new preferences
                session.preferences = UserPreferences(**preferences)
            
            # Save to database
            await self._save_user_preferences(session)
            session.update_activity()
            session.mark_dirty()
    
    async def _load_user_preferences(self, session: UserSession):
        """Load user preferences from database."""
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            # Try to get user's default units from Users table
            user_row = await fetchrow_with_timeout(
                pool,
                'SELECT "defaultDistanceUnit", "defaultElevationUnit" FROM "Users" WHERE id=$1',
                session.user_id
            )
            
            if user_row:
                distance_unit = user_row.get('defaultDistanceUnit', 'miles')
                session.preferences = UserPreferences(distance_unit=distance_unit)
            else:
                session.preferences = UserPreferences()
                
        except Exception as e:
            # Default preferences if loading fails
            session.preferences = UserPreferences()
            print(f"Failed to load user preferences: {e}")
    
    async def _save_user_preferences(self, session: UserSession):
        """Save user preferences to database."""
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            if session.preferences:
                # Update user's default distance unit in database
                await pool.execute(
                    'UPDATE "Users" SET "defaultDistanceUnit"=$1, "updatedAt"=NOW() WHERE id=$2',
                    session.preferences.distance_unit,
                    session.user_id
                )
                
        except Exception as e:
            print(f"Failed to save user preferences: {e}")
    
    async def _cache_user_data(self, session: UserSession):
        """Cache frequently accessed user data."""
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            # Cache basic user info
            user_row = await fetchrow_with_timeout(
                pool,
                'SELECT name, email, "trainingLevel", goals FROM "Users" WHERE id=$1',
                session.user_id
            )
            
            if user_row:
                session.cached_user_data = {
                    'name': user_row['name'],
                    'email': user_row['email'],
                    'training_level': user_row.get('trainingLevel'),
                    'goals': user_row.get('goals', [])
                }
            
            # Cache recent run count
            recent_runs = await fetchrow_with_timeout(
                pool,
                'SELECT COUNT(*) as count FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'30 days\'',
                session.user_id
            )
            
            if recent_runs:
                session.cached_user_data['recent_runs_count'] = recent_runs['count']
                
        except Exception as e:
            print(f"Failed to cache user data: {e}")
    
    async def _save_session_to_db(self, session: UserSession, active: bool = True):
        """Save session to database."""
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            session_data = session.to_dict()
            expires_at = session.last_activity + timedelta(hours=24)  # 24 hour expiry
            
            if session.db_id:
                # Update existing session
                await execute_with_timeout(
                    pool,
                    '''UPDATE "UserSessions" 
                       SET "sessionData"=$1, "lastActivity"=$2, "expiresAt"=$3, active=$4 
                       WHERE id=$5''',
                    json.dumps(session_data),
                    session.last_activity,
                    expires_at,
                    active,
                    session.db_id
                )
            else:
                # Create new session
                session.db_id = str(uuid.uuid4())
                await execute_with_timeout(
                    pool,
                    '''INSERT INTO "UserSessions" 
                       (id, "userId", "sessionId", "sessionData", "createdAt", "lastActivity", "expiresAt", active)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)''',
                    session.db_id,
                    session.user_id,
                    session.session_id,
                    json.dumps(session_data),
                    session.created_at,
                    session.last_activity,
                    expires_at,
                    active
                )
                
        except Exception as e:
            print(f"Failed to save session to database: {e}")
    
    async def _load_session_from_db(self, user_id: str) -> Optional[UserSession]:
        """Load most recent active session for user from database."""
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            row = await fetchrow_with_timeout(
                pool,
                '''SELECT id, "sessionData", "createdAt", "lastActivity" 
                   FROM "UserSessions" 
                   WHERE "userId"=$1 AND active=true AND "expiresAt" > NOW()
                   ORDER BY "lastActivity" DESC LIMIT 1''',
                user_id
            )
            
            if row:
                session_data = json.loads(row['sessionData'])
                session = UserSession.from_dict(session_data, row['id'])
                return session
                
        except Exception as e:
            print(f"Failed to load session from database: {e}")
        
        return None
    
    async def _cleanup_old_sessions_from_db(self):
        """Remove old expired sessions from database."""
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            # Delete sessions older than 7 days
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            await execute_with_timeout(
                pool,
                'DELETE FROM "UserSessions" WHERE "lastActivity" < $1',
                cutoff_date
            )
            
        except Exception as e:
            print(f"Failed to cleanup old sessions from database: {e}")
    
    async def _recover_sessions_on_startup(self):
        """Recover active sessions from database on startup."""
        if self._initialized:
            return
            
        try:
            from ..server import get_pool
            pool = await get_pool()
            
            # Load all active sessions that haven't expired
            rows = await fetch_with_timeout(
                pool,
                '''SELECT id, "userId", "sessionData" 
                   FROM "UserSessions" 
                   WHERE active=true AND "expiresAt" > NOW()
                   ORDER BY "lastActivity" DESC'''
            )
            
            recovered_count = 0
            for row in rows:
                try:
                    session_data = json.loads(row['sessionData'])
                    session = UserSession.from_dict(session_data, row['id'])
                    
                    # Only keep the most recent session per user
                    if session.user_id not in self.active_sessions:
                        self.active_sessions[session.user_id] = session
                        recovered_count += 1
                    else:
                        # Mark older session as inactive
                        await execute_with_timeout(
                            pool,
                            'UPDATE "UserSessions" SET active=false WHERE id=$1',
                            row['id']
                        )
                        
                except Exception as e:
                    print(f"Failed to recover session {row['id']}: {e}")
            
            self._initialized = True
            if recovered_count > 0:
                print(f"Recovered {recovered_count} active sessions from database")
                
        except Exception as e:
            print(f"Failed to recover sessions on startup: {e}")
            self._initialized = True  # Don't retry indefinitely
    
    def get_session_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get session information for a user."""
        if user_id in self.active_sessions:
            session = self.active_sessions[user_id]
            return {
                'session_id': session.session_id,
                'created_at': session.created_at.isoformat(),
                'last_activity': session.last_activity.isoformat(),
                'is_current': user_id == self.current_user_id,
                'cached_data_keys': list(session.cached_user_data.keys())
            }
        return None
    
    async def cleanup(self):
        """Cleanup resources."""
        # Save all dirty sessions before cleanup
        for session in self.active_sessions.values():
            if session._needs_db_save:
                await self._save_session_to_db(session)
        
        # Cancel background tasks
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
        if self._save_task and not self._save_task.done():
            self._save_task.cancel()


# Global user context manager instance
_user_context_manager: Optional[UserContextManager] = None


def get_user_context_manager() -> UserContextManager:
    """Get the global user context manager instance."""
    global _user_context_manager
    if _user_context_manager is None:
        _user_context_manager = UserContextManager()
    return _user_context_manager


def get_current_user_session() -> Optional[UserSession]:
    """Get the current user session."""
    manager = get_user_context_manager()
    return manager.get_current_session()


def get_current_user_id() -> Optional[str]:
    """Get the current user ID."""
    manager = get_user_context_manager()
    return manager.get_current_user_id()


def require_user_context():
    """Decorator to require user context for MCP tools."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            if not get_current_user_id():
                return "Error: No user context set. Please use set_current_user first."
            return await func(*args, **kwargs)
        return wrapper
    return decorator