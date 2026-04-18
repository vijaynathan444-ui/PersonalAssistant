import {DEFAULT_SETTINGS} from '../../types';
import type {ChatMessage, AppSettings} from '../../types';

describe('Type Definitions', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have valid model config', () => {
      expect(DEFAULT_SETTINGS.modelConfig).toBeDefined();
      expect(DEFAULT_SETTINGS.modelConfig.contextSize).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.modelConfig.threads).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.modelConfig.maxTokens).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.modelConfig.modelPath).toBeTruthy();
    });

    it('should have voice enabled by default', () => {
      expect(DEFAULT_SETTINGS.voiceEnabled).toBe(true);
    });

    it('should have a non-empty system prompt', () => {
      expect(DEFAULT_SETTINGS.systemPrompt.length).toBeGreaterThan(0);
    });

    it('should have reasonable maxHistoryMessages', () => {
      expect(DEFAULT_SETTINGS.maxHistoryMessages).toBeGreaterThanOrEqual(5);
      expect(DEFAULT_SETTINGS.maxHistoryMessages).toBeLessThanOrEqual(100);
    });
  });

  describe('ChatMessage', () => {
    it('should accept valid message structure', () => {
      const msg: ChatMessage = {
        id: 'test_1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      expect(msg.id).toBe('test_1');
      expect(msg.role).toBe('user');
      expect(msg.content).toBe('Hello');
      expect(msg.timestamp).toBeGreaterThan(0);
    });

    it('should accept all valid roles', () => {
      const roles: ChatMessage['role'][] = ['user', 'assistant', 'system'];
      roles.forEach(role => {
        const msg: ChatMessage = {
          id: '1',
          role,
          content: 'Test',
          timestamp: Date.now(),
        };
        expect(msg.role).toBe(role);
      });
    });
  });
});
