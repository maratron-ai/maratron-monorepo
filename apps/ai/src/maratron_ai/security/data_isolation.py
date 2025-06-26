"""Data isolation security layer to prevent cross-user data access."""

import logging
from typing import List, Dict, Any, Optional
from functools import wraps
from ..user_context.context import get_current_user_id
from ..database_utils import fetch_with_timeout, fetchrow_with_timeout, execute_with_timeout

logger = logging.getLogger(__name__)


class DataAccessViolationError(Exception):
    """Raised when a data access violation is detected."""
    pass


class SecurityAuditLog:
    """Security audit logging for data access."""
    
    @staticmethod
    def log_data_access(user_id: str, operation: str, table: str, 
                       filters: Dict[str, Any], success: bool = True):
        """Log data access attempts."""
        if success:
            logger.info(f"Data access: user={user_id}, op={operation}, table={table}, filters={filters}")
        else:
            logger.warning(f"BLOCKED data access: user={user_id}, op={operation}, table={table}, filters={filters}")
    
    @staticmethod 
    def log_security_violation(user_id: str, attempted_access: str, reason: str):
        """Log security violations."""
        logger.error(f"SECURITY VIOLATION: user={user_id}, attempted={attempted_access}, reason={reason}")


def require_user_context(func):
    """Decorator to ensure user context is set before data access."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        current_user = get_current_user_id()
        if not current_user:
            SecurityAuditLog.log_security_violation(
                "unknown", func.__name__, "No user context set"
            )
            raise DataAccessViolationError("🔒 Access denied: No user session active")
        return await func(*args, **kwargs)
    return wrapper


def enforce_user_isolation(allowed_tables: List[str] = None):
    """Decorator to enforce user data isolation."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = get_current_user_id()
            if not current_user:
                raise DataAccessViolationError("🔒 Access denied: No user session active")
            
            # Add current user ID to kwargs for filtering
            kwargs['_current_user_id'] = current_user
            
            result = await func(*args, **kwargs)
            return result
        return wrapper
    return decorator


class SecureDataAccess:
    """Secure data access layer that enforces user isolation."""
    
    def __init__(self):
        self.audit = SecurityAuditLog()
    
    async def secure_fetch(self, pool, query: str, *params, 
                          table_name: str = "unknown") -> List[Dict[str, Any]]:
        """Secure fetch that ensures user isolation."""
        current_user = get_current_user_id()
        if not current_user:
            raise DataAccessViolationError("🔒 No user session active")
        
        # Validate query contains user filtering
        if not self._has_user_filter(query):
            self.audit.log_security_violation(
                current_user, f"fetch from {table_name}", 
                "Query missing user filter"
            )
            raise DataAccessViolationError(f"🔒 Query must filter by user: {table_name}")
        
        self.audit.log_data_access(current_user, "fetch", table_name, {"params": params})
        return await fetch_with_timeout(pool, query, *params)
    
    async def secure_fetchrow(self, pool, query: str, *params,
                             table_name: str = "unknown") -> Optional[Dict[str, Any]]:
        """Secure fetchrow that ensures user isolation."""
        current_user = get_current_user_id()
        if not current_user:
            raise DataAccessViolationError("🔒 No user session active")
        
        if not self._has_user_filter(query):
            self.audit.log_security_violation(
                current_user, f"fetchrow from {table_name}",
                "Query missing user filter"
            )
            raise DataAccessViolationError(f"🔒 Query must filter by user: {table_name}")
        
        self.audit.log_data_access(current_user, "fetchrow", table_name, {"params": params})
        return await fetchrow_with_timeout(pool, query, *params)
    
    async def secure_execute(self, pool, query: str, *params,
                            table_name: str = "unknown") -> str:
        """Secure execute that ensures user isolation."""
        current_user = get_current_user_id()
        if not current_user:
            raise DataAccessViolationError("🔒 No user session active")
        
        # For INSERT/UPDATE/DELETE operations, validate user ownership
        if any(op in query.upper() for op in ['UPDATE', 'DELETE']):
            if not self._has_user_filter(query):
                self.audit.log_security_violation(
                    current_user, f"modify {table_name}",
                    "Modification query missing user filter"
                )
                raise DataAccessViolationError(f"🔒 Modification must filter by user: {table_name}")
        
        self.audit.log_data_access(current_user, "execute", table_name, {"params": params})
        return await execute_with_timeout(pool, query, *params)
    
    def _has_user_filter(self, query: str) -> bool:
        """Check if query includes user filtering."""
        query_upper = query.upper()
        
        # Allow system queries that don't access user data
        system_queries = [
            'INFORMATION_SCHEMA',
            'SHOW TABLES',
            'DESCRIBE',
            'SELECT 1',
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA'
        ]
        
        if any(sys_query in query_upper for sys_query in system_queries):
            return True
        
        # Check for user filtering patterns
        user_filter_patterns = [
            '"USERID"',  # PostgreSQL quoted
            'USERID',    # Unquoted
            '"userId"',  # camelCase quoted
            'userId',    # camelCase unquoted
            'WHERE id=$',  # Single user lookup by ID
            'WHERE ID=$'   # Case variations
        ]
        
        return any(pattern in query_upper for pattern in user_filter_patterns)
    
    async def get_user_runs(self, pool, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Secure method to get user's runs only."""
        current_user = get_current_user_id()
        
        # Only allow access to current user's data
        if current_user != user_id:
            self.audit.log_security_violation(
                current_user, f"access runs for user {user_id}",
                "Attempted cross-user data access"
            )
            raise DataAccessViolationError("🔒 Access denied: Can only access your own data")
        
        query = '''
            SELECT id, date, duration, distance, "distanceUnit", name, pace, notes, "elevationGain"
            FROM "Runs" 
            WHERE "userId" = $1 
            ORDER BY date DESC 
            LIMIT $2
        '''
        
        self.audit.log_data_access(current_user, "get_runs", "Runs", {"user_id": user_id, "limit": limit})
        return await fetch_with_timeout(pool, query, user_id, limit)
    
    async def get_user_shoes(self, pool, user_id: str) -> List[Dict[str, Any]]:
        """Secure method to get user's shoes only."""
        current_user = get_current_user_id()
        
        if current_user != user_id:
            self.audit.log_security_violation(
                current_user, f"access shoes for user {user_id}",
                "Attempted cross-user data access"
            )
            raise DataAccessViolationError("🔒 Access denied: Can only access your own data")
        
        query = '''
            SELECT id, name, "maxDistance", "currentDistance", "distanceUnit", retired, notes, "createdAt"
            FROM "Shoes"
            WHERE "userId" = $1
            ORDER BY "createdAt" DESC
        '''
        
        self.audit.log_data_access(current_user, "get_shoes", "Shoes", {"user_id": user_id})
        return await fetch_with_timeout(pool, query, user_id)
    
    async def get_user_profile(self, pool, user_id: str) -> Optional[Dict[str, Any]]:
        """Secure method to get user profile - only their own."""
        current_user = get_current_user_id()
        
        if current_user != user_id:
            self.audit.log_security_violation(
                current_user, f"access profile for user {user_id}",
                "Attempted cross-user data access"
            )
            raise DataAccessViolationError("🔒 Access denied: Can only access your own profile")
        
        query = '''
            SELECT id, name, email, "trainingLevel", "defaultDistanceUnit", 
                   "createdAt", "updatedAt"
            FROM "Users"
            WHERE id = $1
        '''
        
        self.audit.log_data_access(current_user, "get_profile", "Users", {"user_id": user_id})
        return await fetchrow_with_timeout(pool, query, user_id)


# Global secure data access instance
secure_db = SecureDataAccess()