import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export interface LLMProviderOptions {
  geminiKey: string;
  geminiModel?: string;
  timeoutMs?: number;
}

export interface GenerateReplyOptions {
  userMessage: string;
  systemPrompt: string;
  companionId?: string;
  userNickname?: string;
  temperature?: number;
}

export class LLMProviderManager {
  private client: GoogleGenAI | null = null;
  private model: string;
  private timeoutMs: number;
  private circuitTripped: boolean = false;
  private tripTimestamp: number = 0;

  constructor(options: LLMProviderOptions) {
    const key = options.geminiKey || process.env.GEMINI_API_KEY || '';
    if (key) {
      try {
        this.client = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (e) {
        console.warn('[LLMProviderManager] Failed to initialize GoogleGenAI client:', e);
      }
    }
    // Default to gemini-3.5-flash as the standard fast and available model
    this.model = options.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    this.timeoutMs = options.timeoutMs || 25000;
  }

  public getClient(): GoogleGenAI | null {
    return this.client;
  }

  public getModel(): string {
    return this.model;
  }

  public isCircuitTripped(): boolean {
    if (!this.circuitTripped) return false;
    // Auto-reset circuit breaker after 2 minutes
    if (Date.now() - this.tripTimestamp > 120000) {
      this.circuitTripped = false;
      return false;
    }
    return true;
  }

  public tripCircuitBreaker(): void {
    this.circuitTripped = true;
    this.tripTimestamp = Date.now();
  }

  public async generateReply(
    options: GenerateReplyOptions,
    fallbackFn: () => string
  ): Promise<{ reply: string; providerUsed: string }> {
    if (!this.client || this.isCircuitTripped()) {
      return {
        reply: fallbackFn(),
        providerUsed: 'contextual_fallback',
      };
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: options.userMessage,
        config: {
          systemInstruction: options.systemPrompt,
          temperature: options.temperature ?? 0.8,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const replyText = response.text?.trim();
      if (replyText) {
        return {
          reply: replyText,
          providerUsed: 'gemini',
        };
      }
    } catch (err: any) {
      if (isGemini403Error(err)) {
        this.tripCircuitBreaker();
        console.warn('[LLMProviderManager] Gemini 403 error, tripped circuit breaker');
      } else {
        console.warn('[LLMProviderManager] Gemini generation error, using fallback:', err?.message || err);
      }
    }

    return {
      reply: fallbackFn(),
      providerUsed: 'contextual_fallback',
    };
  }
}

export function sanitizeLog(msg: string): string {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/key=[0-9A-Za-z-_]+/gi, 'key=[REDACTED]')
    .replace(/[\r\n]+/g, ' ');
}

export function isGemini403Error(err: any): boolean {
  if (!err) return false;
  const str = String(err.message || err.status || err.code || err);
  return (
    str.includes('403') ||
    str.includes('PERMISSION_DENIED') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('API_KEY_INVALID')
  );
}
