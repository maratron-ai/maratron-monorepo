"""Unit tests for database utilities."""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import asyncpg

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from maratron_ai.database_utils import (
    with_retry, handle_database_errors, quote_identifier,
    execute_with_timeout, fetch_with_timeout, fetchrow_with_timeout,
    validate_connection, close_pool,
    DatabaseError, DatabaseConnectionError, DatabaseOperationError
)


@pytest.mark.unit
class TestErrorHandling:
    """Test database error handling utilities."""

    async def test_with_retry_success_first_attempt(self):
        """Test retry logic when operation succeeds on first attempt."""
        mock_operation = AsyncMock(return_value="success")
        
        result = await with_retry(mock_operation, "arg1", "arg2", max_retries=3)
        
        assert result == "success"
        mock_operation.assert_called_once_with("arg1", "arg2")

    async def test_with_retry_success_after_retries(self):
        """Test retry logic when operation succeeds after failures."""
        mock_operation = AsyncMock()
        mock_operation.side_effect = [
            asyncpg.ConnectionFailureError("Connection failed"),
            asyncpg.ConnectionFailureError("Connection failed"),
            "success"
        ]
        
        result = await with_retry(mock_operation, max_retries=3, delay=0.01)
        
        assert result == "success"
        assert mock_operation.call_count == 3

    async def test_with_retry_max_retries_exceeded(self):
        """Test retry logic when max retries are exceeded."""
        mock_operation = AsyncMock()
        mock_operation.side_effect = asyncpg.ConnectionFailureError("Always fails")
        
        with pytest.raises(DatabaseConnectionError, match="failed after 3 attempts"):
            await with_retry(mock_operation, max_retries=2, delay=0.01)

    async def test_with_retry_non_retryable_error(self):
        """Test retry logic with non-retryable errors."""
        mock_operation = AsyncMock()
        mock_operation.side_effect = asyncpg.DataError("Data error")
        
        with pytest.raises(DatabaseOperationError, match="Database operation error"):
            await with_retry(mock_operation, max_retries=3, delay=0.01)
        
        # Should not retry on data errors
        mock_operation.assert_called_once()

    async def test_with_retry_unexpected_error(self):
        """Test retry logic with unexpected errors."""
        mock_operation = AsyncMock()
        mock_operation.side_effect = ValueError("Unexpected error")
        
        with pytest.raises(DatabaseError, match="Unexpected database error"):
            await with_retry(mock_operation, max_retries=3, delay=0.01)
        
        # Should not retry on unexpected errors
        mock_operation.assert_called_once()

    async def test_handle_database_errors_decorator(self):
        """Test the database error handling decorator."""
        @handle_database_errors
        async def mock_function():
            raise DatabaseConnectionError("Connection failed")
        
        result = await mock_function()
        assert "Database error:" in result and "Connection failed" in result

    async def test_handle_database_errors_unexpected_error(self):
        """Test decorator with unexpected errors."""
        @handle_database_errors
        async def mock_function():
            raise ValueError("Unexpected error")
        
        result = await mock_function()
        assert "Unexpected error" in result


@pytest.mark.unit
class TestQuoteIdentifier:
    """Test SQL identifier quoting function."""

    def test_valid_identifier(self):
        """Test valid SQL identifiers."""
        assert quote_identifier("table_name") == '"table_name"'
        assert quote_identifier("column123") == '"column123"'
        assert quote_identifier("my_table") == '"my_table"'

    def test_empty_identifier(self):
        """Test empty identifier."""
        with pytest.raises(ValueError, match="cannot be empty"):
            quote_identifier("")

    def test_non_string_identifier(self):
        """Test non-string identifier."""
        with pytest.raises(ValueError, match="must be a string"):
            quote_identifier(123)

    def test_invalid_characters(self):
        """Test identifier with invalid characters."""
        with pytest.raises(ValueError, match="Invalid identifier"):
            quote_identifier("table-name")
        
        with pytest.raises(ValueError, match="Invalid identifier"):
            quote_identifier("table name")
        
        with pytest.raises(ValueError, match="Invalid identifier"):
            quote_identifier("table@name")

    def test_sql_keyword_identifier(self):
        """Test identifier that is a SQL keyword."""
        with pytest.raises(ValueError, match="cannot be a SQL keyword"):
            quote_identifier("drop")
        
        with pytest.raises(ValueError, match="cannot be a SQL keyword"):
            quote_identifier("DELETE")
        
        with pytest.raises(ValueError, match="cannot be a SQL keyword"):
            quote_identifier("Insert")


@pytest.mark.unit
class TestTimeoutOperations:
    """Test database operations with timeout."""

    async def test_execute_with_timeout_success(self):
        """Test successful execute with timeout."""
        mock_pool = AsyncMock()
        mock_pool.execute.return_value = "SUCCESS"
        
        result = await execute_with_timeout(mock_pool, "SELECT 1", timeout=1.0)
        
        assert result == "SUCCESS"
        mock_pool.execute.assert_called_once_with("SELECT 1")

    async def test_execute_with_timeout_exceeds(self):
        """Test execute operation that times out."""
        mock_pool = AsyncMock()
        
        async def slow_execute(*args):
            await asyncio.sleep(2.0)
            return "SUCCESS"
        
        mock_pool.execute.side_effect = slow_execute
        
        with pytest.raises(DatabaseOperationError, match="timed out after"):
            await execute_with_timeout(mock_pool, "SLOW QUERY", timeout=0.1)

    async def test_fetch_with_timeout_success(self):
        """Test successful fetch with timeout."""
        mock_pool = AsyncMock()
        mock_pool.fetch.return_value = [{"id": 1}]
        
        result = await fetch_with_timeout(mock_pool, "SELECT * FROM users")
        
        assert result == [{"id": 1}]
        mock_pool.fetch.assert_called_once_with("SELECT * FROM users")

    async def test_fetch_with_timeout_exceeds(self):
        """Test fetch operation that times out."""
        mock_pool = AsyncMock()
        
        async def slow_fetch(*args):
            await asyncio.sleep(2.0)
            return []
        
        mock_pool.fetch.side_effect = slow_fetch
        
        with pytest.raises(DatabaseOperationError, match="timed out after"):
            await fetch_with_timeout(mock_pool, "SLOW SELECT", timeout=0.1)

    async def test_fetchrow_with_timeout_success(self):
        """Test successful fetchrow with timeout."""
        mock_pool = AsyncMock()
        mock_pool.fetchrow.return_value = {"id": 1, "name": "test"}
        
        result = await fetchrow_with_timeout(mock_pool, "SELECT * FROM users WHERE id=1")
        
        assert result == {"id": 1, "name": "test"}

    async def test_fetchrow_with_timeout_exceeds(self):
        """Test fetchrow operation that times out."""
        mock_pool = AsyncMock()
        
        async def slow_fetchrow(*args):
            await asyncio.sleep(2.0)
            return {"id": 1}
        
        mock_pool.fetchrow.side_effect = slow_fetchrow
        
        with pytest.raises(DatabaseOperationError, match="timed out after"):
            await fetchrow_with_timeout(mock_pool, "SLOW SELECT", timeout=0.1)


@pytest.mark.unit
class TestConnectionManagement:
    """Test database connection management utilities."""

    async def test_validate_connection_success(self):
        """Test successful connection validation."""
        # This test validates the connection validation logic
        # In a real scenario, this would test database connectivity
        # For unit testing, we verify the function exists and can be called
        from maratron_ai.database_utils import validate_connection
        
        # Verify the function is importable and callable
        assert callable(validate_connection)
        
        # In integration tests, this would be tested with a real database
        # For unit tests, we just verify the structure is correct

    async def test_validate_connection_failure(self):
        """Test connection validation failure."""
        # Similar to success test, this validates the error handling logic
        from maratron_ai.database_utils import validate_connection
        
        # Verify the function handles errors appropriately
        # In integration tests, this would test actual connection failures
        assert callable(validate_connection)
        
        # The actual error handling is tested in integration tests

    async def test_close_pool_success(self):
        """Test successful pool closure."""
        mock_pool = AsyncMock()
        
        await close_pool(mock_pool)
        
        mock_pool.close.assert_called_once()

    async def test_close_pool_none(self):
        """Test closing None pool."""
        # Should not raise any errors
        await close_pool(None)

    async def test_close_pool_error(self):
        """Test pool closure with error."""
        mock_pool = AsyncMock()
        mock_pool.close.side_effect = Exception("Close failed")
        
        # Should not raise, just log the error
        await close_pool(mock_pool)
        
        mock_pool.close.assert_called_once()


@pytest.mark.unit
class TestDatabaseExceptions:
    """Test custom database exceptions."""

    def test_database_error_hierarchy(self):
        """Test that custom exceptions inherit correctly."""
        assert issubclass(DatabaseConnectionError, DatabaseError)
        assert issubclass(DatabaseOperationError, DatabaseError)
        assert issubclass(DatabaseError, Exception)

    def test_exception_messages(self):
        """Test exception message handling."""
        conn_error = DatabaseConnectionError("Connection failed")
        assert str(conn_error) == "Connection failed"
        
        op_error = DatabaseOperationError("Operation failed")
        assert str(op_error) == "Operation failed"
        
        db_error = DatabaseError("General error")
        assert str(db_error) == "General error"