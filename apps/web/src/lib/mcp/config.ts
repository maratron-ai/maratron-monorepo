/**
 * MCP Client Configuration
 * Handles environment-aware MCP server connection settings
 */

import { MCPServerConfig } from './types';

interface MCPEnvironmentConfig {
  development: MCPServerConfig;
  production: MCPServerConfig;
  docker: MCPServerConfig;
  test: MCPServerConfig;
}

// Default configurations for different environments
const MCP_CONFIGS: MCPEnvironmentConfig = {
  development: {
    command: 'python',
    args: ['./apps/ai/run_server.py'],
    env: {
      ENVIRONMENT: 'development',
      LOG_LEVEL: 'DEBUG'
    }
  },
  
  production: {
    command: 'python',
    args: ['/app/ai/run_server.py'],
    env: {
      ENVIRONMENT: 'production',
      LOG_LEVEL: 'INFO'
    }
  },
  
  docker: {
    command: 'bash',
    args: ['-c', 'cd /app/ai && uv run python run_server.py'],
    env: {
      ENVIRONMENT: 'development',
      LOG_LEVEL: 'DEBUG',
      DATABASE_URL: 'postgresql://maratron:yourpassword@host.docker.internal:5432/maratrondb'
    }
  },
  
  test: {
    command: 'python',
    args: ['./apps/ai/run_server.py'],
    env: {
      ENVIRONMENT: 'testing',
      LOG_LEVEL: 'ERROR'
    }
  }
};

/**
 * Get MCP configuration based on current environment
 */
export function getMCPConfig(): MCPServerConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDocker = process.env.DOCKER === 'true' || process.env.RUNNING_IN_DOCKER === 'true';
  
  // Determine environment type
  let envType: keyof MCPEnvironmentConfig;
  
  if (nodeEnv === 'test') {
    envType = 'test';
  } else if (isDocker) {
    envType = 'docker';
  } else if (nodeEnv === 'production') {
    envType = 'production';
  } else {
    envType = 'development';
  }
  
  // Get base config
  const baseConfig = MCP_CONFIGS[envType];
  
  // Override with environment variables if provided
  
  const config: MCPServerConfig = {
    command: process.env.MCP_SERVER_COMMAND || baseConfig.command,
    args: process.env.MCP_SERVER_PATH ? [process.env.MCP_SERVER_PATH] : baseConfig.args,
    env: {
      ...baseConfig.env,
      ...Object.fromEntries(
        Object.entries({
          DATABASE_URL: process.env.DATABASE_URL,
          ENVIRONMENT: process.env.ENVIRONMENT,
          LOG_LEVEL: process.env.LOG_LEVEL,
        }).filter(([, value]) => value !== undefined)
      ) as Record<string, string>
    }
  };
  
  return config;
}

/**
 * Validate MCP configuration
 */
export function validateMCPConfig(config: MCPServerConfig): void {
  if (!config.command) {
    throw new Error('MCP server command is required');
  }
  
  if (!config.args || config.args.length === 0) {
    throw new Error('MCP server script path is required');
  }
  
  // In production, validate that the path exists (basic check)
  if (process.env.NODE_ENV === 'production') {
    const scriptPath = config.args[0];
    if (!scriptPath.startsWith('/app/') && !scriptPath.startsWith('./')) {
      console.warn(`Warning: MCP server path "${scriptPath}" may not be accessible in production`);
    }
  }
}

/**
 * Get MCP configuration with validation
 */
export function getValidatedMCPConfig(): MCPServerConfig {
  const config = getMCPConfig();
  validateMCPConfig(config);
  return config;
}