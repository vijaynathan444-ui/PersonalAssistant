import promptService from '../../services/PromptService';
import type {ChatMessage} from '../../types';

describe('PromptService', () => {
  beforeEach(() => {
    promptService.setSystemPrompt(
      'You are a fast, helpful offline AI assistant.',
    );
  });

  describe('buildPrompt', () => {
    it('should build a prompt with system message and user input', () => {
      const messages: ChatMessage[] = [];
      const prompt = promptService.buildPrompt(messages, 'Hello');

      expect(prompt).toContain('<|system|>');
      expect(prompt).toContain('You are a fast, helpful offline AI assistant.');
      expect(prompt).toContain('<|user|>');
      expect(prompt).toContain('Hello');
      expect(prompt).toContain('<|assistant|>');
    });

    it('should include conversation history', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What is AI?',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'AI is artificial intelligence.',
          timestamp: Date.now(),
        },
      ];

      const prompt = promptService.buildPrompt(messages, 'Tell me more');

      expect(prompt).toContain('What is AI?');
      expect(prompt).toContain('AI is artificial intelligence.');
      expect(prompt).toContain('Tell me more');
    });

    it('should limit context to last 10 messages', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 20; i++) {
        messages.push({
          id: `msg_${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: Date.now(),
        });
      }

      const prompt = promptService.buildPrompt(messages, 'New question');

      // Should NOT contain early messages
      expect(prompt).not.toContain('Message 0');
      expect(prompt).not.toContain('Message 5');

      // Should contain recent messages
      expect(prompt).toContain('Message 19');
      expect(prompt).toContain('Message 15');
    });
  });

  describe('compressContext', () => {
    it('should return all messages if under limit', () => {
      const messages: ChatMessage[] = [
        {id: '1', role: 'user', content: 'Hi', timestamp: Date.now()},
        {id: '2', role: 'assistant', content: 'Hello', timestamp: Date.now()},
      ];

      const result = promptService.compressContext(messages, 10);
      expect(result).toHaveLength(2);
    });

    it('should trim to max messages keeping recent ones', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 20; i++) {
        messages.push({
          id: `${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now(),
        });
      }

      const result = promptService.compressContext(messages, 5);
      expect(result).toHaveLength(5);
      expect(result[result.length - 1].content).toBe('Message 19');
    });

    it('should preserve system messages during compression', () => {
      const messages: ChatMessage[] = [
        {id: 'sys', role: 'system', content: 'System', timestamp: Date.now()},
        ...Array.from({length: 15}, (_, i) => ({
          id: `${i}`,
          role: 'user' as const,
          content: `Message ${i}`,
          timestamp: Date.now(),
        })),
      ];

      const result = promptService.compressContext(messages, 5);
      expect(result.find(m => m.role === 'system')).toBeDefined();
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate tokens for English text', () => {
      const text = 'Hello, how are you doing today?';
      const estimate = promptService.estimateTokenCount(text);
      // ~30 chars / 4 = ~8 tokens
      expect(estimate).toBeGreaterThan(5);
      expect(estimate).toBeLessThan(15);
    });

    it('should return 0 for empty string', () => {
      expect(promptService.estimateTokenCount('')).toBe(0);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(promptService.truncateToTokenLimit(text, 100)).toBe(text);
    });

    it('should truncate long text', () => {
      const text = 'A'.repeat(10000);
      const result = promptService.truncateToTokenLimit(text, 100);
      expect(result.length).toBe(400); // 100 tokens * 4 chars
    });
  });

  describe('setSystemPrompt', () => {
    it('should update the system prompt in subsequent builds', () => {
      promptService.setSystemPrompt('Custom system prompt');
      const prompt = promptService.buildPrompt([], 'Test');
      expect(prompt).toContain('Custom system prompt');
    });
  });
});
