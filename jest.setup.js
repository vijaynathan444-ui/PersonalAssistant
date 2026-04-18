import '@testing-library/jest-native/extend-expect';

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    getBoolean: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

jest.mock('react-native-document-picker', () => ({
  __esModule: true,
  default: {
    pickSingle: jest.fn(),
    types: {
      allFiles: '*/*',
    },
  },
  pick: jest.fn(() => Promise.resolve([{uri: 'content://test/model.gguf', name: 'model.gguf'}])),
  types: {
    allFiles: '*/*',
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({didCancel: true})),
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(),
    copyFile: jest.fn(() => Promise.resolve()),
    exists: jest.fn(() => Promise.resolve(false)),
    mkdir: jest.fn(() => Promise.resolve()),
    DocumentDirectoryPath: '/data/data/com.localaiassistant/files',
  },
  readFile: jest.fn(),
  copyFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(false)),
  mkdir: jest.fn(() => Promise.resolve()),
  DocumentDirectoryPath: '/data/data/com.localaiassistant/files',
}));

const ReactNative = require('react-native');

ReactNative.NativeModules.LLMModule = {
  loadModel: jest.fn(() => Promise.resolve(true)),
  runInference: jest.fn(() => Promise.resolve('Test response')),
  unloadModel: jest.fn(() => Promise.resolve()),
  getModelInfo: jest.fn(() => Promise.resolve({loaded: true, contextSize: 4096})),
  getAppModelDir: jest.fn(() => Promise.resolve('/data/data/com.localaiassistant/files/models')),
};

ReactNative.NativeModules.VoskModule = {
  initialize: jest.fn(() => Promise.resolve(true)),
  startListening: jest.fn(() => Promise.resolve()),
  stopListening: jest.fn(() => Promise.resolve()),
};

ReactNative.NativeModules.SecurityModule = {
  isDeviceSecure: jest.fn(() =>
    Promise.resolve({
      isRooted: false,
      isEmulator: false,
      isDebuggerAttached: false,
      secure: true,
    }),
  ),
  encryptData: jest.fn(() => Promise.resolve('encrypted_base64')),
  decryptData: jest.fn(() => Promise.resolve('decrypted_text')),
};

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
