import {MMKV} from 'react-native-mmkv';
import type {
  ChatMessage,
  AppSettings,
  ProjectMemory,
  KnowledgeItem,
  KnowledgeChunk,
} from '../types';
import {DEFAULT_SETTINGS} from '../types';

const storage = new MMKV({
  id: 'localai-storage',
  encryptionKey: 'localai-enc-key-v1',
});

const KEYS = {
  CHAT_HISTORY: 'chat_history',
  SETTINGS: 'app_settings',
  ONBOARDED: 'onboarded',
  PROJECTS: 'projects',
  ACTIVE_PROJECT_ID: 'active_project_id',
  KNOWLEDGE_ITEMS: 'knowledge_items',
  KNOWLEDGE_CHUNKS: 'knowledge_chunks',
} as const;

class StorageService {
  private readJson<T>(key: string, fallback: T): T {
    const raw = storage.getString(key);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  // Chat History
  getChatHistory(): ChatMessage[] {
    return this.readJson(KEYS.CHAT_HISTORY, []);
  }

  saveChatHistory(messages: ChatMessage[]): void {
    storage.set(KEYS.CHAT_HISTORY, JSON.stringify(messages));
  }

  addMessage(message: ChatMessage): ChatMessage[] {
    const history = this.getChatHistory();
    history.push(message);
    // Keep only last N messages
    const settings = this.getSettings();
    const trimmed = history.slice(-settings.maxHistoryMessages * 2);
    this.saveChatHistory(trimmed);
    return trimmed;
  }

  clearChatHistory(): void {
    storage.delete(KEYS.CHAT_HISTORY);
  }

  // Settings
  getSettings(): AppSettings {
    const stored = this.readJson<Partial<AppSettings>>(KEYS.SETTINGS, {});
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      modelConfig: {
        ...DEFAULT_SETTINGS.modelConfig,
        ...stored.modelConfig,
      },
    };
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const merged = {...current, ...settings};
    storage.set(KEYS.SETTINGS, JSON.stringify(merged));
  }

  // Onboarding
  isOnboarded(): boolean {
    return storage.getBoolean(KEYS.ONBOARDED) ?? false;
  }

  setOnboarded(): void {
    storage.set(KEYS.ONBOARDED, true);
  }

  // Projects
  getProjects(): ProjectMemory[] {
    return this.readJson(KEYS.PROJECTS, []);
  }

  saveProjects(projects: ProjectMemory[]): void {
    storage.set(KEYS.PROJECTS, JSON.stringify(projects));
  }

  getActiveProjectId(): string | null {
    return storage.getString(KEYS.ACTIVE_PROJECT_ID) ?? null;
  }

  setActiveProjectId(projectId: string | null): void {
    if (!projectId) {
      storage.delete(KEYS.ACTIVE_PROJECT_ID);
      return;
    }

    storage.set(KEYS.ACTIVE_PROJECT_ID, projectId);
  }

  getKnowledgeItems(): KnowledgeItem[] {
    return this.readJson(KEYS.KNOWLEDGE_ITEMS, []);
  }

  saveKnowledgeItems(items: KnowledgeItem[]): void {
    storage.set(KEYS.KNOWLEDGE_ITEMS, JSON.stringify(items));
  }

  getKnowledgeChunks(): KnowledgeChunk[] {
    return this.readJson(KEYS.KNOWLEDGE_CHUNKS, []);
  }

  saveKnowledgeChunks(chunks: KnowledgeChunk[]): void {
    storage.set(KEYS.KNOWLEDGE_CHUNKS, JSON.stringify(chunks));
  }
}

export const storageService = new StorageService();
export default storageService;
