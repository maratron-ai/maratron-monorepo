"""Unit tests for database tools with mocked connections."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import uuid
from datetime import datetime

# Import the server module
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
from maratron_ai import server


@pytest.mark.unit
class TestUserTools:
    """Test user-related database tools."""

    @patch('maratron_ai.server.get_pool')
    async def test_add_user_success(self, mock_get_pool, mock_pool):
        """Test successful user creation."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = None
        
        result = await server.add_user("John Doe", "john@example.com")
        
        assert "✅ Created user 'John Doe' with ID:" in result
        mock_pool.execute.assert_called_once()
        
        # Verify the SQL call structure
        call_args = mock_pool.execute.call_args
        assert 'INSERT INTO "Users"' in call_args[0][0]
        assert call_args[0][1] is not None  # user_id
        assert call_args[0][2] == "John Doe"
        assert call_args[0][3] == "john@example.com"

    @patch('maratron_ai.server.get_pool')
    async def test_add_user_database_error(self, mock_get_pool, mock_pool):
        """Test user creation with database error."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.side_effect = Exception("Connection failed")
        
        result = await server.add_user("John Doe", "john@example.com")
        
        assert "Database error:" in result and "Connection failed" in result

    # Note: get_user and list_users are now MCP Resources, not Tools
    # These tests are removed as they test Resources which use different patterns

    @patch('maratron_ai.server.get_pool')
    async def test_update_user_email_success(self, mock_get_pool, mock_pool):
        """Test successful email update."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = "UPDATE 1"
        
        result = await server.update_user_email("user-id", "new@example.com")
        
        assert "✅ Updated email for user user-id to new@example.com" == result

    @patch('maratron_ai.server.get_pool')
    async def test_update_user_email_not_found(self, mock_get_pool, mock_pool):
        """Test email update when user doesn't exist."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = "UPDATE 0"
        
        result = await server.update_user_email("nonexistent-id", "new@example.com")
        
        assert result == "❌ User nonexistent-id not found."

    @patch('maratron_ai.server.get_pool')
    async def test_delete_user_success(self, mock_get_pool, mock_pool):
        """Test successful user deletion."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = "DELETE 1"
        
        result = await server.delete_user("user-id")
        
        assert result == "✅ Deleted user user-id"

    @patch('maratron_ai.server.get_pool')
    async def test_delete_user_not_found(self, mock_get_pool, mock_pool):
        """Test user deletion when user doesn't exist."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = "DELETE 0"
        
        result = await server.delete_user("nonexistent-id")
        
        assert result == "❌ User nonexistent-id not found."


@pytest.mark.unit
class TestRunTools:
    """Test run-related database tools."""

    @patch('maratron_ai.server.get_pool')
    async def test_add_run_success(self, mock_get_pool, mock_pool):
        """Test successful run creation."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = None
        
        result = await server.add_run(
            "user-id", "2024-01-15", "00:30:00", 5.0, "miles"
        )
        
        assert "✅ Added run for user user-id with ID:" in result
        mock_pool.execute.assert_called_once()

    # Note: list_recent_runs and list_runs_for_user are now MCP Resources
    # These tests are removed as they test Resources which use different patterns


@pytest.mark.unit
class TestShoeTools:
    """Test shoe-related database tools."""

    @patch('maratron_ai.server.get_pool')
    async def test_add_shoe_success(self, mock_get_pool, mock_pool):
        """Test successful shoe creation."""
        mock_get_pool.return_value = mock_pool
        mock_pool.execute.return_value = None
        
        result = await server.add_shoe("user-id", "Nike Air", 500.0, "miles")
        
        assert "✅ Added shoe 'Nike Air' for user user-id with ID:" in result
        mock_pool.execute.assert_called_once()

    # Note: list_shoes is now an MCP Resource
    # These tests are removed as they test Resources which use different patterns


@pytest.mark.unit
class TestUtilityTools:
    """Test utility database tools."""

    # Note: list_tables, describe_table, and count_rows are now MCP Resources
    # These tests are removed as they test Resources which use different patterns

    def test_quote_ident_valid(self):
        """Test quote_ident with valid identifier."""
        result = server._quote_ident("valid_table_name")
        assert result == '"valid_table_name"'

    def test_quote_ident_invalid(self):
        """Test quote_ident with invalid identifier."""
        with pytest.raises(ValueError, match="Invalid identifier"):
            server._quote_ident("invalid-table-name!")


@pytest.mark.unit
class TestDatabaseConnection:
    """Test database connection management."""

    @patch('maratron_ai.server.asyncpg.create_pool')
    async def test_get_pool_creates_pool(self, mock_create_pool):
        """Test that get_pool creates a new pool when none exists."""
        mock_pool = AsyncMock()
        # Make create_pool return an awaitable
        async def async_create_pool(*args, **kwargs):
            return mock_pool
        mock_create_pool.side_effect = async_create_pool
        
        # Reset the global pool
        server.DB_POOL = None
        
        result = await server.get_pool()
        
        assert result == mock_pool
        # Check that config's database URL was used
        call_args = mock_create_pool.call_args[0]
        assert "postgresql://" in call_args[0]

    @patch('asyncpg.create_pool')
    async def test_get_pool_reuses_existing(self, mock_create_pool):
        """Test that get_pool reuses existing pool."""
        mock_pool = AsyncMock()
        server.DB_POOL = mock_pool
        
        result = await server.get_pool()
        
        assert result == mock_pool
        mock_create_pool.assert_not_called()