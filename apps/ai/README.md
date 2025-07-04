# Maratron AI Server

A comprehensive FastMCP server providing AI-powered database tools and user context management for the Maratron running/fitness platform. Built with the Model Context Protocol (MCP) for intelligent AI-to-application communication.

## 🏗️ Architecture

**Advanced Function Calling Implementation**
- **9 intelligent tools** with Claude 3.5 integration
- **Smart context assembly** with personalized data
- **Automatic user context** management
- **Multi-tool coordination** for complex analysis

### Core Components
- **User Context Management**: Session tracking and personalized interactions
- **Smart Database Tools**: User-aware database operations with intelligent responses
- **Security Layer**: Rate limiting, input validation, and data isolation
- **MCP Integration**: Seamless connection with Next.js web application
- **Intelligence Engine**: Conversation tracking, pattern analysis, and motivational context

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL database
- `uv` package manager (recommended)

### Installation & Setup

**🐳 Containerized Development (Recommended)**
```bash
# From repository root - complete Docker environment
npm run dev    # Starts all services including AI server
```

**⚡ Local Development**
```bash
# From apps/ai directory
uv sync                    # Install dependencies
cp .env.example .env       # Configure environment
python run_server.py       # Start MCP server

# Or with MCP Inspector for debugging
mcp dev server.py
```

### Environment Configuration

```bash
# Core Settings
ENVIRONMENT=development
DATABASE_URL=postgresql://maratron:yourpassword@localhost:5432/maratrondb

# Database Connection Pooling
DB_MIN_CONNECTIONS=1
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=30

# Logging
LOG_LEVEL=INFO

# Performance
ASYNC_TIMEOUT=30
DEFAULT_LIMIT=50
```

## 🧠 AI Tools & Capabilities

### Core Tools (9 Available)
1. **User Context Management**: Session and preference handling
2. **Smart User Context**: Comprehensive user data assembly
3. **Performance Analysis**: Pattern recognition and insights
4. **Training Plan Generation**: AI-powered plan creation
5. **Goal Setting & Tracking**: Progress monitoring
6. **Social Feed Management**: Community interactions
7. **Equipment Recommendations**: Gear and shoe guidance
8. **Health & Recovery**: Injury prevention and recovery advice
9. **Performance Prediction**: Race time and fitness forecasting

### Intelligence Features
- **Conversation Tracking**: Context-aware interactions
- **Pattern Analysis**: Training trends and insights
- **Motivational Context**: Personalized encouragement
- **Multi-Tool Coordination**: Complex request handling

📖 **[Complete AI Documentation →](../../docs/mcp-llm-integration.md)**

## 🔧 Development

### Package Management (uv)
```bash
uv sync                    # Install/update dependencies
uv add <package>           # Add new dependency  
uv remove <package>        # Remove dependency
uv run <command>           # Run command in environment
```

### Server Operations
```bash
python run_server.py       # Start MCP server
mcp dev server.py         # Debug with MCP Inspector
pip install -e .          # Alternative installation
```

### Testing
```bash
# Install test dependencies
uv sync --extra test

# Run test suites
uv run pytest tests/unit/ -m unit              # Unit tests (mocked)
uv run pytest tests/integration/ -m integration # Integration tests  
uv run pytest --cov=src --cov-report=html      # Coverage report

# Test runner utility
python tests/test_runner.py           # Complete test suite
python tests/test_runner.py unit      # Unit tests only
python tests/test_runner.py coverage  # Tests with coverage
```

### Test Markers
- `@pytest.mark.unit` - Fast tests with mocked dependencies
- `@pytest.mark.integration` - Tests requiring real database
- `@pytest.mark.slow` - Long-running performance tests

## 🏗️ Project Structure

```
src/maratron_ai/
├── server.py              # Main MCP server and tool definitions
├── config.py              # Environment-based configuration
├── database_utils.py      # Database connection and utilities
├── user_context/          # User context management
│   ├── tools.py           # Context management tools
│   ├── smart_tools.py     # LLM-optimized context generation
│   ├── intelligence.py    # Pattern analysis and insights
│   └── context.py         # Session and preference handling
├── security/              # Security and data isolation
└── advanced_tools.py      # Training, health, and performance tools
```

## 🔒 Security Features

- **Data Isolation**: User-specific data access controls
- **Input Validation**: Comprehensive parameter validation
- **Rate Limiting**: Request throttling and abuse prevention
- **SQL Injection Protection**: Parameterized queries and sanitization
- **Error Handling**: Graceful failure with secure error messages

## 📊 Performance Features

- **Connection Pooling**: Optimized database connections
- **Async Operations**: Non-blocking database operations
- **Query Optimization**: Indexed queries and efficient data access
- **Caching Strategy**: Intelligent caching for frequent operations
- **Timeout Management**: Request timeout and recovery handling

For complete development workflows and deployment guide, see **[Development Guide](../../docs/development.md)**.

For system architecture and MCP integration details, see **[Architecture Overview](../../docs/architecture.md)**.