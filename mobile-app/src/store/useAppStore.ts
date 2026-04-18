import {create} from 'zustand';
import type {ChatMessage, AppSettings, ModelInfo} from '../types';
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

  loadPersistedState: () => {
    const messages = storageService.getChatHistory();
    const settings = storageService.getSettings();
    set({
      messages,
      settings,
      voiceEnabled: settings.voiceEnabled,
    });
  },
}));
