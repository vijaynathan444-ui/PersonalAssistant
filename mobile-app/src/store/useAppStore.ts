import {create} from 'zustand';
import type {
  ChatMessage,
  ChatSession,
  AppSettings,
  ModelInfo,
  ProjectMemory,
  KnowledgeItem,
  KnowledgeChunk,
} from '../types';
import {DEFAULT_SETTINGS} from '../types';
import storageService from '../services/StorageService';

interface AppState {
  // Chat
  messages: ChatMessage[];
  isGenerating: boolean;

  // Conversations
  conversations: ChatSession[];
  activeConversationId: string | null;

  // Model
  modelInfo: ModelInfo | null;
  isModelLoading: boolean;

  // Voice
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;

  // Settings
  settings: AppSettings;

  // Project memory
  projects: ProjectMemory[];
  activeProjectId: string | null;
  knowledgeItems: KnowledgeItem[];
  knowledgeChunks: KnowledgeChunk[];

  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setIsGenerating: (value: boolean) => void;
  setModelInfo: (info: ModelInfo | null) => void;
  setIsModelLoading: (value: boolean) => void;
  setIsListening: (value: boolean) => void;
  setIsSpeaking: (value: boolean) => void;
  setVoiceEnabled: (value: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setProjects: (projects: ProjectMemory[]) => void;
  addProject: (project: ProjectMemory) => void;
  setActiveProjectId: (projectId: string | null) => void;
  setKnowledgeItems: (items: KnowledgeItem[]) => void;
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void;
  createConversation: () => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  loadPersistedState: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  messages: [],
  isGenerating: false,
  conversations: [],
  activeConversationId: null,
  modelInfo: null,
  isModelLoading: false,
  isListening: false,
  isSpeaking: false,
  voiceEnabled: true,
  settings: DEFAULT_SETTINGS,
  projects: [],
  activeProjectId: null,
  knowledgeItems: [],
  knowledgeChunks: [],

  // Actions
  addMessage: (message: ChatMessage) => {
    const {activeConversationId, conversations} = get();
    // Ensure we have an active conversation
    let convId = activeConversationId;
    if (!convId) {
      convId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const newConv: ChatSession = {
        id: convId,
        title: message.role === 'user' ? message.content.slice(0, 50) : 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        preview: message.content.slice(0, 80),
      };
      const updated = [newConv, ...conversations];
      storageService.saveConversations(updated);
      storageService.setActiveConversationId(convId);
      set({conversations: updated, activeConversationId: convId});
    }

    // Save message to conversation
    const msgs = storageService.getConversationMessages(convId);
    msgs.push(message);
    const settings = get().settings;
    const trimmed = msgs.slice(-settings.maxHistoryMessages * 2);
    storageService.saveConversationMessages(convId, trimmed);

    // Update conversation metadata
    const convs = get().conversations.map(c =>
      c.id === convId
        ? {
            ...c,
            updatedAt: Date.now(),
            messageCount: trimmed.length,
            preview: message.content.slice(0, 80),
            title: c.messageCount === 0 && message.role === 'user'
              ? message.content.slice(0, 50)
              : c.title,
          }
        : c,
    );
    storageService.saveConversations(convs);

    // Also save to legacy flat history for backward compat
    storageService.addMessage(message);
    set({messages: trimmed, conversations: convs});
  },

  setMessages: (messages: ChatMessage[]) => {
    const {activeConversationId} = get();
    if (activeConversationId) {
      storageService.saveConversationMessages(activeConversationId, messages);
    }
    storageService.saveChatHistory(messages);
    set({messages});
  },

  clearMessages: () => {
    const {activeConversationId} = get();
    if (activeConversationId) {
      storageService.saveConversationMessages(activeConversationId, []);
      const convs = get().conversations.map(c =>
        c.id === activeConversationId
          ? {...c, messageCount: 0, preview: '', updatedAt: Date.now()}
          : c,
      );
      storageService.saveConversations(convs);
      set({conversations: convs});
    }
    storageService.clearChatHistory();
    set({messages: []});
  },

  setIsGenerating: (value: boolean) => set({isGenerating: value}),
  setModelInfo: (info: ModelInfo | null) => set({modelInfo: info}),
  setIsModelLoading: (value: boolean) => set({isModelLoading: value}),
  setIsListening: (value: boolean) => set({isListening: value}),
  setIsSpeaking: (value: boolean) => set({isSpeaking: value}),

  setVoiceEnabled: (value: boolean) => {
    set({voiceEnabled: value});
    storageService.saveSettings({voiceEnabled: value});
  },

  updateSettings: (newSettings: Partial<AppSettings>) => {
    const current = get().settings;
    const merged = {...current, ...newSettings};
    storageService.saveSettings(merged);
    set({settings: merged});
  },

  setProjects: (projects: ProjectMemory[]) => {
    storageService.saveProjects(projects);
    set({projects});
  },

  addProject: (project: ProjectMemory) => {
    const projects = [...get().projects, project];
    storageService.saveProjects(projects);

    const currentActiveProjectId = get().activeProjectId;
    if (!currentActiveProjectId) {
      storageService.setActiveProjectId(project.id);
      set({projects, activeProjectId: project.id});
      return;
    }

    set({projects});
  },

  setActiveProjectId: (projectId: string | null) => {
    storageService.setActiveProjectId(projectId);
    set({activeProjectId: projectId});
  },

  setKnowledgeItems: (items: KnowledgeItem[]) => {
    storageService.saveKnowledgeItems(items);
    set({knowledgeItems: items});
  },

  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => {
    storageService.saveKnowledgeChunks(chunks);
    set({knowledgeChunks: chunks});
  },

  createConversation: () => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const newConv: ChatSession = {
      id,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      preview: '',
    };
    const convs = [newConv, ...get().conversations];
    storageService.saveConversations(convs);
    storageService.setActiveConversationId(id);
    set({conversations: convs, activeConversationId: id, messages: []});
    return id;
  },

  switchConversation: (id: string) => {
    const messages = storageService.getConversationMessages(id);
    storageService.setActiveConversationId(id);
    set({activeConversationId: id, messages});
  },

  deleteConversation: (id: string) => {
    storageService.deleteConversationMessages(id);
    const convs = get().conversations.filter(c => c.id !== id);
    storageService.saveConversations(convs);
    const {activeConversationId} = get();
    if (activeConversationId === id) {
      const nextId = convs.length > 0 ? convs[0].id : null;
      const messages = nextId ? storageService.getConversationMessages(nextId) : [];
      storageService.setActiveConversationId(nextId);
      set({conversations: convs, activeConversationId: nextId, messages});
    } else {
      set({conversations: convs});
    }
  },

  loadPersistedState: () => {
    const conversations = storageService.getConversations();
    const activeConversationId = storageService.getActiveConversationId();
    const messages = activeConversationId
      ? storageService.getConversationMessages(activeConversationId)
      : storageService.getChatHistory();
    const settings = storageService.getSettings();
    const projects = storageService.getProjects();
    const storedActiveProjectId = storageService.getActiveProjectId();
    const activeProjectId =
      storedActiveProjectId ?? (projects.length > 0 ? projects[0].id : null);
    const knowledgeItems = storageService.getKnowledgeItems();
    const knowledgeChunks = storageService.getKnowledgeChunks();

    if (activeProjectId && activeProjectId !== storedActiveProjectId) {
      storageService.setActiveProjectId(activeProjectId);
    }

    set({
      messages,
      conversations,
      activeConversationId,
      settings,
      voiceEnabled: settings.voiceEnabled,
      projects,
      activeProjectId,
      knowledgeItems,
      knowledgeChunks,
    });
  },
}));
