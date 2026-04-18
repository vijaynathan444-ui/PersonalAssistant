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
  modelId?: string;
}

export interface DeviceSecurityInfo {
  isRooted: boolean;
  isEmulator: boolean;
  isDebuggerAttached: boolean;
  secure: boolean;
}

export type ModelTier = 'lightweight' | 'balanced' | 'performance' | 'premium';
export type ModelCategory = 'general' | 'coding' | 'reasoning' | 'chat';

export interface ModelCatalogEntry {
  id: string;
  name: string;
  family: string;
  parameters: string;
  quantization: string;
  sizeGB: number;
  minRAMGB: number;
  contextWindow: number;
  defaultMaxTokens: number;
  defaultThreads: number;
  tier: ModelTier;
  category: ModelCategory;
  promptTemplate: 'chatml' | 'llama2' | 'phi3' | 'gemma' | 'mistral' | 'alpaca' | 'zephyr';
  license: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  hallucinationRisk: 'low' | 'medium' | 'high';
  fileName: string;
  bundled: boolean;
  rank: number;
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    id: 'phi3.1-mini-4k-q4',
    name: 'Phi-3.1 Mini 4K',
    family: 'Phi',
    parameters: '3.8B',
    quantization: 'Q4_K_M',
    sizeGB: 2.3,
    minRAMGB: 4,
    contextWindow: 4096,
    defaultMaxTokens: 1024,
    defaultThreads: 4,
    tier: 'balanced',
    category: 'general',
    promptTemplate: 'phi3',
    license: 'MIT',
    description: 'Best quality/size ratio for mobile. Strong instruction following.',
    strengths: ['Fast inference', 'Low hallucination', 'Strong reasoning'],
    weaknesses: ['Limited multilingual'],
    hallucinationRisk: 'low',
    fileName: 'phi3.1-mini-4k-q4.gguf',
    bundled: false,
    rank: 1,
  },
  {
    id: 'gemma2-2b-q4',
    name: 'Gemma 2 2B',
    family: 'Gemma',
    parameters: '2B',
    quantization: 'Q4_K_M',
    sizeGB: 1.5,
    minRAMGB: 3,
    contextWindow: 8192,
    defaultMaxTokens: 1024,
    defaultThreads: 4,
    tier: 'balanced',
    category: 'general',
    promptTemplate: 'gemma',
    license: 'Apache 2.0',
    description: 'Google compact model with strong reasoning for its size.',
    strengths: ['8K context', 'Good reasoning', 'Low memory'],
    weaknesses: ['Smaller knowledge base'],
    hallucinationRisk: 'medium',
    fileName: 'gemma2-2b-q4.gguf',
    bundled: false,
    rank: 2,
  },
  {
    id: 'qwen2.5-3b-q4',
    name: 'Qwen 2.5 3B',
    family: 'Qwen',
    parameters: '3B',
    quantization: 'Q4_K_M',
    sizeGB: 2.0,
    minRAMGB: 4,
    contextWindow: 4096,
    defaultMaxTokens: 1024,
    defaultThreads: 4,
    tier: 'balanced',
    category: 'general',
    promptTemplate: 'chatml',
    license: 'Apache 2.0',
    description: 'Strong multilingual and coding capabilities.',
    strengths: ['Multilingual', 'Coding', 'Math'],
    weaknesses: ['Slightly slower than Phi'],
    hallucinationRisk: 'low',
    fileName: 'qwen2.5-3b-q4.gguf',
    bundled: false,
    rank: 3,
  },
  {
    id: 'mistral-7b-q4',
    name: 'Mistral 7B v0.3',
    family: 'Mistral',
    parameters: '7B',
    quantization: 'Q4_K_M',
    sizeGB: 4.1,
    minRAMGB: 8,
    contextWindow: 8192,
    defaultMaxTokens: 2048,
    defaultThreads: 4,
    tier: 'performance',
    category: 'general',
    promptTemplate: 'mistral',
    license: 'Apache 2.0',
    description: 'Top-tier general model. Needs 8GB+ RAM.',
    strengths: ['High accuracy', 'Long context', 'Low hallucination'],
    weaknesses: ['Large size', 'Slower on low-end devices'],
    hallucinationRisk: 'low',
    fileName: 'mistral-7b-q4.gguf',
    bundled: false,
    rank: 4,
  },
  {
    id: 'llama3.2-3b-q4',
    name: 'Llama 3.2 3B',
    family: 'Llama',
    parameters: '3B',
    quantization: 'Q4_K_M',
    sizeGB: 2.0,
    minRAMGB: 4,
    contextWindow: 8192,
    defaultMaxTokens: 1024,
    defaultThreads: 4,
    tier: 'balanced',
    category: 'general',
    promptTemplate: 'llama2',
    license: 'Llama 3.2',
    description: 'Meta compact model optimized for on-device deployment.',
    strengths: ['Mobile optimized', 'Long context', 'Strong chat'],
    weaknesses: ['Llama license restrictions'],
    hallucinationRisk: 'medium',
    fileName: 'llama3.2-3b-q4.gguf',
    bundled: false,
    rank: 5,
  },
  {
    id: 'llama3.2-1b-q8',
    name: 'Llama 3.2 1B',
    family: 'Llama',
    parameters: '1B',
    quantization: 'Q8_0',
    sizeGB: 1.3,
    minRAMGB: 3,
    contextWindow: 8192,
    defaultMaxTokens: 512,
    defaultThreads: 4,
    tier: 'lightweight',
    category: 'chat',
    promptTemplate: 'llama2',
    license: 'Llama 3.2',
    description: 'Ultra-fast 1B model for quick chat on low-end devices.',
    strengths: ['Very fast', 'Low memory', 'Long context'],
    weaknesses: ['Lower accuracy', 'More hallucination'],
    hallucinationRisk: 'high',
    fileName: 'llama3.2-1b-q8.gguf',
    bundled: false,
    rank: 6,
  },
  {
    id: 'tinyllama-1.1b-q4',
    name: 'TinyLlama 1.1B',
    family: 'TinyLlama',
    parameters: '1.1B',
    quantization: 'Q4_K_M',
    sizeGB: 0.6,
    minRAMGB: 2,
    contextWindow: 2048,
    defaultMaxTokens: 512,
    defaultThreads: 4,
    tier: 'lightweight',
    category: 'chat',
    promptTemplate: 'chatml',
    license: 'Apache 2.0',
    description: 'Smallest practical model. Runs on any device.',
    strengths: ['Tiny footprint', 'Very fast', 'Any device'],
    weaknesses: ['Low accuracy', 'High hallucination', 'Short context'],
    hallucinationRisk: 'high',
    fileName: 'tinyllama-1.1b-q4.gguf',
    bundled: true,
    rank: 7,
  },
  {
    id: 'stablelm-zephyr-3b-q4',
    name: 'StableLM Zephyr 3B',
    family: 'StableLM',
    parameters: '3B',
    quantization: 'Q4_K_M',
    sizeGB: 1.8,
    minRAMGB: 4,
    contextWindow: 4096,
    defaultMaxTokens: 1024,
    defaultThreads: 4,
    tier: 'balanced',
    category: 'chat',
    promptTemplate: 'zephyr',
    license: 'StabilityAI',
    description: 'Excellent conversational model with safety alignment.',
    strengths: ['Natural chat', 'Safety aligned', 'Good tone'],
    weaknesses: ['Weaker at coding', 'Limited reasoning'],
    hallucinationRisk: 'medium',
    fileName: 'stablelm-zephyr-3b-q4.gguf',
    bundled: false,
    rank: 8,
  },
  {
    id: 'deepseek-coder-1.3b-q4',
    name: 'DeepSeek Coder 1.3B',
    family: 'DeepSeek',
    parameters: '1.3B',
    quantization: 'Q4_K_M',
    sizeGB: 0.8,
    minRAMGB: 2,
    contextWindow: 4096,
    defaultMaxTokens: 1024,
    defaultThreads: 4,
    tier: 'lightweight',
    category: 'coding',
    promptTemplate: 'alpaca',
    license: 'MIT',
    description: 'Specialized code generation model, lightweight.',
    strengths: ['Code generation', 'Fast', 'Small footprint'],
    weaknesses: ['Weak at general chat', 'Code-focused only'],
    hallucinationRisk: 'medium',
    fileName: 'deepseek-coder-1.3b-q4.gguf',
    bundled: false,
    rank: 9,
  },
  {
    id: 'phi3-mini-128k-q4',
    name: 'Phi-3 Mini 128K',
    family: 'Phi',
    parameters: '3.8B',
    quantization: 'Q4_K_M',
    sizeGB: 2.3,
    minRAMGB: 6,
    contextWindow: 8192,
    defaultMaxTokens: 2048,
    defaultThreads: 4,
    tier: 'performance',
    category: 'reasoning',
    promptTemplate: 'phi3',
    license: 'MIT',
    description: 'Extended context Phi-3 for long document analysis.',
    strengths: ['Long context', 'Strong reasoning', 'Document analysis'],
    weaknesses: ['More RAM needed for full context'],
    hallucinationRisk: 'low',
    fileName: 'phi3-mini-128k-q4.gguf',
    bundled: false,
    rank: 10,
  },
];

export interface ModelConfig {
  modelPath: string;
  contextSize: number;
  threads: number;
  maxTokens: number;
  selectedModelId: string | null;
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
    modelPath: '',
    contextSize: 2048,
    threads: 4,
    maxTokens: 512,
    selectedModelId: 'tinyllama-1.1b-q4',
  },
  voiceEnabled: true,
  systemPrompt:
    'You are a fast, helpful AI assistant. Use project memory and retrieved sources when they are provided. If sources are missing or weak, say that clearly instead of inventing details. Keep answers short and actionable.',
  maxHistoryMessages: 20,
  retrievalTopK: 4,
  webAccessEnabled: true,
  theme: 'dark',
};
