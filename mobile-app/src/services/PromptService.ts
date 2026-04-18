import type {ChatMessage, KnowledgeCitation, ProjectMemory} from '../types';

interface PromptContextOptions {
  project?: ProjectMemory | null;
  citations?: KnowledgeCitation[];
}

class PromptService {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt =
      'You are a fast, helpful offline AI assistant. Keep answers short and actionable. Avoid unnecessary explanation.';
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  buildPrompt(
    messages: ChatMessage[],
    userMessage: string,
    options: PromptContextOptions = {},
  ): string {
    // Build chat completion format compatible with most GGUF models
    let prompt = `<|system|>\n${this.systemPrompt}\n`;

    if (options.project) {
      prompt += `Current project: ${options.project.name}\n`;
      if (options.project.description) {
        prompt += `Project notes: ${options.project.description}\n`;
      }
    }

    if (options.citations && options.citations.length > 0) {
      prompt += 'Retrieved context:\n';
      for (const citation of options.citations) {
        prompt += `- ${citation.title}: ${citation.excerpt}\n`;
      }
      prompt +=
        'Use retrieved context when relevant. If the retrieved context is incomplete, say that clearly.\n';
    }

    // Include recent context messages
    const contextMessages = messages.slice(-10); // Last 10 messages for context
    for (const msg of contextMessages) {
      if (msg.role === 'user') {
        prompt += `<|user|>\n${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<|assistant|>\n${msg.content}\n`;
      }
    }

    // Add current user message
    prompt += `<|user|>\n${userMessage}\n<|assistant|>\n`;

    return prompt;
  }

  compressContext(messages: ChatMessage[], maxMessages: number = 10): ChatMessage[] {
    if (messages.length <= maxMessages) {
      return messages;
    }
    // Keep the system messages and most recent messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');
    const recent = nonSystemMessages.slice(-maxMessages);
    return [...systemMessages, ...recent];
  }

  estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedMax = maxTokens * 4;
    if (text.length <= estimatedMax) return text;
    return text.slice(0, estimatedMax);
  }
}

export const promptService = new PromptService();
export default promptService;
