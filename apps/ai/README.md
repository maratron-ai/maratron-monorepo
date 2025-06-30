# Maratron AI Server

A comprehensive FastMCP server that provides AI-powered database tools and user context management for the Maratron running/fitness platform. Built with the Model Context Protocol (MCP) for intelligent AI-to-application communication.

## 🏗️ Architecture

The Maratron AI Server is a production-ready MCP server that offers:

- **User Context Management**: Personalized AI interactions with session tracking
- **Smart Database Tools**: Comprehensive database operations with user-aware responses  
- **Security**: Rate limiting, input validation, and data isolation
- **Integration**: Seamless connection with the Next.js web application via MCP
- **Intelligence**: Conversation tracking, pattern analysis, and motivational context

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL database
- `uv` package manager (recommended)

### Installation & Setup

```bash
# Install dependencies with uv (recommended)
uv sync

# Or with pip
pip install -e .

# Copy environment configuration
cp .env.example .env

# Start the server
python run_server.py

# Or with MCP Inspector UI for debugging
mcp dev server.py
```

### Environment Configuration

The server uses comprehensive environment-based configuration:

```bash
# Core settings
ENVIRONMENT=development
DATABASE_URL=postgresql://maratron:yourpassword@localhost:5432/maratrondb

# Database connection pooling
DATABASE__MIN_CONNECTIONS=1
DATABASE__MAX_CONNECTIONS=10
DATABASE__QUERY_TIMEOUT=30.0

# Server configuration
SERVER__DEBUG=true
SERVER__LOG_LEVEL=DEBUG
SERVER__MAX_CONCURRENT_OPERATIONS=100
```

## 🛠️ Available Tools & Resources

### MCP Resources (AI-readable content)

**Database Schema & Information:**
- `database://schema` - Complete database schema and table structure
- `database://stats` - Database statistics and row counts

**User Profile Resources:**
- `users://profile/{user_id}` - Complete user profile information
- `user://profile` - Current user's profile (context-aware)

**Running Data Resources:**
- `runs://user/{user_id}/recent` - User's recent runs with detailed metrics
- `runs://user/{user_id}/summary/{period}` - Run summaries for specific periods
- `shoes://user/{user_id}` - User's shoe collection and usage data

### MCP Tools (AI-executable actions)

**Core Database Operations:**
- `add_user(name, email)` - Create new user accounts
- `update_user_email(user_id, email)` - Update user email addresses  
- `delete_user(user_id)` - Remove users from system
- `add_run(user_id, date, duration, distance, ...)` - Record runs with comprehensive data
- `add_shoe(user_id, name, max_distance, ...)` - Add shoes to user collections
- `list_tables()` - Show all database tables
- `describe_table(table_name)` - List columns for a table
- `count_rows(table)` - Show record counts
- `db_summary()` - Complete database statistics

**User Context Management:**
- `set_current_user_tool(user_id)` - Initialize user session (required first step)
- `get_current_user_tool()` - Get current user profile and context
- `switch_user_context_tool(user_id)` - Switch between user contexts
- `clear_user_context_tool()` - Clear current user context
- `update_user_preferences_tool(preferences_json)` - Update user preferences
- `update_conversation_context_tool(context_json)` - Track conversation state
- `get_session_info_tool(user_id)` - Get session information
- `list_active_sessions_tool()` - List all active user sessions

**Smart Intelligence Tools:**
- `get_smart_user_context()` - Get comprehensive personalized context
- `analyze_user_patterns()` - Analyze running patterns and provide insights
- `get_motivational_context()` - Get context for encouraging responses
- `update_conversation_intelligence(...)` - Track conversation intelligence

## 🧪 Development & Testing

### Development Commands

```bash
# Package management with uv
uv sync                                    # Install/update dependencies
uv add <package>                          # Add new dependency
uv remove <package>                       # Remove dependency
uv run <command>                          # Run command in project environment

# Running the server
python run_server.py                     # Start MCP server
mcp dev server.py                        # Start with MCP Inspector UI

# Database operations
python -c "from src.maratron_ai.database_utils import test_connection; test_connection()"
```

### Testing Framework

```bash
# Run all tests
uv run pytest

# Run specific test types
uv run pytest tests/unit/ -m unit              # Unit tests (mocked database)
uv run pytest tests/integration/ -m integration # Integration tests (real database)
uv run pytest tests/unit/ -m slow              # Long-running tests

# Test coverage
uv run pytest --cov=src --cov-report=html      # Generate HTML coverage report
uv run pytest --cov=src --cov-report=term      # Terminal coverage report

# Run complete test suite with test runner
python tests/test_runner.py                    # All tests
python tests/test_runner.py unit               # Unit tests only  
python tests/test_runner.py coverage           # Tests with coverage
```

### Test Database Setup

Integration tests require a PostgreSQL test database:

```bash
# Set test database URL
export TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_maratrondb

# Create test database
createdb test_maratrondb

# Run integration tests
uv run pytest tests/integration/ -m integration
```

## 🔐 Security Features

### Data Protection
- **Data Isolation**: Strict user-specific data access enforcement
- **UUID Validation**: Comprehensive validation for all user identifiers
- **SQL Injection Protection**: Parameterized queries throughout
- **Rate Limiting**: 10 requests/minute per operation with session tracking
- **Session Management**: 60-minute timeout with automatic cleanup

### Input Validation
- JSON schema validation for preferences and context updates
- Comprehensive error handling with retry mechanisms
- Input sanitization and identifier validation
- Environment-specific security configurations

## 🔧 Configuration Management

### Environment Files
- `.env.example` - Template with all available options
- `.env.development` - Development-specific settings
- `.env.testing` - Test environment configuration  
- `.env.staging` - Staging environment settings
- `.env.production` - Production environment settings

### Configuration Validation
- Database URL format and connectivity validation
- Environment-specific restrictions (no debug in production)
- Connection pool limit validation
- Timeout and retry parameter validation

## 📊 User Context System

### Overview
The user context system provides personalized, stateful AI interactions:

- **Session Management**: Automatic session creation and cleanup
- **User Preferences**: Distance units, response detail, timezone settings
- **Conversation Context**: Topic tracking, mood analysis, entity mentions
- **Intelligence**: Pattern analysis and motivational messaging

### Usage Pattern

```python
# 1. Set user context (required first step)
await set_current_user_tool("user-uuid")

# 2. Access resources for AI understanding
user_profile = await read_resource("user://profile")
recent_runs = await read_resource("runs://user/{user_id}/recent")

# 3. Use tools for data operations
await add_run(user_id, "2024-01-15", "00:30:00", 5.0, "miles")

# 4. Leverage smart context for personalized responses
context = await get_smart_user_context()
insights = await analyze_user_patterns()
```

## 🗄️ Database Schema

### Core Entities
- **Users**: Profile data, training preferences, VDOT calculations
- **Runs**: Distance, duration, pace, elevation tracking
- **Shoes**: Mileage tracking with retirement status
- **Social**: Profiles, posts, follows, groups, comments, likes
- **RunningPlans**: JSON-stored training plans

### Technical Patterns
- **Table Naming**: PascalCase with quotes (`"Users"`, `"Runs"`, `"Shoes"`)
- **Primary Keys**: All UUIDs generated with uuid.uuid4()
- **Connection Pooling**: Configurable asyncpg pools with retry logic
- **Migrations**: Schema managed through Prisma in web application

## 📈 Performance & Monitoring

### Connection Management
- Configurable connection pooling (1-10 connections default)
- Query timeout management (30 seconds default)
- Automatic retry logic for transient failures
- Connection health checking

### Logging & Debugging
- Structured logging with configurable levels per environment
- MCP Inspector UI support for real-time debugging
- Performance metrics for database operations
- Error tracking with comprehensive exception handling

## 🤖 AI Integration

### Model Context Protocol (MCP)
- **Framework**: FastMCP for Python-based MCP servers
- **Communication**: Real-time bidirectional with web application
- **Resources**: AI-readable content for context understanding
- **Tools**: AI-executable actions for data manipulation
- **Context**: Intelligent user session and preference management

### Personalization Features
- User preference caching and application
- Conversation intelligence with entity tracking
- Running pattern analysis and insights
- Context-aware motivational messaging
- Smart response generation based on user history

## 📚 Resources

- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Core protocol documentation
- **[FastMCP](https://github.com/jlowin/fastmcp)** - Python MCP server framework
- **[MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)** - Official Python SDK
- **[MCP Servers](https://github.com/modelcontextprotocol/servers)** - Example implementations
- **[uv Package Manager](https://github.com/astral-sh/uv)** - Modern Python package management

## 📄 License

MIT License - see LICENSE file for details