"""Unit tests for configuration management."""
import os
import pytest
from unittest.mock import patch, mock_open
from pydantic import ValidationError

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from maratron_ai.config import (
    Config, DatabaseConfig, ServerConfig, Environment, LogLevel,
    get_config, reload_config, set_config
)


@pytest.mark.unit
class TestDatabaseConfig:
    """Test database configuration validation."""

    def test_valid_database_url(self):
        """Test valid database URL."""
        config = DatabaseConfig(url="postgresql://user:pass@localhost:5432/testdb")
        assert config.url == "postgresql://user:pass@localhost:5432/testdb"

    def test_postgres_scheme_url(self):
        """Test postgres:// scheme is accepted."""
        config = DatabaseConfig(url="postgres://user:pass@localhost:5432/testdb")
        assert config.url == "postgres://user:pass@localhost:5432/testdb"

    def test_invalid_scheme(self):
        """Test invalid database URL scheme."""
        with pytest.raises(ValidationError, match="postgresql:// or postgres://"):
            DatabaseConfig(url="mysql://user:pass@localhost:3306/testdb")

    def test_missing_hostname(self):
        """Test database URL without hostname."""
        with pytest.raises(ValidationError, match="must include hostname"):
            DatabaseConfig(url="postgresql://user:pass@:5432/testdb")

    def test_missing_database_name(self):
        """Test database URL without database name."""
        with pytest.raises(ValidationError, match="must include database name"):
            DatabaseConfig(url="postgresql://user:pass@localhost:5432/")

    def test_empty_url(self):
        """Test empty database URL."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            DatabaseConfig(url="")

    def test_connection_limits_validation(self):
        """Test connection limits validation."""
        # Valid limits
        config = DatabaseConfig(min_connections=2, max_connections=10)
        assert config.min_connections == 2
        assert config.max_connections == 10

        # Invalid limits
        with pytest.raises(ValidationError, match="max_connections.*must be >= min_connections"):
            DatabaseConfig(min_connections=10, max_connections=5)

    def test_timeout_validation(self):
        """Test timeout parameter validation."""
        # Valid timeouts
        config = DatabaseConfig(
            connection_timeout=30.0,
            command_timeout=60.0,
            query_timeout=15.0
        )
        assert config.connection_timeout == 30.0
        assert config.command_timeout == 60.0
        assert config.query_timeout == 15.0

        # Invalid timeouts (too low)
        with pytest.raises(ValidationError):
            DatabaseConfig(connection_timeout=0.5)

        with pytest.raises(ValidationError):
            DatabaseConfig(query_timeout=0.0)


@pytest.mark.unit
class TestServerConfig:
    """Test server configuration."""

    def test_default_server_config(self):
        """Test default server configuration."""
        config = ServerConfig()
        assert config.name == "maratron-ai"
        assert config.version == "1.0.0"
        assert config.debug is False
        assert config.log_level == LogLevel.INFO

    def test_custom_server_config(self):
        """Test custom server configuration."""
        config = ServerConfig(
            name="custom agent",
            version="2.0.0",
            debug=True,
            log_level=LogLevel.DEBUG
        )
        assert config.name == "custom agent"
        assert config.version == "2.0.0"
        assert config.debug is True
        assert config.log_level == LogLevel.DEBUG

    def test_performance_settings(self):
        """Test performance setting validation."""
        config = ServerConfig(
            max_concurrent_operations=50,
            operation_timeout=45.0
        )
        assert config.max_concurrent_operations == 50
        assert config.operation_timeout == 45.0

        # Test limits
        with pytest.raises(ValidationError):
            ServerConfig(max_concurrent_operations=0)

        with pytest.raises(ValidationError):
            ServerConfig(operation_timeout=0.5)


@pytest.mark.unit
class TestMainConfig:
    """Test main configuration class."""

    def test_default_config(self):
        """Test default configuration."""
        config = Config()
        assert config.environment == Environment.DEVELOPMENT
        assert isinstance(config.database, DatabaseConfig)
        assert isinstance(config.server, ServerConfig)

    def test_environment_validation(self):
        """Test environment validation and normalization."""
        # Test string normalization
        config = Config(environment="dev")
        assert config.environment == Environment.DEVELOPMENT

        config = Config(environment="test")
        assert config.environment == Environment.TESTING

        config = Config(environment="prod")
        assert config.environment == Environment.PRODUCTION

        config = Config(environment="staging")
        assert config.environment == Environment.STAGING

    def test_nested_configuration(self):
        """Test nested configuration with environment variables."""
        with patch.dict(os.environ, {
            'DATABASE__URL': 'postgresql://test:test@localhost:5432/testdb',
            'DATABASE__MAX_CONNECTIONS': '5',
            'SERVER__DEBUG': 'true',
            'SERVER__LOG_LEVEL': 'DEBUG'
        }):
            config = Config()
            assert config.database.url == 'postgresql://test:test@localhost:5432/testdb'
            assert config.database.max_connections == 5
            assert config.server.debug is True
            assert config.server.log_level == LogLevel.DEBUG

    def test_production_validation(self):
        """Test production environment validation."""
        # Should raise error if debug is enabled in production
        with pytest.raises(ValueError, match="Debug mode should not be enabled"):
            config = Config(
                environment=Environment.PRODUCTION,
                server=ServerConfig(debug=True)
            )
            config.validate_config()

        # Should raise error if debug logging is enabled in production
        with pytest.raises(ValueError, match="Debug logging should not be enabled"):
            config = Config(
                environment=Environment.PRODUCTION,
                server=ServerConfig(log_level=LogLevel.DEBUG)
            )
            config.validate_config()

    def test_testing_environment_validation(self):
        """Test testing environment validation."""
        # Should raise error if not using test database
        with pytest.raises(ValueError, match="should use a test database"):
            config = Config(
                environment=Environment.TESTING,
                database=DatabaseConfig(url="postgresql://user:pass@localhost:5432/production_db")
            )
            config.validate_config()

        # Should pass with test database
        config = Config(
            environment=Environment.TESTING,
            database=DatabaseConfig(url="postgresql://user:pass@localhost:5432/test_db")
        )
        config.validate_config()  # Should not raise

    def test_get_database_url_by_environment(self):
        """Test getting database URL for different environments."""
        config = Config()

        # Test default environment - should return DATABASE_URL from environment if set
        expected_url = os.getenv('DATABASE_URL', config.database.url)
        assert config.get_database_url() == expected_url

        # Test with environment variables
        with patch.dict(os.environ, {
            'TEST_DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
            'STAGING_DATABASE_URL': 'postgresql://staging:staging@localhost:5432/staging_db',
            'PRODUCTION_DATABASE_URL': 'postgresql://prod:prod@localhost:5432/prod_db'
        }):
            assert config.get_database_url(Environment.TESTING) == 'postgresql://test:test@localhost:5432/test_db'
            assert config.get_database_url(Environment.STAGING) == 'postgresql://staging:staging@localhost:5432/staging_db'
            assert config.get_database_url(Environment.PRODUCTION) == 'postgresql://prod:prod@localhost:5432/prod_db'

    def test_environment_helpers(self):
        """Test environment helper methods."""
        dev_config = Config(environment=Environment.DEVELOPMENT)
        assert dev_config.is_development() is True
        assert dev_config.is_testing() is False
        assert dev_config.is_production() is False

        test_config = Config(environment=Environment.TESTING)
        assert test_config.is_development() is False
        assert test_config.is_testing() is True
        assert test_config.is_production() is False

        prod_config = Config(environment=Environment.PRODUCTION)
        assert prod_config.is_development() is False
        assert prod_config.is_testing() is False
        assert prod_config.is_production() is True


@pytest.mark.unit
class TestConfigManagement:
    """Test configuration management functions."""

    def test_global_config_singleton(self):
        """Test global configuration singleton behavior."""
        # Clear global config
        from maratron_ai import config
        config._config = None

        # First call should create config
        config1 = get_config()
        assert config1 is not None

        # Second call should return same instance
        config2 = get_config()
        assert config1 is config2

    def test_reload_config(self):
        """Test configuration reloading."""
        # Set initial config
        original_config = Config(environment=Environment.DEVELOPMENT)
        set_config(original_config)

        # Reload should create new instance
        with patch.dict(os.environ, {
            'ENVIRONMENT': 'testing', 
            'TEST_DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db'
        }):
            new_config = reload_config()
            assert new_config.environment == Environment.TESTING
            assert new_config is not original_config

    def test_set_config(self):
        """Test setting custom configuration."""
        custom_config = Config(
            environment=Environment.STAGING,
            server=ServerConfig(name="custom test agent")
        )
        
        set_config(custom_config)
        retrieved_config = get_config()
        
        assert retrieved_config is custom_config
        assert retrieved_config.environment == Environment.STAGING
        assert retrieved_config.server.name == "custom test agent"

    @patch('builtins.open', new_callable=mock_open, read_data='ENVIRONMENT=production\nSERVER__DEBUG=false')
    @patch('os.path.exists')
    def test_load_config_with_files(self, mock_exists, mock_file):
        """Test loading configuration from files."""
        mock_exists.return_value = True
        
        with patch.dict(os.environ, {}, clear=True):
            config = Config.load_config()
            # Should have loaded from the mocked file
            assert config is not None

    @patch('os.path.exists')
    def test_load_config_missing_files(self, mock_exists):
        """Test loading configuration when files don't exist."""
        mock_exists.return_value = False
        
        with patch.dict(os.environ, {'ENVIRONMENT': 'development'}, clear=True):
            config = Config.load_config()
            assert config.environment == Environment.DEVELOPMENT