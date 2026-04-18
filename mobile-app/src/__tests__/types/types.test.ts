import {DEFAULT_SETTINGS, MODEL_CATALOG} from '../../types';
import type {ChatMessage, AppSettings, ModelCatalogEntry} from '../../types';

describe('Type Definitions', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have valid model config', () => {
      expect(DEFAULT_SETTINGS.modelConfig).toBeDefined();
      expect(DEFAULT_SETTINGS.modelConfig.contextSize).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.modelConfig.threads).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.modelConfig.maxTokens).toBeGreaterThan(0);
      expect(typeof DEFAULT_SETTINGS.modelConfig.modelPath).toBe('string');
    });

    it('should have selectedModelId set to bundled model by default', () => {
      expect(DEFAULT_SETTINGS.modelConfig.selectedModelId).toBe('tinyllama-1.1b-q4');
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

  describe('MODEL_CATALOG', () => {
    it('should have at least 10 models', () => {
      expect(MODEL_CATALOG.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique IDs', () => {
      const ids = MODEL_CATALOG.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have unique ranks from 1 to N', () => {
      const ranks = MODEL_CATALOG.map(m => m.rank).sort((a, b) => a - b);
      ranks.forEach((rank, i) => expect(rank).toBe(i + 1));
    });

    it('should have valid tier values', () => {
      const validTiers = ['lightweight', 'balanced', 'performance', 'premium'];
      MODEL_CATALOG.forEach(m => expect(validTiers).toContain(m.tier));
    });

    it('should have valid hallucination risk values', () => {
      MODEL_CATALOG.forEach(m =>
        expect(['low', 'medium', 'high']).toContain(m.hallucinationRisk),
      );
    });

    it('each model should have fileName ending in .gguf', () => {
      MODEL_CATALOG.forEach(m => expect(m.fileName).toMatch(/\.gguf$/));
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
