"""Database utilities with error handling and retry logic."""
import asyncio
import logging
from typing import Any, Callable, TypeVar, Optional
from functools import wraps
import asyncpg
from .config import get_config

logger = logging.getLogger(__name__)
config = get_config()

T = TypeVar('T')


class DatabaseError(Exception):
    """Custom database error for better error handling."""
    pass


class DatabaseConnectionError(DatabaseError):
    """Database connection related errors."""
    pass


class DatabaseOperationError(DatabaseError):
    """Database operation related errors."""
    pass


async def with_retry(
    operation: Callable[..., T],
    *args,
    max_retries: Optional[int] = None,
    delay: Optional[float] = None,
    **kwargs
) -> T:
    """Execute database operation with retry logic."""
    max_retries = max_retries or config.database.retry_attempts
    delay = delay or config.database.retry_delay
    
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return await operation(*args, **kwargs)
        except (asyncpg.ConnectionDoesNotExistError, 
                asyncpg.ConnectionFailureError,
                asyncpg.InterfaceError) as e:
            last_exception = e
            if attempt < max_retries:
                wait_time = delay * (2 ** attempt)  # Exponential backoff
                logger.warning(f"Database operation failed (attempt {attempt + 1}/{max_retries + 1}): {e}")
                logger.info(f"Retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Database operation failed after {max_retries + 1} attempts")
                raise DatabaseConnectionError(f"Database operation failed after {max_retries + 1} attempts: {e}")
        except (asyncpg.PostgresError, asyncpg.DataError) as e:
            # Don't retry on data/SQL errors
            logger.error(f"Database operation failed with non-retryable error: {e}")
            raise DatabaseOperationError(f"Database operation error: {e}")
        except Exception as e:
            # Don't retry on unexpected errors
            logger.error(f"Unexpected error in database operation: {e}")
            raise DatabaseError(f"Unexpected database error: {e}")
    
    # This should never be reached, but just in case
    raise DatabaseConnectionError(f"Operation failed: {last_exception}")


def handle_database_errors(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator to handle database errors consistently."""
    @wraps(func)
    async def wrapper(*args, **kwargs) -> T:
        try:
            return await with_retry(func, *args, **kwargs)
        except DatabaseError as e:
            # Return user-friendly error message
            return f"Database error: {e}"
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {e}")
            return f"Unexpected error: {e}"
    
    return wrapper


async def execute_with_timeout(pool: asyncpg.Pool, query: str, *args, timeout: Optional[float] = None) -> Any:
    """Execute query with configurable timeout."""
    timeout = timeout or config.database.query_timeout
    
    try:
        return await asyncio.wait_for(
            pool.execute(query, *args),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.error(f"Query timed out after {timeout} seconds: {query[:100]}...")
        raise DatabaseOperationError(f"Query timed out after {timeout} seconds")


async def fetch_with_timeout(pool: asyncpg.Pool, query: str, *args, timeout: Optional[float] = None) -> Any:
    """Fetch query results with configurable timeout."""
    timeout = timeout or config.database.query_timeout
    
    try:
        return await asyncio.wait_for(
            pool.fetch(query, *args),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.error(f"Query timed out after {timeout} seconds: {query[:100]}...")
        raise DatabaseOperationError(f"Query timed out after {timeout} seconds")


async def fetchrow_with_timeout(pool: asyncpg.Pool, query: str, *args, timeout: Optional[float] = None) -> Any:
    """Fetch single row with configurable timeout."""
    timeout = timeout or config.database.query_timeout
    
    try:
        return await asyncio.wait_for(
            pool.fetchrow(query, *args),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.error(f"Query timed out after {timeout} seconds: {query[:100]}...")
        raise DatabaseOperationError(f"Query timed out after {timeout} seconds")


def quote_identifier(name: str) -> str:
    """Safely quote an SQL identifier with enhanced validation."""
    if not name:
        raise ValueError("Identifier cannot be empty")
    
    if not isinstance(name, str):
        raise ValueError("Identifier must be a string")
    
    # Allow alphanumeric characters and underscores
    if not name.replace("_", "").isalnum():
        raise ValueError(f"Invalid identifier: {name}")
    
    # Prevent SQL injection attempts
    dangerous_keywords = {'drop', 'delete', 'insert', 'update', 'create', 'alter', 'truncate'}
    if name.lower() in dangerous_keywords:
        raise ValueError(f"Identifier cannot be a SQL keyword: {name}")
    
    return f'"{name}"'


async def validate_connection(pool: asyncpg.Pool) -> bool:
    """Validate database connection is working."""
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection validation failed: {e}")
        return False


async def close_pool(pool: Optional[asyncpg.Pool]) -> None:
    """Safely close database pool."""
    if pool:
        try:
            await pool.close()
            logger.info("Database pool closed successfully")
        except Exception as e:
            logger.error(f"Error closing database pool: {e}")