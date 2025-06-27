# AI MCP Server Documentation

The Maratron AI server is a FastMCP (Model Context Protocol) server that provides intelligent database tools and user context management for the web application.

## 🏗️ Architecture

### Tech Stack
- **Framework**: FastMCP (Model Context Protocol)
- **Language**: Python 3.11+
- **Database**: PostgreSQL with asyncpg
- **Configuration**: Pydantic with environment-based settings
- **Package Manager**: uv (modern Python package management)
- **Testing**: pytest with async support

### Directory Structure
```
apps/ai/
├── src/maratron_ai/           # Main application code
│   ├── config.py              # Configuration management
│   ├── server.py              # Main MCP server
│   ├── database_utils.py      # Database utilities
│   ├── user_context/          # User context management
│   │   ├── context.py         # Context storage
│   │   ├── tools.py           # Context MCP tools
│   │   ├── security.py        # Security validation
│   │   └── intelligence.py    # Intelligent responses
│   └── security/              # Security modules
│       └── data_isolation.py  # Data isolation layer
├── tests/                     # Test suite
│   ├── unit/                  # Unit tests with mocks
│   └── integration/           # Integration tests
├── scripts/                   # Utility scripts
│   └── health_check.py        # Health monitoring
└── pyproject.toml            # Project configuration
```

## 🔧 Core Components

### MCP Server (`server.py`)
The main FastMCP server that exposes database tools and user context management:

```python
# Available MCP Tools
- set_current_user_tool       # Set user context
- get_current_user_tool       # Get user profile
- add_user                    # Create new user
- list_recent_runs           # Get user's runs
- add_run                    # Record new run
- list_shoes                 # Get user's shoes
- add_shoe                   # Add new shoe
- db_summary                 # Database statistics
```

### Configuration System (`config.py`)
Environment-aware configuration with validation:

```python
class Config(BaseModel):
    environment: Environment = Environment.DEVELOPMENT
    database: DatabaseConfig
    server: ServerConfig
    
    def get_database_url(self) -> str:
        return self.database.url
```

### User Context Management (`user_context/`)
Provides stateful, personalized interactions:

- **Session Management**: Automatic creation and cleanup
- **User Preferences**: Distance units, response style, timezone
- **Conversation Context**: Track topics, mood, entities
- **Intelligence**: Contextual response generation

### Database Layer (`database_utils.py`)
Robust database operations with:

- **Connection Pooling**: Configurable asyncpg pools
- **Error Handling**: Comprehensive retry logic
- **Security**: SQL injection protection
- **Monitoring**: Query timeouts and performance tracking

## 🛠️ Development

### Setup
```bash
cd apps/ai

# Install dependencies with uv
uv sync

# Install with test dependencies
uv sync --extra test

# Run the server
python run_server.py

# Or with MCP Inspector UI
mcp dev server.py
```

### Environment Configuration
```bash
# Environment files
.env.development    # Development settings
.env.testing       # Test environment
.env.staging       # Staging environment
.env.production    # Production settings

# Set environment
export ENVIRONMENT=development
```

#### Key Environment Variables
```env
# Environment
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/maratrondb
DATABASE__MIN_CONNECTIONS=1
DATABASE__MAX_CONNECTIONS=10
DATABASE__QUERY_TIMEOUT=30.0

# Server
SERVER__DEBUG=true
SERVER__LOG_LEVEL=DEBUG
SERVER__MAX_CONCURRENT_OPERATIONS=100
```

### Testing
```bash
# Run unit tests
uv run pytest tests/unit/ -m unit

# Run integration tests (requires test DB)
uv run pytest tests/integration/ -m integration

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/unit/test_database_tools.py

# Run performance tests
uv run pytest tests/ -m slow
```

### Code Quality
```bash
# Linting
uv run ruff check src/ tests/

# Auto-fix issues
uv run ruff check src/ tests/ --fix

# Type checking
uv run mypy src/ --ignore-missing-imports

# Security scanning
uv run bandit -r src/

# Format code
uv run ruff format src/ tests/
```

## 🔌 MCP Tools Reference

### User Context Management

#### `set_current_user_tool(user_id: str)`
Initialize user session and load preferences.

```python
# Usage
await set_current_user_tool("user-uuid-here")

# Returns
"User context set for {user_name}. Preferences loaded: {preferences}"
```

#### `get_current_user_tool()`
Get current user profile and session information.

```python
# Returns user profile with preferences
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": {
    "distance_unit": "miles",
    "response_detail": "detailed",
    "timezone": "America/New_York"
  }
}
```

#### `update_user_preferences_tool(preferences_json: str)`
Update user preferences for personalized responses.

```python
# Example
await update_user_preferences_tool('{"distance_unit": "kilometers"}')
```

### Database Operations

#### `list_recent_runs(limit: int = 10)`
Get user's recent runs with context-aware unit conversion.

```python
# Returns runs in user's preferred units
[
  {
    "id": "run-uuid",
    "date": "2024-01-15",
    "distance": 5.2,  # Converted to user's preferred unit
    "duration": "45:32",
    "pace": "8:45/mile"
  }
]
```

#### `add_run(user_id: str, date: str, duration: str, distance: float, distance_unit: str)`
Record a new run with validation and conversion.

```python
# Example
await add_run(
    user_id="user-uuid",
    date="2024-01-15",
    duration="45:32",
    distance=5.2,
    distance_unit="miles"
)
```

#### `list_shoes(user_id: str)`
Get user's shoe collection with mileage tracking.

```python
# Returns shoes with usage statistics
[
  {
    "id": "shoe-uuid",
    "name": "Nike Air Zoom",
    "total_miles": 245.6,
    "max_miles": 500,
    "status": "active"
  }
]
```

#### `db_summary()`
Get database statistics and health information.

```python
# Returns comprehensive database stats
{
  "total_users": 1250,
  "total_runs": 15670,
  "total_distance": 89234.5,
  "active_users_30d": 342
}
```

## 🧠 User Context Intelligence

### Personalized Responses
The AI server provides contextual, personalized responses based on:

- **User History**: Running patterns, goals, achievements
- **Preferences**: Distance units, response detail level
- **Context**: Recent conversations, current training phase
- **Trends**: Performance improvements, consistency patterns

### Example Intelligent Responses
```python
# For a beginner runner
"I see you're just starting your running journey! Your 3-mile run today 
is a great foundation. Based on your pace, you're building endurance well."

# For an experienced runner
"Nice tempo run! Your 8:15/mile pace for 6 miles shows you're hitting 
your lactate threshold training zone perfectly for your marathon prep."
```

### Context Tracking
- **Session Memory**: Maintains conversation continuity
- **Goal Awareness**: Tracks user's training objectives
- **Progress Recognition**: Celebrates improvements
- **Trend Analysis**: Identifies patterns and provides insights

## 🔒 Security Features

### User Context Security
- **UUID Validation**: All user IDs validated as proper UUIDs
- **Rate Limiting**: 10 requests per minute per operation
- **Session Timeout**: 60 minutes of inactivity
- **Input Sanitization**: All inputs validated and sanitized

### Data Isolation
```python
@ensure_user_context
@validate_user_access
def user_specific_operation(user_id: str):
    # All data operations are user-scoped
    # Automatic validation and isolation
    pass
```

### Database Security
- **Parameterized Queries**: SQL injection prevention
- **Connection Pooling**: Secure connection management
- **Timeout Protection**: Query timeout enforcement
- **Error Sanitization**: No sensitive data in error messages

### Security Monitoring
```python
# Automatic security logging
- Failed authentication attempts
- Rate limit violations
- Invalid UUID access attempts
- Suspicious query patterns
```

## 📊 Configuration Management

### Environment-Specific Settings

#### Development
```python
ENVIRONMENT = "development"
DEBUG = True
LOG_LEVEL = "DEBUG"
MAX_CONNECTIONS = 5
```

#### Testing
```python
ENVIRONMENT = "testing"
DATABASE_URL = "postgresql://test:test@localhost:5432/test_db"
MAX_CONNECTIONS = 2
```

#### Production
```python
ENVIRONMENT = "production"
DEBUG = False
LOG_LEVEL = "INFO"
MAX_CONNECTIONS = 20
QUERY_TIMEOUT = 30.0
```

### Configuration Validation
- Database URL format validation
- Connection limit validation
- Environment-specific restrictions
- Secret validation (no defaults in production)

## 🔍 Health Monitoring

### Health Check System (`scripts/health_check.py`)
Comprehensive system validation:

```bash
# Run health check
python scripts/health_check.py

# Startup validation
python scripts/health_check.py --startup

# Verbose output
python scripts/health_check.py --verbose
```

### Health Check Categories

#### Database Health
- Connection validation
- Required table verification
- Query performance testing
- Connection pool status

#### System Health
- Python version validation
- Required module availability
- Memory usage monitoring
- System resource checks

#### Configuration Health
- Environment variable validation
- Database URL verification
- Security setting validation
- Performance setting checks

### Health Status Levels
- **Healthy**: All systems operational
- **Degraded**: Non-critical issues (missing tables, etc.)
- **Unhealthy**: Critical failures requiring attention

## 🚀 Performance Optimization

### Database Performance
- **Connection Pooling**: Efficient connection reuse
- **Query Optimization**: Indexed queries and efficient joins
- **Timeout Management**: Prevents hung connections
- **Retry Logic**: Automatic retry with exponential backoff

### Memory Management
- **Session Cleanup**: Automatic cleanup of expired sessions
- **Connection Pool Limits**: Prevents memory leaks
- **Context Caching**: Efficient user context storage

### Monitoring Metrics
```python
# Key performance indicators
- Query execution time
- Connection pool utilization
- Active session count
- Memory usage patterns
- Error rates by operation
```

## 🧪 Testing Strategy

### Unit Tests (`tests/unit/`)
- **Mocked Dependencies**: Database operations mocked
- **Pure Logic Testing**: Business logic validation
- **Configuration Testing**: Settings validation
- **Error Handling**: Exception scenarios

### Integration Tests (`tests/integration/`)
- **Real Database**: Test with actual PostgreSQL
- **End-to-End Flows**: Complete operation testing
- **Performance Testing**: Load and stress testing
- **Security Testing**: Authentication and authorization

### Test Database Setup
```bash
# Create test database
createdb test_maratrondb

# Set test environment
export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/test_maratrondb"

# Run integration tests
uv run pytest tests/integration/ -m integration
```

### Coverage Reporting
```bash
# Generate coverage report
uv run pytest --cov=src --cov-report=html

# View in browser
open htmlcov/index.html
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
python -c "import asyncpg; print('asyncpg available')"

# Test connection
python scripts/health_check.py

# Verify database URL
echo $DATABASE_URL
```

#### MCP Server Issues
```bash
# Check server startup
python run_server.py

# Enable debug logging
export SERVER__LOG_LEVEL=DEBUG

# Check port availability
lsof -i :3001
```

#### Performance Issues
```bash
# Check connection pool
python scripts/health_check.py --verbose

# Monitor query performance
# Enable slow query logging in PostgreSQL

# Check system resources
python -c "import psutil; print(f'Memory: {psutil.virtual_memory()}')"
```

### Debug Mode
```python
# Enable verbose logging
SERVER__DEBUG=true
SERVER__LOG_LEVEL=DEBUG

# Database query logging
DATABASE__LOG_QUERIES=true

# Performance monitoring
SERVER__ENABLE_METRICS=true
```

### Production Deployment
```bash
# Health check before deployment
python scripts/health_check.py --startup

# Graceful shutdown
# The server handles SIGTERM for graceful shutdown

# Process monitoring
# Use supervisord or systemd for process management
```