export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ModelInfo {
  loaded: boolean;
  contextSize: number;
}

export interface DeviceSecurityInfo {
  isRooted: boolean;
  isEmulator: boolean;
  isDebuggerAttached: boolean;
  secure: boolean;
}

export interface ModelConfig {
  modelPath: string;
  contextSize: number;
  threads: number;
  maxTokens: number;
}

export interface AppSettings {
  modelConfig: ModelConfig;
  voiceEnabled: boolean;
  systemPrompt: string;
  maxHistoryMessages: number;
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  modelConfig: {
    modelPath: '/data/local/tmp/models/model.gguf',
    contextSize: 2048,
    threads: 4,
    maxTokens: 512,
  },
  voiceEnabled: true,
  systemPrompt:
    'You are a fast, helpful offline AI assistant. Keep answers short and actionable. Avoid unnecessary explanation.',
  maxHistoryMessages: 20,
  theme: 'dark',
};
