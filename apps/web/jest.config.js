// Jest configuration without next/jest wrapper
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  // Clear cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  restoreMocks: true,
  
  // Module path mapping to match tsconfig.json paths
  moduleNameMapper: {
    // Handle CSS and static assets first
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/test/__mocks__/fileMock.js',
    
    // Path aliases - be very explicit
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/api/social$': '<rootDir>/src/lib/api/social/index.ts',
    '^@lib/api/run$': '<rootDir>/src/lib/api/run/index.ts',
    '^@lib/api/user/user$': '<rootDir>/src/lib/api/user/user.ts',
    '^@lib/api/upload$': '<rootDir>/src/lib/api/upload.ts',
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
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { 
      presets: ['next/babel']
    }],
  },
  
  // Test matching
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts', 
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  
  // Resolve modules
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};

module.exports = config;
