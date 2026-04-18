import storageService from '../../services/StorageService';
import type {ChatMessage} from '../../types';

// Mock MMKV
const mockStorage = new Map<string, string | boolean>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn((key: string) => mockStorage.get(key) as string | undefined),
    set: jest.fn((key: string, value: string | boolean) => mockStorage.set(key, value)),
    delete: jest.fn((key: string) => mockStorage.delete(key)),
    getBoolean: jest.fn((key: string) => mockStorage.get(key) as boolean | undefined),
    contains: jest.fn((key: string) => mockStorage.has(key)),
    getAllKeys: jest.fn(() => Array.from(mockStorage.keys())),
  })),
}));

describe('StorageService', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Chat History', () => {
    it('should return empty array when no history exists', () => {
      const result = storageService.getChatHistory();
      expect(result).toEqual([]);
    });

    it('should save and retrieve chat history', () => {
      const messages: ChatMessage[] = [
        {id: '1', role: 'user', content: 'Hello', timestamp: 1000},
        {id: '2', role: 'assistant', content: 'Hi there!', timestamp: 1001},
      ];

      storageService.saveChatHistory(messages);
      const result = storageService.getChatHistory();
      expect(result).toEqual(messages);
    });

    it('should add a message and return updated history', () => {
      const msg: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      };

      const result = storageService.addMessage(msg);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test');
    });

    it('should clear chat history', () => {
      const msg: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      };
      storageService.addMessage(msg);
      storageService.clearChatHistory();
      const result = storageService.getChatHistory();
      expect(result).toEqual([]);
    });
  });

  describe('Settings', () => {
    it('should return default settings when none saved', () => {
      const settings = storageService.getSettings();
      expect(settings.modelConfig.contextSize).toBe(2048);
      expect(settings.voiceEnabled).toBe(true);
    });

    it('should save and retrieve settings', () => {
      storageService.saveSettings({voiceEnabled: false});
      const settings = storageService.getSettings();
      expect(settings.voiceEnabled).toBe(false);
      // Other defaults should be preserved
      expect(settings.modelConfig.contextSize).toBe(2048);
    });
  });

  describe('Onboarding', () => {
    it('should return false by default', () => {
      expect(storageService.isOnboarded()).toBe(false);
    });

    it('should persist onboarding state', () => {
      storageService.setOnboarded();
      expect(storageService.isOnboarded()).toBe(true);
    });
  });
});
