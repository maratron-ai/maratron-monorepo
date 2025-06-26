"""Test configuration and fixtures."""
import os
import pytest
import asyncio
import asyncpg
from unittest.mock import AsyncMock, MagicMock
from typing import AsyncGenerator

# Set test environment
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test_maratrondb"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default run loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_pool():
    """Mock asyncpg connection pool for unit tests."""
    pool = AsyncMock(spec=asyncpg.Pool)
    return pool


@pytest.fixture
def mock_connection():
    """Mock asyncpg connection for unit tests."""
    conn = AsyncMock(spec=asyncpg.Connection)
    return conn


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Test Runner",
        "email": "test@example.com"
    }


@pytest.fixture
def sample_run_data():
    """Sample run data for testing."""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "date": "2024-01-15",
        "duration": "00:30:00",
        "distance": 5.0,
        "distance_unit": "miles"
    }


@pytest.fixture
def sample_shoe_data():
    """Sample shoe data for testing."""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Nike Air Zoom",
        "max_distance": 500.0,
        "distance_unit": "miles"
    }


@pytest.fixture
async def test_db_pool():
    """Create a test database connection pool for integration tests."""
    database_url = os.getenv("TEST_DATABASE_URL", "postgresql://test:test@localhost:5432/test_maratrondb")
    
    try:
        pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
        yield pool
    except Exception as e:
        pytest.skip(f"Test database not available: {e}")
    finally:
        if 'pool' in locals():
            await pool.close()


@pytest.fixture
async def clean_test_db(test_db_pool):
    """Clean the test database before and after each test."""
    # Clean before test
    async with test_db_pool.acquire() as conn:
        await conn.execute('TRUNCATE TABLE "Users", "Runs", "Shoes" CASCADE')
    
    yield
    
    # Clean after test
    async with test_db_pool.acquire() as conn:
        await conn.execute('TRUNCATE TABLE "Users", "Runs", "Shoes" CASCADE')