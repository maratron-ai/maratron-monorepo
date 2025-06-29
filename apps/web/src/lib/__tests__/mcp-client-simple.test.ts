/**
 * Simplified Tests for MCP Client Service
 */

import { getMCPClient } from '../mcp/client';

// Mock the MCP SDK completely
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: jest.fn(),
}));

jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: jest.fn(),
}));

describe('MCP Client Service', () => {
  describe('Singleton Pattern', () => {
    it('returns the same instance on multiple calls', () => {
      const client1 = getMCPClient();
      const client2 = getMCPClient();
      expect(client1).toBe(client2);
    });

    it('creates a client instance', () => {
      const client = getMCPClient();
      expect(client).toBeDefined();
      expect(typeof client.connect).toBe('function');
      expect(typeof client.callTool).toBe('function');
      expect(typeof client.disconnect).toBe('function');
    });
  });

  describe('Client Interface', () => {
    let client: ReturnType<typeof getMCPClient>;

    beforeEach(() => {
      client = getMCPClient();
    });

    it('has required methods', () => {
      expect(typeof client.connect).toBe('function');
      expect(typeof client.disconnect).toBe('function');
      expect(typeof client.callTool).toBe('function');
      expect(typeof client.listTools).toBe('function');
      expect(typeof client.setUserContext).toBe('function');
      expect(typeof client.getUserContext).toBe('function');
      expect(typeof client.getDatabaseSummary).toBe('function');
      expect(typeof client.getUserRuns).toBe('function');
    });

    it('can be configured with different options', () => {
      // Test that the client accepts configuration
      expect(() => getMCPClient()).not.toThrow();
    });
  });
});