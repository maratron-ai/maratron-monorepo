"""Logging configuration for Maratron AI MCP Server."""

import logging
import logging.config
import sys
from pathlib import Path
from typing import Dict, Any
from .config import get_config, LogLevel


def setup_logging(log_level: str = None, log_file: str = None) -> None:
    """Setup logging configuration.
    
    Args:
        log_level: Override log level from config
        log_file: Optional log file path
    """
    config = get_config()
    
    # Use provided log_level or fall back to config
    level = log_level or config.server.log_level.value
    
    # Create logs directory if using file logging
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Define logging configuration
    logging_config: Dict[str, Any] = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'detailed': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
            'simple': {
                'format': '%(levelname)s - %(name)s - %(message)s'
            },
            'json': {
                'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s", "line": %(lineno)d}',
                'datefmt': '%Y-%m-%dT%H:%M:%S'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': level,
                'formatter': 'simple' if config.environment.value == 'development' else 'detailed',
                'stream': sys.stdout
            }
        },
        'loggers': {
            '': {  # Root logger
                'level': level,
                'handlers': ['console'],
                'propagate': False
            },
            'maratron': {
                'level': level,
                'handlers': ['console'],
                'propagate': False
            },
            'asyncpg': {
                'level': 'WARNING',  # Reduce asyncpg verbosity
                'handlers': ['console'],
                'propagate': False
            },
            'mcp': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            }
        }
    }
    
    # Add file handler if log_file is specified
    if log_file:
        logging_config['handlers']['file'] = {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': level,
            'formatter': 'json' if config.is_production() else 'detailed',
            'filename': log_file,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'encoding': 'utf-8'
        }
        
        # Add file handler to all loggers
        for logger_config in logging_config['loggers'].values():
            logger_config['handlers'].append('file')
    
    # Apply configuration
    logging.config.dictConfig(logging_config)
    
    # Set up logger for this module
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured - Level: {level}, Environment: {config.environment.value}")
    
    if log_file:
        logger.info(f"File logging enabled: {log_file}")


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def configure_mcp_logging():
    """Configure logging specifically for MCP server operations."""
    logger = get_logger('maratron.mcp')
    
    # Add custom log levels for MCP operations
    logging.addLevelName(25, 'TOOL')
    logging.addLevelName(23, 'RESOURCE')
    
    def tool_log(self, message, *args, **kwargs):
        if self.isEnabledFor(25):
            self._log(25, message, args, **kwargs)
    
    def resource_log(self, message, *args, **kwargs):
        if self.isEnabledFor(23):
            self._log(23, message, args, **kwargs)
    
    logging.Logger.tool = tool_log
    logging.Logger.resource = resource_log
    
    return logger