# Maratron AI Web App Integration Guide

This guide shows how to integrate the Maratron AI MCP Server with your web application.

## Installation

```bash
# Install the package
pip install -e .

# Or install with test dependencies
pip install -e ".[test]"
```

## Quick Start

### 1. Basic API Usage

```python
import asyncio
from maratron_ai import MaratronAPI

async def example():
    async with MaratronAPI() as api:
        # Create a user
        result = await api.create_user("John Doe", "john@example.com")
        if result["success"]:
            user_id = result["user_id"]
            
            # Add a run
            await api.add_run(user_id, "2024-01-15", "00:30:00", 5.0)
            
            # Get user's runs
            runs = await api.get_user_runs(user_id)
            print(runs["data"])

asyncio.run(example())
```

### 2. Environment Setup

Create environment files for different stages:

```bash
# .env.development
ENVIRONMENT=development
DATABASE_URL=postgresql://maratron:password@localhost:5432/maratrondb

# .env.production  
ENVIRONMENT=production
DATABASE_URL=postgresql://maratron:password@prod-host:5432/maratrondb
```

### 3. Configuration

```python
from maratron_ai.config import get_config

config = get_config()
print(f"Environment: {config.environment}")
print(f"Database URL: {config.get_database_url()}")
```

## Integration Patterns

### 1. Direct Integration (Recommended)

Import and use the API directly in your web application:

```python
from fastapi import FastAPI
from maratron_ai import MaratronAPI

app = FastAPI()
api = MaratronAPI()

@app.post("/users/{user_id}/runs")
async def add_run(user_id: str, run_data: RunData):
    result = await api.add_run(
        user_id=user_id,
        date=run_data.date,
        duration=run_data.duration,
        distance=run_data.distance
    )
    return result

@app.get("/users/{user_id}/runs")
async def get_runs(user_id: str):
    result = await api.get_user_runs(user_id)
    return result["data"] if result["success"] else {"error": result["error"]}
```

### 2. Service Layer Pattern

Create a service layer for better organization:

```python
class RunningService:
    def __init__(self):
        self.api = MaratronAPI()
    
    async def record_run(self, user_id: str, run_data: dict):
        # Business logic here
        if run_data["distance"] <= 0:
            return {"error": "Invalid distance"}
        
        return await self.api.add_run(**run_data)
    
    async def get_user_summary(self, user_id: str):
        # Combine multiple API calls
        profile = await self.api.get_user_profile(user_id)
        runs = await self.api.get_user_runs(user_id)
        summary = await self.api.get_run_summary(user_id)
        
        return {
            "profile": profile,
            "recent_runs": runs,
            "summary": summary
        }
```

### 3. Chatbot Integration

```python
class RunningChatbot:
    def __init__(self):
        self.api = MaratronAPI()
    
    async def process_message(self, user_id: str, message: str):
        # Set user context
        await self.api.set_user_context(user_id)
        
        # Parse intent from message
        if "add run" in message.lower():
            # Extract run details and add
            return await self._handle_add_run(user_id, message)
        elif "my runs" in message.lower():
            return await self._handle_get_runs(user_id)
        else:
            return "I can help you track runs and view your progress!"
```

## Error Handling

```python
async def safe_api_call():
    try:
        async with MaratronAPI() as api:
            result = await api.create_user("Test", "test@example.com")
            if not result["success"]:
                # Handle business logic errors
                print(f"API Error: {result['error']}")
            return result
    except Exception as e:
        # Handle system errors
        print(f"System Error: {e}")
        return {"success": False, "error": "System unavailable"}
```

## Database Configuration

### Development

```python
# Uses .env.development automatically
from maratron_ai.config import get_config
config = get_config()
```

### Testing

```python
# Set environment for testing
import os
os.environ["ENVIRONMENT"] = "testing"
os.environ["TEST_DATABASE_URL"] = "postgresql://test:test@localhost:5432/test_db"
```

### Production

```python
# Uses .env.production automatically
# Set sensitive values via environment variables:
# export PRODUCTION_DATABASE_URL="postgresql://..."
```

## Docker Deployment

```bash
# Build image
docker build -t maratron-ai .

# Run with docker-compose
docker-compose up -d

# Environment variables
echo "POSTGRES_PASSWORD=secure_password" > .env
echo "PGADMIN_PASSWORD=admin_password" >> .env
```

## Health Checks

```python
async def check_system_health():
    async with MaratronAPI() as api:
        health = await api.health_check()
        if health["success"]:
            print("System is healthy")
        else:
            print(f"System issue: {health['error']}")
```

## Performance Tips

1. **Use Context Managers**: Always use `async with MaratronAPI()` for automatic cleanup
2. **Connection Pooling**: Database connections are pooled automatically
3. **Batch Operations**: Group multiple operations when possible
4. **Error Handling**: Handle both business logic and system errors
5. **Logging**: Configure logging for debugging and monitoring

## Example Applications

See `examples.py` for complete examples including:
- Basic CRUD operations
- Chatbot integration
- Web service endpoints
- Batch processing
- Error handling

## API Reference

### MaratronAPI Methods

- `create_user(name, email)` - Create new user
- `add_run(user_id, date, duration, distance)` - Add running record
- `get_user_runs(user_id, limit=10)` - Get recent runs
- `get_user_profile(user_id)` - Get complete profile
- `add_shoe(user_id, name, max_distance)` - Add shoe to collection
- `health_check()` - Check system health

### Quick Functions

- `quick_add_run(user_id, date, duration, distance)` - Simple run addition
- `quick_get_runs(user_id)` - Simple run retrieval

All methods return `Dict[str, Any]` with `success` boolean and either `data`/`message` or `error`.