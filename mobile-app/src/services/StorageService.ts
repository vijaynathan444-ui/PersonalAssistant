import {MMKV} from 'react-native-mmkv';
import type {
  ChatMessage,
  ChatSession,
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
  CONVERSATIONS: 'conversations',
  ACTIVE_CONVERSATION_ID: 'active_conversation_id',
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

  // Conversations
  getConversations(): ChatSession[] {
    return this.readJson(KEYS.CONVERSATIONS, []);
  }

  saveConversations(conversations: ChatSession[]): void {
    storage.set(KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  getActiveConversationId(): string | null {
    return storage.getString(KEYS.ACTIVE_CONVERSATION_ID) ?? null;
  }

  setActiveConversationId(id: string | null): void {
    if (!id) {
      storage.delete(KEYS.ACTIVE_CONVERSATION_ID);
      return;
    }
    storage.set(KEYS.ACTIVE_CONVERSATION_ID, id);
  }

  getConversationMessages(conversationId: string): ChatMessage[] {
    return this.readJson(`conv_messages_${conversationId}`, []);
  }

  saveConversationMessages(conversationId: string, messages: ChatMessage[]): void {
    storage.set(`conv_messages_${conversationId}`, JSON.stringify(messages));
  }

  deleteConversationMessages(conversationId: string): void {
    storage.delete(`conv_messages_${conversationId}`);
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
