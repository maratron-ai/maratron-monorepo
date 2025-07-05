import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.OPENAI_MODEL = 'gpt-4o-mini';

// Global fetch mock
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Suppress console warnings during tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('PrismaClient is unable to run in this browser environment') ||
       args[0].includes('has been bundled for the browser') ||
       args[0].includes('Error fetching leaderboard data: Error: Database error') ||
       args[0].includes('Error updating user coach: Error: Database update failed') ||
       args[0].includes('TypeError: Cannot read properties of undefined (reading \'get\')') ||
       args[0].includes('Cannot read properties of undefined (reading \'get\')') ||
       args[0].includes('RequestCookies') ||
       args[0].includes('NextRequest') ||
       args[0].includes('Fallback also failed:') ||
       args[0].includes('Cache get error for key') ||
       // Test-specific error patterns that are expected
       args[0].includes('Enhanced chat generation failed:') ||
       args[0].includes('Fallback generation also failed:') ||
       args[0].includes('Cache health check failed:') ||
       args[0].includes('❌ Redis client error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('outdated JSX transform') ||
       args[0].includes('new-jsx-transform') ||
       args[0].includes('No MCP client available') ||
       args[0].includes('using basic response mode') ||
       args[0].includes('MCP client unavailable') ||
       args[0].includes('Unable to initialize MCP client') ||
       args[0].includes('Failed to fetch user coach information') ||
       args[0].includes('PrismaClient is unable to run in this browser environment') ||
       args[0].includes('Redis connection issue for key') ||
       args[0].includes('falling back to database') ||
       args[0].includes('Stream isn\'t writeable and enableOfflineQueue options is false'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.log = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('User context set for:') ||
       args[0].includes('🔄 Phase 1: Determine tool usage') ||
       args[0].includes('📋 Planning result - tool calls:') ||
       args[0].includes('🔄 Phase 2: Executing tools') ||
       args[0].includes('🔄 Phase 3: Generate final response') ||
       args[0].includes('🔧 Setting user context for tool execution:') ||
       args[0].includes('✅ User context confirmed for tool execution') ||
       args[0].includes('🛠️ Executing tool:') ||
       args[0].includes('✅ Tool') ||
       args[0].includes('returned') ||
       args[0].includes('characters') ||
       args[0].includes('🔄 Phase 3: Generating final response with tool data') ||
       args[0].includes('✅ Final response length:') ||
       args[0].includes('🔧 MOCK: tool() called with description:') ||
       args[0].includes('📝 No tools needed, returning direct response') ||
       args[0].includes('🔍 Executing') ||
       args[0].includes('tool with') ||
       args[0].includes('📊 Tool data preview:') ||
       // New patterns from chat-handler.ts
       args[0].includes('🔧 Setting user context with caching for:') ||
       args[0].includes('📊 Fetching fresh user context data for:') ||
       args[0].includes('✅ User context data loaded') ||
       args[0].includes('✅ User context already set, proceeding with tool execution') ||
       args[0].includes('🔗 Redis client connected') ||
       args[0].includes('✅ Redis client ready') ||
       args[0].includes('🔌 Redis client connection closed') ||
       args[0].includes('🔄 Redis client reconnecting...') ||
       args[0].includes('🔚 Redis client connection ended') ||
       args[0].includes('🛠️ Executing') ||
       args[0].includes('tools in parallel') ||
       args[0].includes('🛠️ Starting tool:') ||
       args[0].includes('✅ All') ||
       args[0].includes('tools completed in parallel') ||
       // Performance test patterns
       args[0].includes('concurrent requests completed in') ||
       args[0].includes('Average duration per request:') ||
       args[0].includes('completed in') ||
       args[0].includes('Performance variance across coaches:') ||
       args[0].includes('Memory usage before:') ||
       args[0].includes('Memory usage after:') ||
       args[0].includes('Heap increase:') ||
       args[0].includes('Error handling completed in') ||
       args[0].includes('⚡ User context already established for:') ||
       // Redis connection patterns
       args[0].includes('🔗 Redis client connected') ||
       args[0].includes('✅ Redis client ready') ||
       args[0].includes('🔌 Redis client connection closed') ||
       args[0].includes('🔄 Redis client reconnecting...'))
    ) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});