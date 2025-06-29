"""Configuration management for Maratron AI MCP Server."""
import os
from enum import Enum
from typing import Optional
from urllib.parse import urlparse
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Application environment types."""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class LogLevel(str, Enum):
    """Logging levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class DatabaseConfig(BaseModel):
    """Database configuration with validation."""
    
    # Database connection settings
    url: str = Field(
        default="postgresql://maratron:yourpassword@localhost:5432/maratrondb",
        description="PostgreSQL database URL"
    )
    
    # Connection pool settings
    min_connections: int = Field(default=1, ge=1, le=100)
    max_connections: int = Field(default=10, ge=1, le=100)
    connection_timeout: float = Field(default=60.0, ge=1.0, le=300.0)
    command_timeout: float = Field(default=60.0, ge=1.0, le=300.0)
    
    # Database operation settings
    query_timeout: float = Field(default=30.0, ge=1.0, le=300.0)
    retry_attempts: int = Field(default=3, ge=0, le=10)
    retry_delay: float = Field(default=1.0, ge=0.1, le=10.0)
    
    @field_validator('url')
    @classmethod
    def validate_database_url(cls, v):
        """Validate database URL format."""
        if not v:
            raise ValueError("Database URL cannot be empty")
        
        try:
            parsed = urlparse(v)
            if parsed.scheme not in ('postgresql', 'postgres'):
                raise ValueError("Database URL must use postgresql:// or postgres:// scheme")
            
            if not parsed.hostname:
                raise ValueError("Database URL must include hostname")
            
            if not parsed.path or parsed.path == '/':
                raise ValueError("Database URL must include database name")
                
            return v
        except Exception as e:
            raise ValueError(f"Invalid database URL format: {e}")
    
    @field_validator('max_connections')
    @classmethod
    def validate_connection_limits(cls, v, info):
        """Ensure max_connections >= min_connections."""
        min_conn = info.data.get('min_connections', 1)
        if v < min_conn:
            raise ValueError(f"max_connections ({v}) must be >= min_connections ({min_conn})")
        return v


class ServerConfig(BaseModel):
    """Server configuration settings."""
    
    # Server identification
    name: str = Field(default="maratron-ai")
    version: str = Field(default="1.0.0")
    description: str = Field(default="Maratron AI MCP Database Server")
    
    # Runtime settings
    debug: bool = Field(default=False)
    log_level: LogLevel = Field(default=LogLevel.INFO)
    
    # Performance settings
    max_concurrent_operations: int = Field(default=100, ge=1, le=1000)
    operation_timeout: float = Field(default=30.0, ge=1.0, le=300.0)


class Config(BaseSettings):
    """Main application configuration."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",
        extra="ignore"
    )
    
    # Environment
    environment: Environment = Field(default=Environment.DEVELOPMENT)
    
    # Configuration sections
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    server: ServerConfig = Field(default_factory=ServerConfig)
    
    # Global settings
    timezone: str = Field(default="UTC")
    
    @field_validator('environment', mode='before')
    @classmethod
    def validate_environment(cls, v):
        """Validate and normalize environment."""
        if isinstance(v, str):
            v = v.lower()
            if v in ('dev', 'develop'):
                return Environment.DEVELOPMENT
            elif v in ('test', 'tests'):
                return Environment.TESTING
            elif v in ('stage', 'staging'):
                return Environment.STAGING
            elif v in ('prod', 'production'):
                return Environment.PRODUCTION
        return v
    
    @classmethod
    def load_config(cls, env_file: Optional[str] = None) -> 'Config':
        """Load configuration from environment and files."""
        # Determine environment
        env = os.getenv('ENVIRONMENT', 'development').lower()
        
        # Load base config
        config_files = ['.env']
        
        # Add environment-specific config
        env_specific_file = f'.env.{env}'
        if os.path.exists(env_specific_file):
            config_files.append(env_specific_file)
        
        # Add user-specified file
        if env_file and os.path.exists(env_file):
            config_files.append(env_file)
        
        # Create config instance
        config = cls(_env_file=config_files)
        
        # Validate configuration
        config.validate_config()
        
        return config
    
    def validate_config(self):
        """Perform additional configuration validation."""
        # Environment-specific validations
        if self.environment == Environment.PRODUCTION:
            if self.server.debug:
                raise ValueError("Debug mode should not be enabled in production")
            
            if self.server.log_level == LogLevel.DEBUG:
                raise ValueError("Debug logging should not be enabled in production")
        
        # Database validations (only if using default database URL)
        if self.environment == Environment.TESTING:
            current_url = self.get_database_url()
            if current_url == self.database.url and 'test' not in current_url.lower():
                raise ValueError("Test environment should use a test database")
    
    def get_database_url(self, override_env: Optional[Environment] = None) -> str:
        """Get database URL, optionally for a specific environment."""
        env = override_env or self.environment
        
        # Return environment-specific database URLs
        if env == Environment.TESTING:
            return os.getenv('TEST_DATABASE_URL', self.database.url)
        elif env == Environment.STAGING:
            return os.getenv('STAGING_DATABASE_URL', self.database.url)
        elif env == Environment.PRODUCTION:
            return os.getenv('PRODUCTION_DATABASE_URL', self.database.url)
        else:
            # For development, check for generic DATABASE_URL first, then fall back to default
            return os.getenv('DATABASE_URL', self.database.url)
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == Environment.DEVELOPMENT
    
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return self.environment == Environment.TESTING
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == Environment.PRODUCTION


# Global configuration instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get the global configuration instance."""
    global _config
    if _config is None:
        _config = Config.load_config()
    return _config


def reload_config(env_file: Optional[str] = None) -> Config:
    """Reload configuration from files."""
    global _config
    _config = Config.load_config(env_file)
    return _config


def set_config(config: Config) -> None:
    """Set the global configuration instance (mainly for testing)."""
    global _config
    _config = config