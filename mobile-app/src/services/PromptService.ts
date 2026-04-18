import type {ChatMessage, KnowledgeCitation, ProjectMemory, ModelCatalogEntry} from '../types';

interface PromptContextOptions {
  project?: ProjectMemory | null;
  citations?: KnowledgeCitation[];
}

const HALLUCINATION_GUARD =
  'IMPORTANT: Only answer based on what you actually know. If you are uncertain, say "I\'m not confident about this." Never fabricate citations, URLs, dates, statistics, or quotes. If context is provided, base your answer on it.';

class PromptService {
  private systemPrompt: string;
  private promptTemplate: ModelCatalogEntry['promptTemplate'] = 'chatml';

  constructor() {
    this.systemPrompt =
      'You are a fast, helpful offline AI assistant. Keep answers short and actionable. Avoid unnecessary explanation.';
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  setPromptTemplate(template: ModelCatalogEntry['promptTemplate']): void {
    this.promptTemplate = template;
  }

  buildPrompt(
    messages: ChatMessage[],
    userMessage: string,
    options: PromptContextOptions = {},
  ): string {
    const systemBlock = this.buildSystemBlock(options);
    const contextMessages = messages.slice(-10);

    switch (this.promptTemplate) {
      case 'phi3':
        return this.buildPhi3Prompt(systemBlock, contextMessages, userMessage);
      case 'llama2':
        return this.buildLlama2Prompt(systemBlock, contextMessages, userMessage);
      case 'gemma':
        return this.buildGemmaPrompt(systemBlock, contextMessages, userMessage);
      case 'mistral':
        return this.buildMistralPrompt(systemBlock, contextMessages, userMessage);
      case 'alpaca':
        return this.buildAlpacaPrompt(systemBlock, contextMessages, userMessage);
      case 'zephyr':
        return this.buildZephyrPrompt(systemBlock, contextMessages, userMessage);
      case 'chatml':
      default:
        return this.buildChatMLPrompt(systemBlock, contextMessages, userMessage);
    }
  }

  private buildSystemBlock(options: PromptContextOptions): string {
    let block = `${this.systemPrompt}\n${HALLUCINATION_GUARD}`;

    if (options.project) {
      block += `\nCurrent project: ${options.project.name}`;
      if (options.project.description) {
        block += `\nProject notes: ${options.project.description}`;
      }
    }

    if (options.citations && options.citations.length > 0) {
      block += '\nRetrieved context:\n';
      for (const citation of options.citations) {
        block += `- ${citation.title}: ${citation.excerpt}\n`;
      }
      block +=
        'Use retrieved context when relevant. If the retrieved context is incomplete, say that clearly.';
    }

    return block;
  }

  private buildChatMLPrompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `<|system|>\n${system}\n`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `<|user|>\n${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<|assistant|>\n${msg.content}\n`;
      }
    }
    prompt += `<|user|>\n${user}\n<|assistant|>\n`;
    return prompt;
  }

  private buildPhi3Prompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `<|system|>\n${system}<|end|>\n`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `<|user|>\n${msg.content}<|end|>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<|assistant|>\n${msg.content}<|end|>\n`;
      }
    }
    prompt += `<|user|>\n${user}<|end|>\n<|assistant|>\n`;
    return prompt;
  }

  private buildLlama2Prompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${system}<|eot_id|>`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `<|start_header_id|>user<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
      } else if (msg.role === 'assistant') {
        prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
      }
    }
    prompt += `<|start_header_id|>user<|end_header_id|>\n\n${user}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    return prompt;
  }

  private buildGemmaPrompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `<start_of_turn>user\n${system}\n`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `${msg.content}<end_of_turn>\n<start_of_turn>model\n`;
      } else if (msg.role === 'assistant') {
        prompt += `${msg.content}<end_of_turn>\n<start_of_turn>user\n`;
      }
    }
    prompt += `${user}<end_of_turn>\n<start_of_turn>model\n`;
    return prompt;
  }

  private buildMistralPrompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `[INST] ${system}\n`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `${msg.content} [/INST]`;
      } else if (msg.role === 'assistant') {
        prompt += `${msg.content}</s>[INST] `;
      }
    }
    prompt += `${user} [/INST]`;
    return prompt;
  }

  private buildAlpacaPrompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `### System:\n${system}\n\n`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `### Instruction:\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `### Response:\n${msg.content}\n\n`;
      }
    }
    prompt += `### Instruction:\n${user}\n\n### Response:\n`;
    return prompt;
  }

  private buildZephyrPrompt(system: string, history: ChatMessage[], user: string): string {
    let prompt = `<|system|>\n${system}</s>\n`;
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `<|user|>\n${msg.content}</s>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<|assistant|>\n${msg.content}</s>\n`;
      }
    }
    prompt += `<|user|>\n${user}</s>\n<|assistant|>\n`;
    return prompt;
  }

  /**
   * Detect potential hallucination patterns in model output.
   * Returns a confidence score 0-1 (0 = likely hallucinated, 1 = likely factual).
   */
  detectHallucination(response: string, context?: string): {score: number; flags: string[]} {
    const flags: string[] = [];
    let score = 1.0;

    // Check for fabricated URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = response.match(urlPattern) || [];
    if (urls.length > 0) {
      flags.push('Contains URLs (may be fabricated)');
      score -= 0.15 * urls.length;
    }

    // Check for overly specific statistics without context
    const statsPattern = /\d{1,3}(\.\d+)?%|\$[\d,]+(\.\d{2})?|\d{4,} (people|users|studies|reports)/g;
    if (statsPattern.test(response) && !context) {
      flags.push('Contains specific statistics without source context');
      score -= 0.2;
    }

    // Check for fabricated citations/references
    const citationPattern = /according to [A-Z][a-z]+ (et al\.|& [A-Z])|published in .+ journal/gi;
    if (citationPattern.test(response)) {
      flags.push('Contains academic-style citations (likely fabricated)');
      score -= 0.3;
    }

    // Check for excessive confidence markers
    const confidencePattern = /definitely|absolutely|certainly|without a doubt|100%/gi;
    const confidenceMatches = response.match(confidencePattern) || [];
    if (confidenceMatches.length > 2) {
      flags.push('Excessive confidence language');
      score -= 0.1 * confidenceMatches.length;
    }

    // Check for repetitive/looping text (degeneration)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    if (sentences.length > 3 && uniqueSentences.size < sentences.length * 0.6) {
      flags.push('Repetitive/looping output detected');
      score -= 0.4;
    }

    // Check for contradictions within the same response
    if (
      (response.includes(' is ') && response.includes(' is not ')) ||
      (response.includes(' can ') && response.includes(' cannot '))
    ) {
      flags.push('Potential self-contradiction');
      score -= 0.15;
    }

    return {score: Math.max(0, Math.min(1, score)), flags};
  }

  /**
   * Post-process response: trim incomplete sentences, handle repetition.
   */
  postProcessResponse(response: string): string {
    let cleaned = response.trim();

    // Remove trailing incomplete sentence (no ending punctuation)
    const lastPunctuation = Math.max(
      cleaned.lastIndexOf('.'),
      cleaned.lastIndexOf('!'),
      cleaned.lastIndexOf('?'),
    );
    if (lastPunctuation > cleaned.length * 0.5 && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
      cleaned = cleaned.substring(0, lastPunctuation + 1);
    }

    // Remove repeated paragraphs
    const paragraphs = cleaned.split('\n\n');
    const seen = new Set<string>();
    const deduplicated = paragraphs.filter(p => {
      const key = p.trim().toLowerCase();
      if (key.length < 5) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    cleaned = deduplicated.join('\n\n');

    // Remove common model artifacts
    cleaned = cleaned.replace(/<\|?(end|eot_id|end_of_turn|assistant|user|system)\|?>/g, '');
    cleaned = cleaned.replace(/\[\/INST\]/g, '');
    cleaned = cleaned.replace(/### (Instruction|Response|System):/g, '');

    return cleaned.trim();
  }

  compressContext(messages: ChatMessage[], maxMessages: number = 10): ChatMessage[] {
    if (messages.length <= maxMessages) {
      return messages;
    }
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
