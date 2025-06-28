# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maratron AI is a FastMCP server that provides database utilities for a PostgreSQL-based running/fitness application. The project uses the Model Context Protocol (MCP) to expose database operations as tools that can be used by AI assistants.

## Development Commands

### Package Management (uv)
- `uv sync` - Update the project's environment and install dependencies
- `uv add <package>` - Add a new dependency to the project
- `uv remove <package>` - Remove a dependency from the project
- `uv run <command>` - Run a command in the project's environment

### Running the Server
- `python server.py` - Run the MCP server directly
- `mcp dev server.py` - Run the server with MCP Inspector UI for debugging
- `pip install -e .` - Install the project in editable mode (alternative approach)

### Testing
- `uv sync --extra test` - Install test dependencies
- `uv run pytest tests/unit/ -m unit` - Run unit tests with mocked database
- `uv run pytest tests/integration/ -m integration` - Run integration tests (requires test database)
- `uv run pytest --cov=server --cov-report=html` - Run tests with coverage report
- `python tests/test_runner.py` - Run complete test suite
- `python tests/test_runner.py unit` - Run only unit tests
- `python tests/test_runner.py coverage` - Run tests with coverage

### Configuration Management
The server uses a comprehensive configuration system with environment-specific settings:

- `cp .env.example .env` - Create local environment file
- Environment files: `.env.development`, `.env.testing`, `.env.staging`, `.env.production`
- Set `ENVIRONMENT=development|testing|staging|production` to switch contexts
- Configuration validation ensures correct settings per environment

### Database Setup
Database configuration is environment-aware with validation:
- **Development**: `DATABASE_URL=postgresql://maratron:yourpassword@localhost:5432/maratrondb`
- **Testing**: `TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_maratrondb`
- **Staging/Production**: Set via environment variables for security

Configuration includes connection pooling, timeouts, and retry logic.

## Architecture

### Core Components
- **server.py**: Main FastMCP server implementation with database tools and user context management
- **config.py**: Configuration management with Pydantic validation and environment support
- **database_utils.py**: Database utilities with error handling, retry logic, and timeouts
- **user_context.py**: User session and context management system
- **user_context_tools.py**: MCP tools for user context operations
- **user_context_security.py**: Security validation and rate limiting for user operations
- **schema.sql**: Complete PostgreSQL database schema with tables for users, runs, shoes, social features, and training plans
- **pyproject.toml**: Python project configuration using uv package manager

### Database Schema
The application uses a comprehensive running/fitness database with these main entities:
- **Users**: Core user profiles with training preferences and metrics
- **Runs**: Individual run records with distance, duration, pace, elevation
- **Shoes**: Running shoe tracking with mileage limits
- **SocialProfile**: Social features with usernames and bios
- **RunPost/Comment/Like**: Social sharing functionality
- **RunGroup/RunGroupMember**: Group running features
- **RunningPlans**: Training plan management

### MCP Resources (AI-readable content)

**Database Schema & Information:**
- `database://schema` - Complete database schema with all tables, columns, and relationships
- `database://stats` - Real-time database statistics including row counts for all tables

**User Profile Resources:**
- `users://profile/{user_id}` - Complete user profile including training preferences, VDOT, goals
- `user://profile` - Current user's profile (requires active user context)

**Running Data Resources:**
- `runs://user/{user_id}/recent` - User's recent runs with detailed metrics and analysis
- `runs://user/{user_id}/summary/{period}` - Run summaries for specific time periods (week/month/year)
- `shoes://user/{user_id}` - User's complete shoe collection with mileage and retirement status

### MCP Tools (AI-executable actions)

**Core Database Operations:**
- `add_user(name: str, email: str)` - Create new user accounts with validation
- `update_user_email(user_id: str, email: str)` - Update user email addresses
- `delete_user(user_id: str)` - Remove users from system with cascade cleanup
- `add_run(user_id, date, duration, distance, distance_unit, ...)` - Record runs with comprehensive parameters:
  - Full run data: pace, elevation, training environment, shoe tracking
  - Notes and training context
  - Automatic VDOT and pace calculations
- `add_shoe(user_id, name, max_distance, distance_unit, ...)` - Add shoes with:
  - Mileage tracking and retirement management
  - Usage notes and current distance

**Advanced User Context Management:**
- `set_current_user_tool(user_id: str)` - Initialize user session (required first step)
- `get_current_user_tool()` - Get current user profile and context information
- `switch_user_context_tool(user_id: str)` - Switch between different user contexts
- `clear_user_context_tool()` - Clear current user context and session data
- `update_user_preferences_tool(preferences_json: str)` - Update user preferences:
  - `distance_unit`: "miles" or "kilometers"
  - `timezone`: User timezone for date/time handling
  - `detailed_responses`: Boolean for response verbosity
  - `include_social_data`: Boolean for social feature inclusion
  - `max_results_per_query`: Integer limit for query results
- `update_conversation_context_tool(context_json: str)` - Track conversation state:
  - `last_topic`: Current conversation topic
  - `conversation_mood`: User sentiment analysis
  - `mentioned_runs`, `mentioned_shoes`, `mentioned_goals`: Entity tracking
- `get_session_info_tool(user_id: str)` - Get detailed session information
- `list_active_sessions_tool()` - List all currently active user sessions
- `get_session_history(user_id: str, limit: int)` - Get session history for analysis

**Smart Intelligence Tools:**
- `get_smart_user_context()` - Get comprehensive, intelligent user context for personalized responses
- `analyze_user_patterns()` - Analyze user patterns and provide insights about running journey
- `get_motivational_context()` - Get motivational context to provide encouraging responses
- `update_conversation_intelligence(user_message, ai_response, intent, sentiment)` - Update conversation intelligence with rich context tracking

### Security & Advanced Features

**Data Security:**
- **Data Isolation**: All user-specific resources enforce strict data isolation
- **UUID Validation**: Comprehensive UUID validation for all user identifiers
- **SQL Injection Protection**: Parameterized queries and enhanced identifier validation
- **Rate Limiting**: 10 requests per minute per operation with session tracking
- **Session Management**: 60-minute session timeout with automatic cleanup
- **Input Validation**: JSON schema validation for preferences and context updates

**Personalization Features:**
- **User Preference Caching**: Cached distance units, timezone, response preferences
- **Conversation Intelligence**: Tracks conversation topics, mood, and mentioned entities
- **Smart Context**: AI-optimized context generation for personalized responses
- **Pattern Analysis**: Running pattern analysis with insights and recommendations
- **Motivational Context**: Context-aware motivational messaging system

**Technical Patterns:**
- **Configuration-Driven**: Environment-specific settings with Pydantic validation
- **Connection Pooling**: Configurable asyncpg pools with retry logic and timeouts
- **Error Handling**: Comprehensive error handling with custom exceptions and retry mechanisms
- **Table Naming**: PascalCase with quotes (e.g., `"Users"`, `"Runs"`)
- **Logging**: Structured logging with configurable levels per environment
- **UUIDs**: All primary keys generated with uuid.uuid4()
- **Resource vs Tools**: Clear separation between readable resources and executable tools

## Testing Framework

### Test Structure
- **Unit Tests**: Located in `tests/unit/` with mocked database connections
- **Integration Tests**: Located in `tests/integration/` requiring a real test database
- **Test Coverage**: Currently 74% code coverage with detailed HTML reports
- **Fixtures**: Shared test data and utilities in `tests/conftest.py`

### Test Database Setup
Integration tests require a PostgreSQL test database. Set `TEST_DATABASE_URL` environment variable:
```
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_maratrondb
```

### Running Specific Tests
- Use pytest markers: `-m unit`, `-m integration`, `-m slow`
- Run specific test files: `pytest tests/unit/test_database_tools.py`
- Run specific test methods: `pytest tests/unit/test_database_tools.py::TestUserTools::test_add_user_success`

## Configuration System

### Environment Variables
Key configuration options (use nested format with `__` for complex settings):
```bash
# Environment
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE__MIN_CONNECTIONS=1
DATABASE__MAX_CONNECTIONS=10
DATABASE__QUERY_TIMEOUT=30.0

# Server
SERVER__DEBUG=true
SERVER__LOG_LEVEL=DEBUG
SERVER__MAX_CONCURRENT_OPERATIONS=100
```

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

## User Context System

### Overview
The user context system provides personalized, stateful interactions for AI chatbot users:
- **Session Management**: Automatic session creation and cleanup
- **User Preferences**: Distance units, response detail level, timezone settings
- **Conversation Context**: Track topics, mood, mentioned entities
- **Security**: Rate limiting, input validation, session protection

### Usage Pattern
```python
# 1. Set user context (required first step)
await set_current_user_tool("user-uuid")

# 2. User preferences are loaded automatically and affect all subsequent operations
# 3. Use any database tools - they now return personalized results
await list_recent_runs(5)  # Returns runs in user's preferred units

# 4. Update preferences as needed
await update_user_preferences_tool('{"distance_unit": "kilometers"}')

# 5. Track conversation context for continuity
await update_conversation_context_tool('{"last_topic": "training plan"}')
```

### Security Features
- UUID validation for all user IDs
- Rate limiting (10 requests per minute per operation)
- Session timeout (60 minutes of inactivity)
- Input sanitization and validation
- Blocked user protection after failed attempts

## Development Notes

- This is a FastMCP server, not a traditional web application
- **User-centric design** with session management and personalized responses
- Comprehensive configuration management with environment validation
- Robust error handling with retry logic and timeouts
- Comprehensive testing framework with unit and integration tests
- Uses `uv` as the Python package manager instead of pip/poetry
- Database connection management with configurable pooling
- All MCP tools are async functions decorated with `@mcp.tool()` and `@handle_database_errors`