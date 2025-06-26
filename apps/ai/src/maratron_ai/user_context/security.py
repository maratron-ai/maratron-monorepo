"""Security and validation for user context management."""
import re
import time
from typing import Optional
from .context import get_current_user_session, get_current_user_id


class SecurityValidator:
    """Security validation for user context operations."""
    
    def __init__(self):
        # Track failed authentication attempts
        self.failed_attempts: dict = {}
        # Track rate limiting
        self.rate_limits: dict = {}
        # Valid user ID pattern (UUID format)
        self.valid_user_id_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        
    def validate_user_id(self, user_id: str) -> bool:
        """Validate user ID format."""
        if not user_id or not isinstance(user_id, str):
            return False
        return bool(self.valid_user_id_pattern.match(user_id.lower()))
    
    def validate_session_access(self, requesting_user_id: str, target_user_id: str) -> bool:
        """Validate if a user can access another user's session."""
        # For now, users can only access their own sessions
        # In the future, this could check admin permissions
        return requesting_user_id == target_user_id
    
    def check_rate_limit(self, operation: str, identifier: str, max_requests: int = 10, window_minutes: int = 1) -> bool:
        """Check if operation is rate limited."""
        now = time.time()
        key = f"{operation}:{identifier}"
        
        # Clean old entries
        if key in self.rate_limits:
            self.rate_limits[key] = [
                timestamp for timestamp in self.rate_limits[key] 
                if now - timestamp < window_minutes * 60
            ]
        else:
            self.rate_limits[key] = []
        
        # Check if under limit
        if len(self.rate_limits[key]) >= max_requests:
            return False
        
        # Add current request
        self.rate_limits[key].append(now)
        return True
    
    def log_failed_attempt(self, operation: str, identifier: str):
        """Log a failed authentication attempt."""
        now = time.time()
        key = f"{operation}:{identifier}"
        
        if key not in self.failed_attempts:
            self.failed_attempts[key] = []
        
        # Clean old attempts (older than 1 hour)
        self.failed_attempts[key] = [
            timestamp for timestamp in self.failed_attempts[key]
            if now - timestamp < 3600
        ]
        
        self.failed_attempts[key].append(now)
    
    def is_blocked(self, operation: str, identifier: str, max_attempts: int = 5) -> bool:
        """Check if identifier is blocked due to too many failed attempts."""
        key = f"{operation}:{identifier}"
        if key not in self.failed_attempts:
            return False
        
        now = time.time()
        recent_failures = [
            timestamp for timestamp in self.failed_attempts[key]
            if now - timestamp < 3600  # Within last hour
        ]
        
        return len(recent_failures) >= max_attempts
    
    def validate_preferences_json(self, preferences_json: str) -> tuple[bool, str]:
        """Validate user preferences JSON."""
        try:
            import json
            prefs = json.loads(preferences_json)
            
            if not isinstance(prefs, dict):
                return False, "Preferences must be a JSON object"
            
            # Validate specific fields
            if 'distance_unit' in prefs:
                if prefs['distance_unit'] not in ['miles', 'kilometers']:
                    return False, "distance_unit must be 'miles' or 'kilometers'"
            
            if 'max_results_per_query' in prefs:
                if not isinstance(prefs['max_results_per_query'], int) or not (1 <= prefs['max_results_per_query'] <= 100):
                    return False, "max_results_per_query must be an integer between 1 and 100"
            
            if 'detailed_responses' in prefs:
                if not isinstance(prefs['detailed_responses'], bool):
                    return False, "detailed_responses must be a boolean"
            
            if 'include_social_data' in prefs:
                if not isinstance(prefs['include_social_data'], bool):
                    return False, "include_social_data must be a boolean"
            
            if 'timezone' in prefs:
                # Basic timezone validation
                if not isinstance(prefs['timezone'], str) or len(prefs['timezone']) > 50:
                    return False, "timezone must be a valid timezone string"
            
            return True, "Valid preferences"
            
        except json.JSONDecodeError:
            return False, "Invalid JSON format"
        except Exception as e:
            return False, f"Validation error: {e}"
    
    def validate_context_json(self, context_json: str) -> tuple[bool, str]:
        """Validate conversation context JSON."""
        try:
            import json
            context = json.loads(context_json)
            
            if not isinstance(context, dict):
                return False, "Context must be a JSON object"
            
            # Validate specific fields
            if 'conversation_mood' in context:
                if context['conversation_mood'] not in ['positive', 'neutral', 'frustrated']:
                    return False, "conversation_mood must be 'positive', 'neutral', or 'frustrated'"
            
            if 'last_topic' in context:
                if not isinstance(context['last_topic'], str) or len(context['last_topic']) > 100:
                    return False, "last_topic must be a string with max 100 characters"
            
            # Validate array fields
            for field in ['mentioned_runs', 'mentioned_shoes', 'mentioned_goals']:
                if field in context:
                    if not isinstance(context[field], list):
                        return False, f"{field} must be an array"
                    if len(context[field]) > 20:  # Reasonable limit
                        return False, f"{field} can contain max 20 items"
            
            return True, "Valid context"
            
        except json.JSONDecodeError:
            return False, "Invalid JSON format"
        except Exception as e:
            return False, f"Validation error: {e}"
    
    def sanitize_string(self, value: str, max_length: int = 100) -> str:
        """Sanitize string input."""
        if not isinstance(value, str):
            return ""
        
        # Remove control characters and limit length
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
        return sanitized[:max_length]
    
    def check_session_permissions(self, operation: str) -> tuple[bool, str]:
        """Check if current session has permissions for operation."""
        session = get_current_user_session()
        
        # Allow set_current_user without an existing session (initial setup)
        if not session and operation == "set_current_user":
            return True, "Initial user setup allowed"
        
        if not session:
            return False, "No active user session"
        
        # Check if session is expired
        if session.is_expired():
            return False, "Session has expired"
        
        # For admin operations, could check user roles here
        # For now, all logged-in users can perform basic operations
        
        # Rate limit based on user ID
        user_id = get_current_user_id()
        if not self.check_rate_limit(operation, user_id):
            return False, f"Rate limit exceeded for {operation}"
        
        return True, "Permission granted"


# Global security validator instance
_security_validator: Optional[SecurityValidator] = None


def get_security_validator() -> SecurityValidator:
    """Get the global security validator instance."""
    global _security_validator
    if _security_validator is None:
        _security_validator = SecurityValidator()
    return _security_validator


def validate_user_operation(operation: str, user_id: Optional[str] = None) -> tuple[bool, str]:
    """Validate a user operation for security."""
    validator = get_security_validator()
    
    # Check session permissions
    valid, message = validator.check_session_permissions(operation)
    if not valid:
        return False, message
    
    # Validate user ID if provided
    if user_id:
        if not validator.validate_user_id(user_id):
            validator.log_failed_attempt(operation, user_id)
            return False, "Invalid user ID format"
        
        # Check if this user ID is blocked
        if validator.is_blocked(operation, user_id):
            return False, "User ID temporarily blocked due to failed attempts"
        
        # Check session access permissions
        current_user = get_current_user_id()
        if current_user and not validator.validate_session_access(current_user, user_id):
            return False, "Insufficient permissions to access this user's data"
    
    return True, "Operation validated"


def secure_user_operation(operation: str):
    """Decorator to secure user operations."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract user_id if it's in the arguments
            user_id = None
            if args and isinstance(args[0], str):
                # First argument might be user_id
                potential_user_id = args[0]
                validator = get_security_validator()
                if validator.validate_user_id(potential_user_id):
                    user_id = potential_user_id
            
            # Validate operation
            valid, message = validate_user_operation(operation, user_id)
            if not valid:
                return f"🔒 Security Error: {message}"
            
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Log the failure for security monitoring
                if user_id:
                    validator = get_security_validator()
                    validator.log_failed_attempt(operation, user_id)
                raise e
        
        return wrapper
    return decorator