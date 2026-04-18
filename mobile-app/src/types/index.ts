export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  citations?: KnowledgeCitation[];
}

export type KnowledgeSourceType = 'file' | 'web-page' | 'web-search' | 'image';

export type KnowledgeFileType =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'image'
  | 'md'
  | 'txt'
  | 'csv'
  | 'json'
  | 'html'
  | 'unknown';

export type KnowledgeStatus =
  | 'processing'
  | 'ready'
  | 'metadata-only'
  | 'failed';

export interface ProjectMemory {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeChunk {
  id: string;
  itemId: string;
  projectId: string;
  text: string;
  keywords: string[];
  tokenEstimate: number;
}

export interface KnowledgeItem {
  id: string;
  projectId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  fileType: KnowledgeFileType;
  status: KnowledgeStatus;
  uri?: string;
  summary: string;
  preview: string;
  contentLength: number;
  chunkCount: number;
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
}

export interface KnowledgeCitation {
  itemId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  fileType: KnowledgeFileType;
  excerpt: string;
  score: number;
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
  retrievalTopK: number;
  webAccessEnabled: boolean;
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  modelConfig: {
    modelPath: '/data/local/tmp/models/model.gguf',
    contextSize: 4096,
    threads: 4,
    maxTokens: 1024,
  },
  voiceEnabled: true,
  systemPrompt:
    'You are a fast, helpful AI assistant. Use project memory and retrieved sources when they are provided. If sources are missing or weak, say that clearly instead of inventing details. Keep answers short and actionable.',
  maxHistoryMessages: 20,
  retrievalTopK: 4,
  webAccessEnabled: true,
  theme: 'dark',
};
