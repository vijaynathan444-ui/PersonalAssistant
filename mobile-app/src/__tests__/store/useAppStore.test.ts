import {useAppStore} from '../../store/useAppStore';
import type {ChatMessage} from '../../types';

const mockDefaultSettings = {
  modelConfig: {
    modelPath: '/data/local/tmp/models/model.gguf',
    contextSize: 2048,
    threads: 4,
    maxTokens: 512,
  },
  voiceEnabled: true,
  systemPrompt:
    'You are a fast, helpful AI assistant. Use project memory and retrieved sources when they are provided. If sources are missing or weak, say that clearly instead of inventing details. Keep answers short and actionable.',
  maxHistoryMessages: 20,
  retrievalTopK: 4,
  webAccessEnabled: true,
  theme: 'dark' as const,
};

// Mock StorageService
jest.mock('../../services/StorageService', () => ({
  __esModule: true,
  default: {
    getChatHistory: jest.fn(() => []),
    saveChatHistory: jest.fn(),
    addMessage: jest.fn((msg: ChatMessage) => [msg]),
    clearChatHistory: jest.fn(),
    getSettings: jest.fn(() => mockDefaultSettings),
    saveSettings: jest.fn(),
    getProjects: jest.fn(() => []),
    saveProjects: jest.fn(),
    getActiveProjectId: jest.fn(() => null),
    setActiveProjectId: jest.fn(),
    getKnowledgeItems: jest.fn(() => []),
    saveKnowledgeItems: jest.fn(),
    getKnowledgeChunks: jest.fn(() => []),
    saveKnowledgeChunks: jest.fn(),
  },
  storageService: {
    getChatHistory: jest.fn(() => []),
    saveChatHistory: jest.fn(),
    addMessage: jest.fn((msg: ChatMessage) => [msg]),
    clearChatHistory: jest.fn(),
    getSettings: jest.fn(() => mockDefaultSettings),
    saveSettings: jest.fn(),
    getProjects: jest.fn(() => []),
    saveProjects: jest.fn(),
    getActiveProjectId: jest.fn(() => null),
    setActiveProjectId: jest.fn(),
    getKnowledgeItems: jest.fn(() => []),
    saveKnowledgeItems: jest.fn(),
    getKnowledgeChunks: jest.fn(() => []),
    saveKnowledgeChunks: jest.fn(),
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
      settings: mockDefaultSettings,
      projects: [],
      activeProjectId: null,
      knowledgeItems: [],
      knowledgeChunks: [],
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

  describe('project memory', () => {
    it('should add and activate a project', () => {
      useAppStore.getState().addProject({
        id: 'project_1',
        name: 'Docs',
        description: 'Testing project memory',
        createdAt: 1,
        updatedAt: 1,
      });

      expect(useAppStore.getState().projects).toHaveLength(1);
      expect(useAppStore.getState().activeProjectId).toBe('project_1');
    });

    it('should persist imported knowledge entities in store state', () => {
      useAppStore.getState().setKnowledgeItems([
        {
          id: 'item_1',
          projectId: 'project_1',
          title: 'readme.md',
          sourceType: 'file',
          fileType: 'md',
          status: 'ready',
          summary: 'Imported markdown file',
          preview: 'Imported markdown file',
          contentLength: 21,
          chunkCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ]);
      useAppStore.getState().setKnowledgeChunks([
        {
          id: 'chunk_1',
          itemId: 'item_1',
          projectId: 'project_1',
          text: 'Imported markdown file',
          keywords: ['imported', 'markdown', 'file'],
          tokenEstimate: 5,
        },
      ]);

      expect(useAppStore.getState().knowledgeItems).toHaveLength(1);
      expect(useAppStore.getState().knowledgeChunks).toHaveLength(1);
    });
  });
});
