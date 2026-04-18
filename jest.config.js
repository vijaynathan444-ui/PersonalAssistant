module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|react-native-vosk|react-native-tts|react-native-markdown-display|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-device-info)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/mobile-app/src/$1',
  },
  collectCoverageFrom: [
    'mobile-app/src/**/*.{ts,tsx}',
    '!mobile-app/src/**/*.d.ts',
    '!mobile-app/src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
  ],
};
