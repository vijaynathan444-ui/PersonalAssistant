import {MMKV} from 'react-native-mmkv';
import type {ChatMessage, AppSettings} from '../types';
import {DEFAULT_SETTINGS} from '../types';

const storage = new MMKV({
  id: 'localai-storage',
  encryptionKey: 'localai-enc-key-v1',
});

const KEYS = {
  CHAT_HISTORY: 'chat_history',
  SETTINGS: 'app_settings',
  ONBOARDED: 'onboarded',
} as const;

class StorageService {
  // Chat History
  getChatHistory(): ChatMessage[] {
    const raw = storage.getString(KEYS.CHAT_HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ChatMessage[];
    } catch {
      return [];
    }
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
    const raw = storage.getString(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return {...DEFAULT_SETTINGS, ...JSON.parse(raw)};
    } catch {
      return DEFAULT_SETTINGS;
    }
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
}

export const storageService = new StorageService();
export default storageService;
