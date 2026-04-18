import {create} from 'zustand';
import type {
  ChatMessage,
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
  loadPersistedState: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  messages: [],
  isGenerating: false,
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
    const updated = storageService.addMessage(message);
    set({messages: updated});
  },

  setMessages: (messages: ChatMessage[]) => {
    storageService.saveChatHistory(messages);
    set({messages});
  },

  clearMessages: () => {
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

  loadPersistedState: () => {
    const messages = storageService.getChatHistory();
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
      settings,
      voiceEnabled: settings.voiceEnabled,
      projects,
      activeProjectId,
      knowledgeItems,
      knowledgeChunks,
    });
  },
}));
