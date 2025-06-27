// Don't use next/jest wrapper to avoid Next.js module resolution conflicts
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  // Module path mapping to match tsconfig.json paths
  moduleNameMapper: {
    // Handle CSS and static assets first
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/test/__mocks__/fileMock.js',
    
    // Path aliases matching tsconfig.json exactly  
    '^@components/(.*)$': '<rootDir>/src/components/$1',
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
      presets: [
        ['next/babel', { 'preset-env': { targets: { node: 'current' } } }]
      ]
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
  
  // Mock and environment setup
  clearMocks: true,
  restoreMocks: true,
  
  // Resolve modules
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};

module.exports = config;
