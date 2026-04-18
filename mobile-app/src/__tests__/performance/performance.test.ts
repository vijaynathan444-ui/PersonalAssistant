import promptService from '../../services/PromptService';
import type {ChatMessage} from '../../types';

describe('Performance Tests', () => {
  describe('Prompt Generation Performance', () => {
    it('should build prompt within 10ms for typical conversation', () => {
      const messages: ChatMessage[] = Array.from({length: 20}, (_, i) => ({
        id: `${i}`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `This is message number ${i} with some content.`,
        timestamp: Date.now(),
      }));

      const start = performance.now();
      promptService.buildPrompt(messages, 'New question here');
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it('should compress context within 5ms for large history', () => {
      const messages: ChatMessage[] = Array.from({length: 100}, (_, i) => ({
        id: `${i}`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}: ${'Lorem ipsum '.repeat(20)}`,
        timestamp: Date.now(),
      }));

      const start = performance.now();
      promptService.compressContext(messages, 10);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });

    it('should estimate tokens within 1ms', () => {
      const longText = 'A'.repeat(50000);

      const start = performance.now();
      promptService.estimateTokenCount(longText);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1);
    });
  });

  describe('Memory Handling', () => {
    it('should handle prompt with maximum context messages', () => {
      const messages: ChatMessage[] = Array.from({length: 1000}, (_, i) => ({
        id: `${i}`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}: ${'content '.repeat(50)}`,
        timestamp: Date.now(),
      }));

      // Should not throw or hang
      const prompt = promptService.buildPrompt(messages, 'Test');
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should truncate very long input correctly', () => {
      const longText = 'X'.repeat(100000);
      const result = promptService.truncateToTokenLimit(longText, 1024);
      expect(result.length).toBe(4096); // 1024 * 4
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle empty messages array', () => {
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('Hello');
    });

    it('should handle messages with special characters', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello <script>alert("xss")</script>',
          timestamp: Date.now(),
        },
      ];

      const prompt = promptService.buildPrompt(messages, 'Test');
      expect(prompt).toContain('<script>');
      // Content passes through - sanitization happens at native layer
    });

    it('should handle unicode content', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: '你好世界 🌍 مرحبا',
          timestamp: Date.now(),
        },
      ];

      const prompt = promptService.buildPrompt(messages, '🤖 Test');
      expect(prompt).toContain('你好世界');
      expect(prompt).toContain('🤖');
    });
  });
});
