"""Health checks and environment validation for Maratron AI MCP Server."""

import asyncio
import logging
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

import asyncpg

from .config import get_config, Environment
from .logging_config import get_logger

logger = get_logger(__name__)


class HealthCheckError(Exception):
    """Exception raised when health checks fail."""
    pass


async def validate_database_connection() -> Dict[str, Any]:
    """Validate database connection and basic operations."""
    config = get_config()
    database_url = config.get_database_url()
    
    try:
        # Test connection
        conn = await asyncpg.connect(database_url)
        
        # Test basic query
        result = await conn.fetchval("SELECT 1")
        if result != 1:
            raise HealthCheckError("Database query returned unexpected result")
        
        # Test database schema
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        required_tables = {"User", "Run", "Shoe", "UserSessions"}
        existing_tables = {row['table_name'] for row in tables}
        missing_tables = required_tables - existing_tables
        
        await conn.close()
        
        return {
            "status": "healthy" if not missing_tables else "degraded",
            "connection": "ok",
            "tables": list(existing_tables),
            "missing_tables": list(missing_tables),
            "url_host": urlparse(database_url).hostname
        }
        
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "url_host": urlparse(database_url).hostname
        }


def validate_environment_config() -> Dict[str, Any]:
    """Validate environment configuration."""
    config = get_config()
    issues = []
    warnings = []
    
    # Environment-specific validations
    if config.environment == Environment.PRODUCTION:
        if config.server.debug:
            issues.append("Debug mode enabled in production")
        
        if config.server.log_level.value == "DEBUG":
            warnings.append("Debug logging enabled in production")
        
        # Check for default/weak database URLs
        db_url = config.get_database_url()
        if "yourpassword" in db_url or "password" in db_url:
            issues.append("Using default/weak database password")
    
    elif config.environment == Environment.TESTING:
        db_url = config.get_database_url()
        if "test" not in db_url.lower():
            warnings.append("Test environment not using test database")
    
    # Validate database URL format
    try:
        parsed = urlparse(config.database.url)
        if not parsed.hostname:
            issues.append("Database URL missing hostname")
        if not parsed.path or parsed.path == '/':
            issues.append("Database URL missing database name")
    except Exception as e:
        issues.append(f"Invalid database URL: {e}")
    
    # Check connection pool settings
    if config.database.max_connections < config.database.min_connections:
        issues.append("max_connections < min_connections")
    
    # Check timeout settings
    if config.database.query_timeout > config.database.connection_timeout:
        warnings.append("query_timeout > connection_timeout")
    
    return {
        "environment": config.environment.value,
        "issues": issues,
        "warnings": warnings,
        "status": "healthy" if not issues else "unhealthy"
    }


def validate_system_requirements() -> Dict[str, Any]:
    """Validate system requirements and dependencies."""
    issues = []
    warnings = []
    
    # Check Python version
    python_version = sys.version_info
    if python_version < (3, 11):
        issues.append(f"Python {python_version.major}.{python_version.minor} < 3.11")
    
    # Check required imports
    required_modules = [
        ("asyncpg", "Database driver"),
        ("pydantic", "Configuration management"),
        ("mcp", "MCP framework")
    ]
    
    for module_name, description in required_modules:
        try:
            __import__(module_name)
        except ImportError:
            issues.append(f"Missing required module: {module_name} ({description})")
    
    # Check system resources (basic)
    try:
        import psutil
        memory = psutil.virtual_memory()
        if memory.available < 100 * 1024 * 1024:  # 100MB
            warnings.append("Low available memory")
    except ImportError:
        warnings.append("psutil not available for system monitoring")
    
    return {
        "python_version": f"{python_version.major}.{python_version.minor}.{python_version.micro}",
        "issues": issues,
        "warnings": warnings,
        "status": "healthy" if not issues else "unhealthy"
    }


async def comprehensive_health_check() -> Dict[str, Any]:
    """Perform comprehensive health check of all systems."""
    logger.info("Starting comprehensive health check")
    start_time = datetime.now()
    
    # Run all health checks
    checks = {}
    overall_status = "healthy"
    
    # Environment configuration check
    env_check = validate_environment_config()
    checks["environment"] = env_check
    if env_check["status"] != "healthy":
        overall_status = "unhealthy"
    
    # System requirements check
    sys_check = validate_system_requirements()
    checks["system"] = sys_check
    if sys_check["status"] != "healthy":
        overall_status = "unhealthy"
    
    # Database connection check
    db_check = await validate_database_connection()
    checks["database"] = db_check
    if db_check["status"] == "unhealthy":
        overall_status = "unhealthy"
    elif db_check["status"] == "degraded" and overall_status == "healthy":
        overall_status = "degraded"
    
    # Calculate check duration
    duration = (datetime.now() - start_time).total_seconds()
    
    result = {
        "status": overall_status,
        "timestamp": start_time.isoformat(),
        "duration_seconds": duration,
        "checks": checks
    }
    
    logger.info(f"Health check completed: {overall_status} in {duration:.2f}s")
    return result


async def startup_validation() -> bool:
    """Validate system on startup. Returns True if healthy enough to start."""
    logger.info("Running startup validation")
    
    health = await comprehensive_health_check()
    
    if health["status"] == "unhealthy":
        logger.error("Startup validation failed - system unhealthy")
        
        # Log specific issues
        for check_name, check_result in health["checks"].items():
            if check_result["status"] == "unhealthy":
                logger.error(f"{check_name} check failed:")
                for issue in check_result.get("issues", []):
                    logger.error(f"  - {issue}")
        
        return False
    
    elif health["status"] == "degraded":
        logger.warning("System is degraded but starting anyway")
        
        # Log warnings
        for check_name, check_result in health["checks"].items():
            for warning in check_result.get("warnings", []):
                logger.warning(f"{check_name}: {warning}")
    
    else:
        logger.info("Startup validation passed - system healthy")
    
    return True


def create_health_check_endpoint():
    """Create a health check function for web frameworks."""
    async def health_endpoint():
        """Health check endpoint for web applications."""
        try:
            health = await comprehensive_health_check()
            
            # Return appropriate HTTP status
            if health["status"] == "healthy":
                status_code = 200
            elif health["status"] == "degraded":
                status_code = 200  # Still operational
            else:
                status_code = 503  # Service unavailable
            
            return {
                "status_code": status_code,
                "body": health
            }
        except Exception as e:
            logger.error(f"Health check endpoint error: {e}")
            return {
                "status_code": 500,
                "body": {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
            }
    
    return health_endpoint


# CLI command for health checks
async def main():
    """CLI command to run health checks."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Maratron AI Health Check")
    parser.add_argument("--startup", action="store_true", help="Run startup validation")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = "DEBUG" if args.verbose else "INFO"
    logging.basicConfig(level=log_level, format="%(levelname)s - %(message)s")
    
    try:
        if args.startup:
            success = await startup_validation()
            sys.exit(0 if success else 1)
        else:
            health = await comprehensive_health_check()
            print(f"Overall Status: {health['status']}")
            
            if args.verbose:
                import json
                print(json.dumps(health, indent=2))
            
            sys.exit(0 if health["status"] in ("healthy", "degraded") else 1)
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())