#!/usr/bin/env node

// Simple test to verify MCP configuration
const { getMCPConfig } = require('./apps/web/src/lib/mcp/config.ts');

console.log('Testing MCP Configuration...');

try {
  // Temporarily set local development environment
  process.env.NODE_ENV = 'development';
  delete process.env.DOCKER;
  delete process.env.RUNNING_IN_DOCKER;
  
  const config = getMCPConfig();
  console.log('MCP Config:', JSON.stringify(config, null, 2));
  console.log('✅ MCP configuration loaded successfully');
} catch (error) {
  console.error('❌ MCP configuration failed:', error.message);
}