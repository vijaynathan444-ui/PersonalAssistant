import promptService from '../../services/PromptService';
import type {ChatMessage} from '../../types';

describe('PromptService', () => {
  beforeEach(() => {
    promptService.setSystemPrompt(
      'You are a fast, helpful offline AI assistant.',
    );
    promptService.setPromptTemplate('chatml');
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

    it('should include project and retrieved citations when provided', () => {
      const prompt = promptService.buildPrompt([], 'Summarize it', {
        project: {
          id: 'project_1',
          name: 'Roadmap',
          description: 'Quarterly goals',
          createdAt: 1,
          updatedAt: 1,
        },
        citations: [
          {
            itemId: 'item_1',
            title: 'Goals.md',
            sourceType: 'file',
            fileType: 'md',
            excerpt: 'Launch Android release in Q2.',
            score: 8,
          },
        ],
      });

      expect(prompt).toContain('Current project: Roadmap');
      expect(prompt).toContain('Goals.md: Launch Android release in Q2.');
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

  describe('prompt templates', () => {
    it('should build phi3 template', () => {
      promptService.setPromptTemplate('phi3');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('<|system|>');
      expect(prompt).toContain('<|end|>');
      expect(prompt).toContain('<|user|>');
      expect(prompt).toContain('Hello');
    });

    it('should build llama2 template', () => {
      promptService.setPromptTemplate('llama2');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('<|begin_of_text|>');
      expect(prompt).toContain('<|start_header_id|>');
      expect(prompt).toContain('Hello');
    });

    it('should build gemma template', () => {
      promptService.setPromptTemplate('gemma');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('<start_of_turn>');
      expect(prompt).toContain('<end_of_turn>');
    });

    it('should build mistral template', () => {
      promptService.setPromptTemplate('mistral');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('[INST]');
      expect(prompt).toContain('[/INST]');
    });

    it('should build alpaca template', () => {
      promptService.setPromptTemplate('alpaca');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('### Instruction:');
      expect(prompt).toContain('### Response:');
    });

    it('should build zephyr template', () => {
      promptService.setPromptTemplate('zephyr');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('<|system|>');
      expect(prompt).toContain('</s>');
    });

    it('should default to chatml template', () => {
      promptService.setPromptTemplate('chatml');
      const prompt = promptService.buildPrompt([], 'Hello');
      expect(prompt).toContain('<|system|>');
      expect(prompt).toContain('<|user|>');
      expect(prompt).toContain('<|assistant|>');
    });
  });

  describe('detectHallucination', () => {
    it('should return high score for clean response', () => {
      const result = promptService.detectHallucination('This is a simple factual answer.');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.flags).toHaveLength(0);
    });

    it('should flag fabricated URLs', () => {
      const result = promptService.detectHallucination('Check out https://example.com/fake-article for details.');
      expect(result.flags).toContain('Contains URLs (may be fabricated)');
      expect(result.score).toBeLessThan(1.0);
    });

    it('should flag academic-style citations', () => {
      const result = promptService.detectHallucination('According to Smith et al. this is true.');
      expect(result.flags.some(f => f.includes('citations'))).toBe(true);
    });

    it('should flag repetitive output', () => {
      const repeated = 'This is a test sentence. This is a test sentence. This is a test sentence. This is a test sentence.';
      const result = promptService.detectHallucination(repeated);
      expect(result.flags.some(f => f.includes('Repetitive'))).toBe(true);
    });

    it('should clamp score between 0 and 1', () => {
      const badResponse = 'According to Smith et al. definitely absolutely certainly 100% https://fake.com https://fake2.com ' +
        'This repeats. This repeats. This repeats. This repeats.';
      const result = promptService.detectHallucination(badResponse);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('postProcessResponse', () => {
    it('should trim whitespace', () => {
      expect(promptService.postProcessResponse('  Hello world  ')).toBe('Hello world');
    });

    it('should remove model artifacts', () => {
      const response = 'Hello world<|end|><|eot_id|>[/INST]';
      const cleaned = promptService.postProcessResponse(response);
      expect(cleaned).not.toContain('<|end|>');
      expect(cleaned).not.toContain('<|eot_id|>');
      expect(cleaned).not.toContain('[/INST]');
    });

    it('should remove duplicate paragraphs', () => {
      const response = 'First paragraph.\n\nSecond paragraph.\n\nSecond paragraph.';
      const cleaned = promptService.postProcessResponse(response);
      expect(cleaned.split('Second paragraph').length - 1).toBe(1);
    });
  });
});
