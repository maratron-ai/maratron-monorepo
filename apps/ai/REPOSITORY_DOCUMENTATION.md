# Maratron AI - Repository Documentation

## Table of Contents
- [Overview](#overview)
- [Model Context Protocol (MCP)](#model-context-protocol-mcp)
- [LLM Integration in Maratron App](#llm-integration-in-maratron-app)
- [DevOps & Package Management](#devops--package-management)
- [Repository Structure](#repository-structure)
- [Core Components](#core-components)
- [Configuration System](#configuration-system)
- [Database Layer](#database-layer)
- [User Context System](#user-context-system)
- [Security Framework](#security-framework)
- [Testing Infrastructure](#testing-infrastructure)
- [Development Workflow](#development-workflow)
- [Deployment & Operations](#deployment--operations)

## Overview

Maratron AI is a FastMCP (Model Context Protocol) server that provides secure, user-aware database utilities for a PostgreSQL-based running/fitness application. The server exposes database operations as MCP tools and resources that can be consumed by AI assistants, enabling intelligent, personalized interactions for runners and fitness enthusiasts.

### Key Features
- **User Context Management**: Persistent user sessions with preferences and conversation memory
- **Data Security**: Comprehensive data isolation ensuring users can only access their own data
- **Running Analytics**: Tools for tracking runs, shoes, training plans, and progress
- **AI Integration**: Smart context tools that provide personalized responses
- **Configuration Management**: Environment-aware configuration with validation
- **Comprehensive Testing**: Unit and integration tests with security validation

## Model Context Protocol (MCP)

### What is MCP?

The **Model Context Protocol (MCP)** is an open standard that enables AI assistants to securely connect to external data sources and tools. Instead of LLMs having to work with static training data, MCP allows them to access live, contextual information from databases, APIs, file systems, and other resources in real-time.

### MCP Architecture

```
┌─────────────────┐    MCP Protocol    ┌─────────────────┐    Database    ┌──────────────┐
│                 │ ◄─────────────────► │                 │ ◄─────────────► │              │
│   AI Assistant  │                    │   MCP Server    │                │  PostgreSQL  │
│   (Claude, etc) │                    │ (Maratron AI)   │                │   Database   │
│                 │                    │                 │                │              │
└─────────────────┘                    └─────────────────┘                └──────────────┘
```

### MCP Components

**1. Tools (Actions)**
- Functions that the AI can call to perform actions
- Examples: `add_run()`, `update_user_preferences()`, `get_session_info()`
- Provide structured parameters and return values
- Enable the AI to modify data and trigger operations

**2. Resources (Content)**
- Static or dynamic content that the AI can read
- Examples: Database schema, user profiles, run summaries
- Provide context and information for AI responses
- Enable the AI to understand current state and data

**3. Prompts (Templates)**
- Predefined prompt templates for common scenarios
- Help maintain consistent AI behavior
- Can include dynamic data from tools and resources

### MCP Benefits for Maratron AI

1. **Real-Time Data Access**: AI gets live running data, not outdated training information
2. **Secure Operations**: MCP protocol ensures secure, authenticated access to user data
3. **Personalized Responses**: AI can access user preferences and context for tailored advice
4. **Structured Interactions**: Well-defined tools and resources create predictable AI behavior
5. **Scalable Architecture**: MCP servers can be deployed independently and scaled as needed

### FastMCP Framework

Maratron AI uses **FastMCP**, a Python framework that simplifies MCP server development:

```python
from mcp.server.fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("Maratron AI", "1.0.0")

# Define a tool (action)
@mcp.tool()
async def add_run(user_id: str, date: str, distance: float) -> str:
    """Add a new run for a user."""
    # Implementation here
    return "✅ Run added successfully"

# Define a resource (content)
@mcp.resource("user://profile")
async def user_profile() -> str:
    """Get current user's profile."""
    # Implementation here
    return "User profile data..."
```

## LLM Integration in Maratron App

### How LLMs Use This Repository

The Maratron AI MCP server acts as a **data and action layer** between AI assistants and the running application's database. Here's how it enables intelligent interactions:

### 1. User Context Establishment

```mermaid
sequenceDiagram
    participant User
    participant LLM
    participant MCP as MCP Server
    participant DB as Database
    
    User->>LLM: "Track my 5-mile run today"
    LLM->>MCP: set_current_user_tool(user_id)
    MCP->>DB: Establish user session
    MCP-->>LLM: ✅ User context set
    LLM->>MCP: get_smart_user_context()
    MCP-->>LLM: User preferences, history, context
```

### 2. Intelligent Data Access

The LLM can access personalized data through secure resources:

```python
# LLM requests user's recent runs
LLM → MCP: resource("runs://user/123/recent")
MCP → Database: SELECT * FROM "Runs" WHERE "userId"='123' (SECURE)
MCP → LLM: "# Recent Runs for John\n- 5.2 miles on 2024-01-15\n- 3.1 miles on 2024-01-13..."

# LLM gets motivational context
LLM → MCP: get_motivational_context_tool()
MCP → LLM: "💪 Recommended Tone: Celebratory\nFocus: Building on recent success..."
```

### 3. Personalized Responses

With user context, the LLM can provide highly personalized advice:

**Without Context (Generic):**
```
"Great job on your run! Running is excellent exercise."
```

**With Maratron AI Context (Personalized):**
```
"Fantastic 5-mile run, John! 🎉 That's your longest distance this month and 
puts you at 15.3 miles for the week. You're ahead of your goal pace for the 
half-marathon in March. Your Nike Pegasus shoes now have 127 miles on them - 
still plenty of life left. How did the new route feel compared to your usual 
park loop?"
```

### 4. Action Execution

The LLM can perform actions on behalf of users:

```python
# User says: "Log my morning run - 3.1 miles in 28 minutes"
LLM → MCP: add_run(
    user_id="user-123",
    date="2024-01-15", 
    duration="00:28:00",
    distance=3.1,
    name="Morning Run"
)
MCP → Database: INSERT INTO "Runs" (secure, user-validated)
MCP → LLM: "✅ Added run for user-123 with ID: run-456"
```

### 5. Conversation Memory

The system maintains conversation context for continuity:

```python
# LLM updates conversation intelligence
LLM → MCP: update_conversation_intelligence_tool(
    user_message="I'm training for a marathon",
    ai_response="Great goal! Let's create a plan...",
    intent="goal_setting",
    sentiment="enthusiastic"
)
```

### 6. Pattern Analysis & Insights

The LLM can request intelligent analysis:

```python
LLM → MCP: analyze_user_patterns_tool()
MCP → LLM: """
📊 **User Pattern Analysis**
🏆 **Achievements & Progress:**
• Consistent weekly mileage increase (confidence: 85%)
  → Consider adding one longer run per week

📈 **Training Patterns:**
• Strong morning runner preference (confidence: 92%)
  → Schedule important workouts in AM

⚠️ **Areas for Improvement:**
• No rest days in last 2 weeks (confidence: 78%)
  → Plan active recovery days
"""
```

### 7. Integration Architecture

```
┌─────────────────┐
│   Maratron App  │
│   (Frontend)    │
└─────────┬───────┘
          │ HTTP/WebSocket
          ▼
┌─────────────────┐    MCP Protocol    ┌─────────────────┐
│   AI Assistant  │ ◄─────────────────► │  Maratron AI    │
│   (Claude API)  │                    │   MCP Server    │
└─────────────────┘                    └─────────┬───────┘
                                                 │ SQL
                                                 ▼
                                       ┌─────────────────┐
                                       │   PostgreSQL    │
                                       │    Database     │
                                       └─────────────────┘
```

### 8. Real-World Usage Scenarios

**Scenario 1: Training Plan Assistance**
```
User: "Help me prepare for a 10K in 8 weeks"
LLM: [Accesses user's current fitness level, running history, preferences]
     "Based on your recent 25-mile weeks and 8:30 pace, here's a custom plan..."
```

**Scenario 2: Gear Recommendations**
```
User: "Do I need new running shoes?"
LLM: [Checks user's shoe mileage and usage patterns]
     "Your Nike Pegasus have 487 miles - approaching the 500-mile replacement point..."
```

**Scenario 3: Recovery Analysis**
```
User: "I'm feeling tired lately"
LLM: [Analyzes recent training load and patterns]
     "You've increased weekly mileage 30% in 3 weeks with no rest days..."
```

### 9. Security & Privacy

- **Data Isolation**: LLM can only access current user's data
- **Session Management**: User context required for all operations
- **Audit Trail**: All LLM actions logged for security
- **Rate Limiting**: Prevents abuse of MCP tools

## DevOps & Package Management

### 1. Modern Python Package Management with `uv`

This repository uses **`uv`**, a fast Python package manager and project manager written in Rust, replacing traditional `pip` and `poetry` workflows.

#### Package Configuration (`pyproject.toml`)

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "maratron-ai"
version = "1.0.0"
description = "FastMCP server for running/fitness applications"
authors = [{name = "Maratron Team"}]
license = {text = "MIT"}
readme = "README.md"
requires-python = ">=3.11"

dependencies = [
    "fastmcp>=0.2.0",
    "asyncpg>=0.29.0", 
    "pydantic>=2.5.0",
    "python-dotenv>=1.0.0"
]

[project.optional-dependencies]
test = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "pytest-mock>=3.11.0"
]
dev = [
    "ruff>=0.1.0",
    "mypy>=1.7.0", 
    "pre-commit>=3.5.0"
]

[project.scripts]
maratron-server = "maratron_ai.server:main"
maratron-dev = "maratron_ai.server_dev:main"

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
markers = [
    "unit: Unit tests with mocked dependencies",
    "integration: Integration tests requiring test database",
    "slow: Slow tests that may take longer to run"
]

[tool.coverage.run]
source = ["src"]
omit = ["tests/*", "*/migrations/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError"
]

[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "W", "I", "N", "UP", "ANN", "S", "B", "A", "COM", "C4", "DTZ", "T10", "DJ", "EM", "EXE", "FA", "ISC", "ICN", "G", "INP", "PIE", "T20", "PYI", "PT", "Q", "RSE", "RET", "SLF", "SIM", "TID", "TCH", "INT", "ARG", "PTH", "TD", "FIX", "ERA", "PD", "PGH", "PL", "TRY", "FLY", "NPY", "AIR", "PERF", "FURB", "LOG", "RUF"]
```

#### Advantages of `uv`:

1. **Performance**: 10-100x faster than pip for dependency resolution
2. **Lock Files**: Automatic generation of lock files for reproducible builds
3. **Virtual Environment Management**: Built-in venv handling
4. **Modern Standards**: Full support for PEP 517/518/621
5. **Cross-Platform**: Consistent behavior across operating systems

### 2. Repository Structure & Package Organization

#### Source Layout (`src/` layout)

The repository follows the modern **`src/` layout** pattern:

```
src/maratron_ai/           # Prevents accidental imports of uninstalled code
├── __init__.py            # Package marker with version info
├── server.py              # Main MCP server module
├── api.py                 # High-level API wrapper
├── config.py              # Configuration management
└── ...                    # Other modules
```

**Benefits:**
- **Import Safety**: Prevents importing uninstalled/unbuilt packages during development
- **Testing Isolation**: Forces tests to use installed package, not source directory
- **Distribution Clarity**: Clear separation between source and package
- **Tool Compatibility**: Better compatibility with modern Python tools

#### Entry Points Configuration

```toml
[project.scripts]
maratron-server = "maratron_ai.server:main"        # Production server
maratron-dev = "maratron_ai.server_dev:main"       # Development server with MCP inspector
```

Allows installation and execution:
```bash
pip install -e .                    # Install in editable mode
maratron-server                     # Run production server
maratron-dev                        # Run development server
```

### 3. Environment Management

#### Multi-Environment Configuration

```
.env.example                # Template with all available options
.env.development           # Development-specific settings
.env.testing               # Test environment configuration
.env.staging               # Staging environment settings
.env.production            # Production environment settings
```

#### Environment Variable Structure

```bash
# Environment Context
ENVIRONMENT=development

# Database Configuration (nested with __)
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE__MIN_CONNECTIONS=1
DATABASE__MAX_CONNECTIONS=10
DATABASE__QUERY_TIMEOUT=30.0

# Server Configuration
SERVER__NAME="Maratron AI"
SERVER__DEBUG=true
SERVER__LOG_LEVEL=DEBUG
SERVER__MAX_CONCURRENT_OPERATIONS=100

# Security Settings
SECURITY__RATE_LIMIT_REQUESTS_PER_MINUTE=60
SECURITY__SESSION_TIMEOUT_MINUTES=60
SECURITY__MAX_FAILED_ATTEMPTS=5
```

### 4. Docker & Containerization

#### Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY pyproject.toml ./
RUN pip install uv && uv sync --frozen

# Production stage  
FROM python:3.11-slim as production
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/
COPY schema.sql ./
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["python", "-m", "maratron_ai.server"]
```

#### Docker Compose for Development

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: maratrondb
      POSTGRES_USER: maratron
      POSTGRES_PASSWORD: yourpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

  maratron-ai:
    build: .
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://maratron:yourpassword@postgres:5432/maratrondb
      ENVIRONMENT: development
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    command: python -m maratron_ai.server_dev

volumes:
  postgres_data:
```

### 5. Development Tools Integration

#### Code Quality Tools

**Ruff** (Linting & Formatting):
```toml
[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "W", "I", "N", "UP", "ANN", "S", "B", "A", "COM"]
```

**MyPy** (Type Checking):
```toml
[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
```

**Pre-commit Hooks**:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.0
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.0
    hooks:
      - id: mypy
```

### 6. Continuous Integration (CI/CD)

#### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install uv
      run: pip install uv
    
    - name: Install dependencies
      run: uv sync --all-extras
    
    - name: Run tests
      run: uv run pytest tests/ --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Run security tests
      run: uv run pytest tests/unit/test_security.py -v
```

### 7. Deployment Strategies

#### Production Deployment Options

**1. Container Deployment:**
```bash
# Build and deploy container
docker build -t maratron-ai:latest .
docker run -d \
  --name maratron-ai \
  -p 8000:8000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e ENVIRONMENT=production \
  maratron-ai:latest
```

**2. Direct Installation:**
```bash
# Install package
pip install git+https://github.com/your-org/maratron-ai.git

# Run server
maratron-server
```

**3. Development Mode:**
```bash
# Editable installation
pip install -e .

# Run with MCP inspector
maratron-dev
```

### 8. Monitoring & Observability

#### Health Checks

```python
# Built-in health monitoring
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": await check_database_health(),
        "version": __version__,
        "environment": config.environment
    }
```

#### Metrics Collection

```python
# Performance metrics
from prometheus_client import Counter, Histogram

mcp_requests = Counter('mcp_requests_total', 'Total MCP requests')
mcp_duration = Histogram('mcp_request_duration_seconds', 'MCP request duration')
```

#### Logging Configuration

```python
# Structured logging with environment-specific levels
logging.basicConfig(
    level=getattr(logging, config.server.log_level.value),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

This comprehensive DevOps setup ensures the Maratron AI MCP server is production-ready, maintainable, and follows modern Python development best practices.

## Repository Structure

```
maratron-ai/
├── src/maratron_ai/                    # Main application package
│   ├── __init__.py                     # Package initialization
│   ├── server.py                       # FastMCP server with tools & resources
│   ├── api.py                          # High-level API wrapper
│   ├── config.py                       # Configuration management system
│   ├── database_utils.py               # Database utilities & error handling
│   ├── health.py                       # Health monitoring system
│   ├── logging_config.py               # Logging configuration
│   ├── security/                       # Security framework
│   │   ├── __init__.py
│   │   └── data_isolation.py           # Data isolation & access control
│   └── user_context/                   # User context management
│       ├── __init__.py
│       ├── context.py                  # Core context management
│       ├── tools.py                    # MCP tools for user operations
│       ├── security.py                 # User-level security & rate limiting
│       ├── memory.py                   # Conversation memory system
│       ├── intelligence.py             # Pattern analysis & insights
│       └── smart_tools.py              # Intelligent context tools
├── tests/                              # Test suite
│   ├── conftest.py                     # Shared test fixtures
│   ├── unit/                           # Unit tests with mocked dependencies
│   │   ├── test_config.py              # Configuration system tests
│   │   ├── test_database_tools.py      # Database functionality tests
│   │   ├── test_database_utils.py      # Database utilities tests
│   │   └── test_security.py            # Security system tests
│   └── integration/                    # Integration tests (requires test DB)
├── examples.py                         # Usage examples & demonstrations
├── schema.sql                          # PostgreSQL database schema
├── pyproject.toml                      # Python project configuration (uv)
├── .env.example                        # Environment variables template
├── .env.development                    # Development environment config
├── docker-compose.yml                  # Docker development setup
├── Dockerfile                          # Container build configuration
├── run_server.py                       # Development server runner
├── server_dev.py                       # MCP dev tool compatibility
├── CLAUDE.md                           # AI assistant instructions
├── INTEGRATION.md                      # Integration guide
└── REPOSITORY_DOCUMENTATION.md        # This documentation
```

## Core Components

### 1. FastMCP Server (`src/maratron_ai/server.py`)

The heart of the application - a FastMCP server that exposes database operations as MCP tools and resources.

**Key Features:**
- **Tools (Actions)**: User management, run tracking, shoe management, user context operations
- **Resources (Content)**: Database schema, user profiles, run summaries, shoe collections
- **Security Integration**: All operations use secure data access layer
- **User Context Awareness**: Personalized responses based on user preferences

**Major Tool Categories:**
```python
# User Management Tools
add_user(name, email)                   # Create new users
update_user_email(user_id, email)       # Update user information
delete_user(user_id)                    # Remove users

# Running Data Tools  
add_run(user_id, date, duration, ...)   # Record new runs
add_shoe(user_id, name, max_distance, ...)  # Add shoes to collection

# User Context Tools
set_current_user_tool(user_id)          # Establish user session
get_current_user_tool()                 # Get current user info
update_user_preferences_tool(prefs)     # Update user preferences

# Smart Context Tools
get_smart_user_context()                # AI-friendly user context
analyze_user_patterns()                 # Running pattern analysis
get_motivational_context()              # Personalized motivation
```

**Resource Categories:**
```python
# System Resources
database://schema                       # Complete database schema
database://stats                        # Database statistics

# User Resources (Secure)
user://profile                          # Current user's profile
users://profile/{user_id}               # Specific user profile
runs://user/{user_id}/recent            # User's recent runs
runs://user/{user_id}/summary/{period}  # Run statistics
shoes://user/{user_id}                  # User's shoe collection
```

### 2. API Wrapper (`src/maratron_ai/api.py`)

High-level Python API for easy integration with web applications and other systems.

**Features:**
- Async context manager support
- Automatic resource cleanup
- Structured return values with success/error handling
- Convenience functions for common operations

**Usage Example:**
```python
async with maratron_api() as api:
    # Set user context
    await api.set_user_context("user-123")
    
    # Add a run
    result = await api.add_run("user-123", "2024-01-15", "00:30:00", 3.1)
    
    # Get user's recent runs
    runs = await api.get_user_runs("user-123", limit=5)
```

### 3. Configuration System (`src/maratron_ai/config.py`)

Comprehensive configuration management with environment-specific settings and validation.

**Architecture:**
- **Pydantic Models**: Type-safe configuration with automatic validation
- **Environment Files**: Separate configs for development, testing, staging, production
- **Nested Configuration**: Organized into logical sections (database, server, logging)
- **Validation**: Database URL format, connection limits, timeout validation

**Configuration Sections:**
```python
class Config(BaseModel):
    environment: Environment           # Current environment
    database: DatabaseConfig         # Database connection settings
    server: ServerConfig             # Server behavior settings
    
class DatabaseConfig(BaseModel):
    min_connections: int = 1         # Connection pool minimum
    max_connections: int = 10        # Connection pool maximum  
    command_timeout: float = 30.0    # Query timeout in seconds
    query_timeout: float = 30.0      # Individual query timeout
    
class ServerConfig(BaseModel):
    name: str = "Maratron AI"        # Server name
    version: str = "1.0.0"           # Version identifier
    debug: bool = False              # Debug mode
    log_level: LogLevel = LogLevel.INFO
```

## Database Layer

### 1. Database Utilities (`src/maratron_ai/database_utils.py`)

Robust database interaction layer with error handling, retries, and timeouts.

**Key Features:**
- **Connection Management**: Automatic pool creation and cleanup
- **Error Handling**: Comprehensive error handling with custom exceptions
- **Retry Logic**: Automatic retries for transient database errors
- **Query Timeouts**: Configurable timeouts for all operations
- **SQL Injection Protection**: Enhanced identifier validation

**Core Functions:**
```python
# Connection Management
async def get_pool() -> asyncpg.Pool    # Get/create connection pool
async def validate_connection(pool)     # Test database connectivity
async def close_pool(pool)              # Clean pool shutdown

# Safe Query Operations
async def execute_with_timeout(pool, query, *params)    # Execute with timeout
async def fetch_with_timeout(pool, query, *params)      # Fetch with timeout  
async def fetchrow_with_timeout(pool, query, *params)   # Fetch single row

# Security Helpers
def quote_identifier(identifier: str)   # Safe SQL identifier quoting
```

**Error Handling Hierarchy:**
```python
DatabaseError                          # Base database exception
├── ConnectionError                     # Connection failures
├── QueryError                         # Query execution failures  
├── ValidationError                     # Data validation failures
└── TimeoutError                       # Operation timeouts
```

### 2. Database Schema (`schema.sql`)

Comprehensive PostgreSQL schema for running/fitness application.

**Core Tables:**
- **Users**: User profiles with training preferences and metrics
- **Runs**: Individual run records with detailed metrics
- **Shoes**: Running shoe tracking with mileage monitoring
- **SocialProfile**: Social features and user interactions
- **UserSessions**: User context and session management
- **RunPost/Comment/Like**: Social sharing functionality
- **RunGroup/RunGroupMember**: Group running features
- **RunningPlans**: Training plan management

**Key Design Patterns:**
- UUIDs for all primary keys
- Comprehensive indexing for performance
- Foreign key constraints for data integrity
- Timestamp tracking (createdAt, updatedAt)
- Flexible JSON columns for extensibility

## User Context System

The user context system provides stateful, personalized interactions for AI chatbot users.

### 1. Core Context Management (`src/maratron_ai/user_context/context.py`)

**Features:**
- **Session Management**: Automatic session creation, renewal, and cleanup
- **User Preferences**: Distance units, response detail level, timezone settings
- **Conversation Context**: Track topics, mood, mentioned entities
- **Caching**: Efficient user data caching to reduce database queries

**Core Classes:**
```python
class UserSession:
    user_id: str                       # User identifier
    session_id: str                    # Unique session ID
    preferences: UserPreferences       # User preferences
    conversation_context: ConversationContext  # Conversation state
    cached_user_data: Dict            # Cached user data
    created_at: datetime              # Session creation time
    last_activity: datetime           # Last activity timestamp
    expires_at: datetime              # Session expiration

class UserPreferences:
    distance_unit: str = "miles"       # Preferred distance unit
    timezone: str = "UTC"              # User timezone
    detailed_responses: bool = True    # Response detail preference
    max_results_per_query: int = 10    # Result limit preference

class ConversationContext:
    last_topic: Optional[str]          # Recent conversation topic
    conversation_mood: str = "neutral" # User's current mood
    mentioned_runs: List[str]          # Recently mentioned runs
    mentioned_goals: List[str]         # User goals discussed
```

### 2. User Context Tools (`src/maratron_ai/user_context/tools.py`)

MCP tools for managing user sessions and context.

**Session Management:**
```python
set_current_user(user_id)             # Establish user session
get_current_user()                    # Get current user info
switch_user_context(user_id)          # Switch user contexts
clear_user_context()                  # Clear current session
```

**Preference Management:**
```python
update_user_preferences(prefs_json)   # Update user preferences
update_conversation_context(ctx_json) # Update conversation state
get_session_info(user_id)             # Get session information
list_active_sessions()                # List all active sessions
```

### 3. User Context Security (`src/maratron_ai/user_context/security.py`)

Security layer for user operations with rate limiting and validation.

**Security Features:**
- **Rate Limiting**: 10 requests per minute per operation per user
- **Input Validation**: UUID validation, JSON sanitization
- **Session Protection**: Automatic session cleanup and timeout
- **Blocked User Management**: Track and handle problematic users

### 4. Intelligence System (`src/maratron_ai/user_context/intelligence.py`)

Pattern analysis and insights generation for personalized responses.

**Capabilities:**
- **Running Pattern Analysis**: Identify training patterns, achievements, concerns
- **Goal Detection**: Analyze user goals and provide targeted advice
- **Motivational Context**: Generate appropriate motivational tone and focus
- **Personalization**: Tailor responses based on user experience and preferences

### 5. Smart Tools (`src/maratron_ai/user_context/smart_tools.py`)

AI-friendly tools that provide comprehensive user context for intelligent responses.

**Tools:**
```python
get_smart_user_context_tool()         # Comprehensive user context for AI
analyze_user_patterns_tool()          # Running pattern insights
get_motivational_context_tool()       # Motivational guidance
update_conversation_intelligence_tool() # Update conversation state
```

## Security Framework

Comprehensive security system ensuring data isolation and access control.

### 1. Data Isolation (`src/maratron_ai/security/data_isolation.py`)

**Core Security Principles:**
- **User Isolation**: Users can only access their own data
- **Query Validation**: All queries must include user filtering
- **Access Logging**: Complete audit trail of data access attempts
- **Violation Detection**: Automatic detection and blocking of security violations

**Key Components:**
```python
class SecureDataAccess:
    # Secure query methods that enforce user isolation
    async def secure_fetch(pool, query, *params)     # Secure SELECT operations
    async def secure_fetchrow(pool, query, *params)  # Secure single row fetch
    async def secure_execute(pool, query, *params)   # Secure modifications
    
    # Pre-built secure methods for common operations
    async def get_user_runs(pool, user_id, limit)    # User's runs only
    async def get_user_shoes(pool, user_id)          # User's shoes only  
    async def get_user_profile(pool, user_id)        # User's profile only

class SecurityAuditLog:
    # Comprehensive security event logging
    log_data_access(user_id, operation, table, filters, success)
    log_security_violation(user_id, attempted_access, reason)

# Security Decorators
@require_user_context                  # Ensure user session exists
@enforce_user_isolation               # Add automatic user ID validation
```

**Security Validation:**
- **Query Pattern Validation**: Ensures all queries filter by user ID
- **Cross-User Access Prevention**: Blocks attempts to access other users' data
- **System Query Allowlist**: Permits safe system queries (schema, etc.)
- **Modification Protection**: Requires user filtering for UPDATE/DELETE operations

### 2. Security Testing (`tests/unit/test_security.py`)

Comprehensive test suite validating security implementation:
- **Data Access Control**: Verify users can only access own data
- **Query Validation**: Test query filtering requirements
- **Violation Detection**: Ensure security violations are caught and logged
- **Decorator Testing**: Validate security decorators work correctly
- **Audit Logging**: Verify security events are properly logged

## Testing Infrastructure

### 1. Test Organization

**Unit Tests** (`tests/unit/`):
- **Mocked Dependencies**: All external dependencies mocked
- **Fast Execution**: Quick feedback during development
- **Isolated Testing**: Each component tested independently
- **High Coverage**: 84 tests covering core functionality

**Integration Tests** (`tests/integration/`):
- **Real Database**: Tests against actual PostgreSQL instance
- **End-to-End Flows**: Complete user workflows
- **Performance Testing**: Database performance validation

### 2. Test Configuration (`tests/conftest.py`)

Shared test fixtures and utilities:
- Mock database pools and connections
- Test user data and scenarios
- Security test helpers
- Async test support

### 3. Coverage Reporting

- **HTML Reports**: Detailed coverage analysis in `htmlcov/`
- **Current Coverage**: 35% overall, 91% security module
- **Coverage Goals**: Focus on critical security and data access paths

## Development Workflow

### 1. Package Management (uv)

Modern Python package management with `uv`:
```bash
uv sync                               # Install/update dependencies
uv add <package>                      # Add new dependency
uv remove <package>                   # Remove dependency
uv run <command>                      # Run command in project environment
```

### 2. Development Commands

**Server Operations:**
```bash
python server.py                      # Run MCP server directly
mcp dev server.py                     # Run with MCP Inspector UI
python run_server.py                  # Development server runner
```

**Testing:**
```bash
uv run pytest tests/unit/ -m unit     # Run unit tests
uv run pytest tests/integration/ -m integration  # Run integration tests
uv run pytest --cov=server --cov-report=html    # Coverage report
python tests/test_runner.py           # Complete test suite
```

**Database Setup:**
```bash
cp .env.example .env                  # Create local environment
# Set DATABASE_URL and TEST_DATABASE_URL
# Apply schema.sql to databases
```

### 3. Configuration Management

**Environment Files:**
- `.env.development` - Development settings
- `.env.testing` - Test environment configuration  
- `.env.staging` - Staging environment settings
- `.env.production` - Production environment settings

**Environment Variables:**
```bash
ENVIRONMENT=development               # Set environment context
DATABASE_URL=postgresql://...         # Database connection
DATABASE__MIN_CONNECTIONS=1          # Nested config format
SERVER__DEBUG=true                   # Server configuration
```

## Deployment & Operations

### 1. Docker Support

**Development Setup:**
```bash
docker-compose up                     # Start development environment
```

**Production Deployment:**
```bash
docker build -t maratron-ai .         # Build container
docker run maratron-ai               # Run container
```

### 2. Health Monitoring (`src/maratron_ai/health.py`)

Comprehensive health checking system:
- **Database Connectivity**: Connection pool health
- **Query Performance**: Database response times
- **Session Management**: User context system health
- **Security Monitoring**: Security violation tracking

### 3. Logging (`src/maratron_ai/logging_config.py`)

Structured logging with configurable levels:
- **Environment-Specific**: Different log levels per environment
- **Security Events**: Dedicated security audit trail
- **Performance Metrics**: Database query timing
- **Error Tracking**: Comprehensive error logging

### 4. Configuration Validation

Production readiness checks:
- **Database URL Validation**: Connection string format
- **Security Settings**: Production security requirements
- **Performance Limits**: Connection pool and timeout validation
- **Environment Restrictions**: Debug mode disabled in production

## Development Guidelines

### 1. Code Organization

- **Separation of Concerns**: Clear separation between MCP tools, resources, and business logic
- **Security First**: All data access goes through security layer
- **User Context Aware**: Personalized responses based on user preferences
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Testing**: High test coverage for critical security and data paths

### 2. Security Best Practices

- **Data Isolation**: Users can only access their own data
- **Input Validation**: All user inputs validated and sanitized  
- **Audit Logging**: Complete audit trail for security events
- **Session Management**: Secure session handling with timeouts
- **SQL Injection Protection**: Parameterized queries and identifier validation

### 3. Performance Considerations

- **Connection Pooling**: Efficient database connection management
- **Caching**: User data caching to reduce database queries
- **Query Optimization**: Indexed queries and efficient data access patterns
- **Timeout Management**: Configurable timeouts for all operations

This repository provides a production-ready, secure, and intelligent MCP server for running/fitness applications with comprehensive user context management and data isolation capabilities.