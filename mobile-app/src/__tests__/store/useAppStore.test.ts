import {useAppStore} from '../../store/useAppStore';
import type {ChatMessage} from '../../types';
import {DEFAULT_SETTINGS} from '../../types';

// Mock StorageService
jest.mock('../../services/StorageService', () => ({
  __esModule: true,
  default: {
    getChatHistory: jest.fn(() => []),
    saveChatHistory: jest.fn(),
    addMessage: jest.fn((msg: ChatMessage) => [msg]),
    clearChatHistory: jest.fn(),
    getSettings: jest.fn(() => DEFAULT_SETTINGS),
    saveSettings: jest.fn(),
  },
  storageService: {
    getChatHistory: jest.fn(() => []),
    saveChatHistory: jest.fn(),
    addMessage: jest.fn((msg: ChatMessage) => [msg]),
    clearChatHistory: jest.fn(),
    getSettings: jest.fn(() => DEFAULT_SETTINGS),
    saveSettings: jest.fn(),
  },
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      messages: [],
      isGenerating: false,
      modelInfo: null,
      isModelLoading: false,
      isListening: false,
      isSpeaking: false,
      voiceEnabled: true,
      settings: DEFAULT_SETTINGS,
    });
  });

  describe('messages', () => {
    it('should start with empty messages', () => {
      expect(useAppStore.getState().messages).toEqual([]);
    });

    it('should add a message', () => {
      const msg: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      useAppStore.getState().addMessage(msg);
      expect(useAppStore.getState().messages).toEqual([msg]);
    });

    it('should clear messages', () => {
      const msg: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      useAppStore.getState().addMessage(msg);
      useAppStore.getState().clearMessages();
      expect(useAppStore.getState().messages).toEqual([]);
    });
  });

  describe('model state', () => {
    it('should track model loading state', () => {
      useAppStore.getState().setIsModelLoading(true);
      expect(useAppStore.getState().isModelLoading).toBe(true);

      useAppStore.getState().setIsModelLoading(false);
      expect(useAppStore.getState().isModelLoading).toBe(false);
    });

    it('should store model info', () => {
      useAppStore.getState().setModelInfo({loaded: true, contextSize: 2048});
      expect(useAppStore.getState().modelInfo).toEqual({
        loaded: true,
        contextSize: 2048,
      });
    });

    it('should clear model info', () => {
      useAppStore.getState().setModelInfo({loaded: true, contextSize: 2048});
      useAppStore.getState().setModelInfo(null);
      expect(useAppStore.getState().modelInfo).toBeNull();
    });
  });

  describe('generating state', () => {
    it('should track generating state', () => {
      useAppStore.getState().setIsGenerating(true);
      expect(useAppStore.getState().isGenerating).toBe(true);
    });
  });

  describe('voice state', () => {
    it('should toggle voice enabled', () => {
      useAppStore.getState().setVoiceEnabled(false);
      expect(useAppStore.getState().voiceEnabled).toBe(false);

      useAppStore.getState().setVoiceEnabled(true);
      expect(useAppStore.getState().voiceEnabled).toBe(true);
    });

    it('should track listening state', () => {
      useAppStore.getState().setIsListening(true);
      expect(useAppStore.getState().isListening).toBe(true);
    });

    it('should track speaking state', () => {
      useAppStore.getState().setIsSpeaking(true);
      expect(useAppStore.getState().isSpeaking).toBe(true);
    });
  });

  describe('settings', () => {
    it('should have default settings', () => {
      const settings = useAppStore.getState().settings;
      expect(settings.modelConfig.contextSize).toBe(2048);
      expect(settings.voiceEnabled).toBe(true);
    });

    it('should update partial settings', () => {
      useAppStore.getState().updateSettings({voiceEnabled: false});
      expect(useAppStore.getState().settings.voiceEnabled).toBe(false);
      // Other settings preserved
      expect(useAppStore.getState().settings.modelConfig.contextSize).toBe(2048);
    });
  });
});
