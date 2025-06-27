const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  // Handle module path mapping to match tsconfig.json paths
  moduleNameMapper: {
    // First handle CSS and static assets (before path aliases)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/test/__mocks__/fileMock.js',
    // Then handle path aliases - most specific first
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/api/social$': '<rootDir>/src/lib/api/social/index.ts',
    '^@lib/api/run$': '<rootDir>/src/lib/api/run/index.ts', 
    '^@lib/api/(.*)$': '<rootDir>/src/lib/api/$1/index.ts',
    '^@lib/utils/cn$': '<rootDir>/src/lib/utils/cn.ts',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@utils/(.*)$': '<rootDir>/src/lib/utils/$1',
    '^@maratypes/(.*)$': '<rootDir>/src/maratypes/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  // Mock CSS and other assets
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Let Next.js handle transforms
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  // Add explicit transformation settings
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Set module resolution
  resolver: undefined,
  clearMocks: true,
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
