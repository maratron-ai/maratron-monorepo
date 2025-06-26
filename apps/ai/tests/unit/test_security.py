"""Tests for data isolation security system."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.maratron_ai.security.data_isolation import (
    SecureDataAccess, 
    DataAccessViolationError, 
    SecurityAuditLog,
    require_user_context,
    enforce_user_isolation
)


class TestSecurityAuditLog:
    """Test security audit logging functionality."""
    
    def test_log_data_access_success(self):
        """Test successful data access logging."""
        with patch('src.maratron_ai.security.data_isolation.logger') as mock_logger:
            SecurityAuditLog.log_data_access("user123", "fetch", "Users", {"id": "123"}, True)
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args[0][0]
            assert "user=user123" in call_args
            assert "op=fetch" in call_args
            assert "table=Users" in call_args
    
    def test_log_data_access_blocked(self):
        """Test blocked data access logging."""
        with patch('src.maratron_ai.security.data_isolation.logger') as mock_logger:
            SecurityAuditLog.log_data_access("user123", "fetch", "Users", {"id": "456"}, False)
            mock_logger.warning.assert_called_once()
            call_args = mock_logger.warning.call_args[0][0]
            assert "BLOCKED" in call_args
            assert "user=user123" in call_args
    
    def test_log_security_violation(self):
        """Test security violation logging."""
        with patch('src.maratron_ai.security.data_isolation.logger') as mock_logger:
            SecurityAuditLog.log_security_violation("user123", "access_other_user", "Cross-user access attempt")
            mock_logger.error.assert_called_once()
            call_args = mock_logger.error.call_args[0][0]
            assert "SECURITY VIOLATION" in call_args
            assert "user=user123" in call_args


class TestRequireUserContextDecorator:
    """Test the require_user_context decorator."""
    
    @pytest.mark.asyncio
    async def test_with_valid_user_context(self):
        """Test decorator allows access with valid user context."""
        @require_user_context
        async def test_function():
            return "success"
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            result = await test_function()
            assert result == "success"
    
    @pytest.mark.asyncio 
    async def test_without_user_context(self):
        """Test decorator blocks access without user context."""
        @require_user_context
        async def test_function():
            return "success"
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value=None):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await test_function()
            assert "No user session active" in str(exc_info.value)


class TestEnforceUserIsolationDecorator:
    """Test the enforce_user_isolation decorator."""
    
    @pytest.mark.asyncio
    async def test_with_valid_user_context(self):
        """Test decorator adds user ID to kwargs."""
        @enforce_user_isolation()
        async def test_function(**kwargs):
            return kwargs.get('_current_user_id')
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            result = await test_function()
            assert result == "user123"
    
    @pytest.mark.asyncio
    async def test_without_user_context(self):
        """Test decorator blocks access without user context."""
        @enforce_user_isolation()
        async def test_function(**kwargs):
            return "success"
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value=None):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await test_function()
            assert "No user session active" in str(exc_info.value)


class TestSecureDataAccess:
    """Test the SecureDataAccess class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.secure_db = SecureDataAccess()
        self.mock_pool = AsyncMock()
    
    def test_has_user_filter_with_valid_patterns(self):
        """Test query validation with valid user filtering patterns."""
        # Test various valid patterns
        valid_queries = [
            'SELECT * FROM "Users" WHERE "userId"=$1',
            'SELECT * FROM Users WHERE userId=$1',
            'SELECT * FROM "Runs" WHERE "userId" = $1',
            'SELECT * FROM Users WHERE id=$1',
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES',
            'SHOW TABLES'
        ]
        
        for query in valid_queries:
            assert self.secure_db._has_user_filter(query), f"Query should be valid: {query}"
    
    def test_has_user_filter_with_invalid_patterns(self):
        """Test query validation rejects queries without user filtering."""
        # Test invalid patterns
        invalid_queries = [
            'SELECT * FROM "Users"',
            'SELECT * FROM Users',
            'DELETE FROM Users',
            'UPDATE Users SET name="test"'
        ]
        
        for query in invalid_queries:
            assert not self.secure_db._has_user_filter(query), f"Query should be invalid: {query}"
    
    @pytest.mark.asyncio
    async def test_secure_fetch_with_valid_user(self):
        """Test secure fetch with valid user context and query."""
        query = 'SELECT * FROM "Users" WHERE "userId"=$1'
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with patch('src.maratron_ai.security.data_isolation.fetch_with_timeout') as mock_fetch:
                mock_fetch.return_value = [{"id": "1", "name": "Test"}]
                
                result = await self.secure_db.secure_fetch(self.mock_pool, query, "user123", table_name="Users")
                
                mock_fetch.assert_called_once_with(self.mock_pool, query, "user123")
                assert result == [{"id": "1", "name": "Test"}]
    
    @pytest.mark.asyncio
    async def test_secure_fetch_without_user_context(self):
        """Test secure fetch blocks access without user context."""
        query = 'SELECT * FROM "Users" WHERE "userId"=$1'
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value=None):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await self.secure_db.secure_fetch(self.mock_pool, query, "user123", table_name="Users")
            assert "No user session active" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_secure_fetch_with_invalid_query(self):
        """Test secure fetch blocks queries without user filtering."""
        query = 'SELECT * FROM "Users"'  # No user filter
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await self.secure_db.secure_fetch(self.mock_pool, query, table_name="Users")
            assert "Query must filter by user" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_get_user_runs_same_user(self):
        """Test get_user_runs allows access to own data."""
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with patch('src.maratron_ai.security.data_isolation.fetch_with_timeout') as mock_fetch:
                mock_fetch.return_value = [{"id": "run1", "distance": 5.0}]
                
                result = await self.secure_db.get_user_runs(self.mock_pool, "user123", 10)
                
                assert len(result) == 1
                assert result[0]["id"] == "run1"
                mock_fetch.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_runs_different_user(self):
        """Test get_user_runs blocks access to other user's data."""
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await self.secure_db.get_user_runs(self.mock_pool, "user456", 10)
            assert "Can only access your own data" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_get_user_shoes_same_user(self):
        """Test get_user_shoes allows access to own data."""
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with patch('src.maratron_ai.security.data_isolation.fetch_with_timeout') as mock_fetch:
                mock_fetch.return_value = [{"id": "shoe1", "name": "Running Shoe"}]
                
                result = await self.secure_db.get_user_shoes(self.mock_pool, "user123")
                
                assert len(result) == 1 
                assert result[0]["id"] == "shoe1"
                mock_fetch.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_shoes_different_user(self):
        """Test get_user_shoes blocks access to other user's data."""
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await self.secure_db.get_user_shoes(self.mock_pool, "user456")
            assert "Can only access your own data" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_get_user_profile_same_user(self):
        """Test get_user_profile allows access to own profile."""
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with patch('src.maratron_ai.security.data_isolation.fetchrow_with_timeout') as mock_fetchrow:
                mock_fetchrow.return_value = {"id": "user123", "name": "Test User"}
                
                result = await self.secure_db.get_user_profile(self.mock_pool, "user123")
                
                assert result["id"] == "user123"
                assert result["name"] == "Test User"
                mock_fetchrow.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_profile_different_user(self):
        """Test get_user_profile blocks access to other user's profile."""
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await self.secure_db.get_user_profile(self.mock_pool, "user456")
            assert "Can only access your own profile" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_secure_execute_update_with_user_filter(self):
        """Test secure execute allows UPDATE with user filtering."""
        query = 'UPDATE "Users" SET name=$1 WHERE "userId"=$2'
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with patch('src.maratron_ai.security.data_isolation.execute_with_timeout') as mock_execute:
                mock_execute.return_value = "UPDATE 1"
                
                result = await self.secure_db.secure_execute(self.mock_pool, query, "New Name", "user123", table_name="Users")
                
                mock_execute.assert_called_once_with(self.mock_pool, query, "New Name", "user123")
                assert result == "UPDATE 1"
    
    @pytest.mark.asyncio
    async def test_secure_execute_update_without_user_filter(self):
        """Test secure execute blocks UPDATE without user filtering."""
        query = 'UPDATE "Users" SET name=$1'  # No user filter
        
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with pytest.raises(DataAccessViolationError) as exc_info:
                await self.secure_db.secure_execute(self.mock_pool, query, "New Name", table_name="Users")
            assert "Modification must filter by user" in str(exc_info.value)


class TestDataAccessViolationError:
    """Test the custom security exception."""
    
    def test_exception_creation(self):
        """Test creating DataAccessViolationError."""
        error = DataAccessViolationError("Test security violation")
        assert str(error) == "Test security violation"
        assert isinstance(error, Exception)
    
    def test_exception_inheritance(self):
        """Test exception inheritance hierarchy."""
        error = DataAccessViolationError("Test")
        assert isinstance(error, Exception)
        assert isinstance(error, DataAccessViolationError)


class TestSecurityIntegration:
    """Integration tests for security system."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_security_flow(self):
        """Test complete security flow from user context to data access."""
        secure_db = SecureDataAccess()
        mock_pool = AsyncMock()
        
        # Test successful flow
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with patch('src.maratron_ai.security.data_isolation.fetchrow_with_timeout') as mock_fetchrow:
                mock_fetchrow.return_value = {"id": "user123", "name": "Test User"}
                
                result = await secure_db.get_user_profile(mock_pool, "user123")
                assert result["id"] == "user123"
        
        # Test blocked cross-user access
        with patch('src.maratron_ai.security.data_isolation.get_current_user_id', return_value="user123"):
            with pytest.raises(DataAccessViolationError):
                await secure_db.get_user_profile(mock_pool, "user456")
    
    def test_audit_logging_integration(self):
        """Test that audit logging works with security violations."""
        with patch('src.maratron_ai.security.data_isolation.logger') as mock_logger:
            # Test successful access logging
            SecurityAuditLog.log_data_access("user123", "fetch", "Users", {}, True)
            mock_logger.info.assert_called()
            
            # Test violation logging
            SecurityAuditLog.log_security_violation("user123", "cross_user_access", "Blocked")
            mock_logger.error.assert_called()
            
            # Verify both calls were made
            assert mock_logger.info.call_count == 1
            assert mock_logger.error.call_count == 1