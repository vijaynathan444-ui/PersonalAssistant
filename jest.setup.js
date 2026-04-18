import '@testing-library/jest-native/extend-expect';

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

// Mock NativeModules
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn(),
  getEnforcing: jest.fn(),
}));

// Mock LLM native module
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.NativeModules.LLMModule = {
    loadModel: jest.fn(() => Promise.resolve(true)),
    runInference: jest.fn(() => Promise.resolve('Test response')),
    unloadModel: jest.fn(() => Promise.resolve()),
    getModelInfo: jest.fn(() => Promise.resolve({ loaded: true, contextSize: 2048 })),
  };
  rn.NativeModules.VoskModule = {
    initialize: jest.fn(() => Promise.resolve(true)),
    startListening: jest.fn(() => Promise.resolve()),
    stopListening: jest.fn(() => Promise.resolve()),
  };
  return rn;
});

// Mock react-native-tts
jest.mock('react-native-tts', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  setDefaultLanguage: jest.fn(),
  setDefaultRate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getTotalMemory: jest.fn(() => Promise.resolve(8 * 1024 * 1024 * 1024)),
  getAvailableMemory: jest.fn(() => Promise.resolve(4 * 1024 * 1024 * 1024)),
  getDeviceId: jest.fn(() => 'test-device'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
}));

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    executeSql: jest.fn(),
  })),
  enablePromise: jest.fn(),
}));
