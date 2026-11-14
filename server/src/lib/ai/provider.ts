import type { ZodType } from 'zod';
import { config } from '../../config.js';
import { DEFAULT_AI_TIMEOUT_MS } from '../constants/workout.js';

export class AiProviderError extends Error {
  constructor(message: string, public readonly code = 'AI_PROVIDER_ERROR') {
    super(message);
    this.name = 'AiProviderError';
  }

}

export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiResponseError';
  }
}

export type GenerateOptions = { timeoutMs?: number };
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface AiProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  analyzeImage(prompt: string, imageBytes: Uint8Array, mimeType: ImageMimeType, options?: GenerateOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T>;
}

function withTimeout(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

class GeminiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly visionModel: string,
    private readonly fallbackModel?: string,
  ) {}

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    return this.request([{ text: prompt }], this.model, options);
  }

  async analyzeImage(prompt: string, imageBytes: Uint8Array, mimeType: ImageMimeType, options: GenerateOptions = {}): Promise<string> {
    return this.request([
      { text: prompt },
      { inline_data: { mime_type: mimeType, data: Buffer.from(imageBytes).toString('base64') } },
    ], this.visionModel, options);
  }

  private async request(
    parts: Array<Record<string, string | Record<string, string>>>,
    primaryModel: string,
    options: GenerateOptions,
  ): Promise<string> {
    const models = [primaryModel, this.fallbackModel].filter((model, index, all): model is string => Boolean(model) && all.indexOf(model) === index);
    let lastError: AiProviderError | undefined;
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
            body: JSON.stringify({
              contents: [{ parts }],
              ...(config.AI_THINKING_BUDGET === undefined ? {} : {
                generationConfig: { thinkingConfig: { thinkingBudget: config.AI_THINKING_BUDGET } },
              }),
            }),
            signal: withTimeout(options.timeoutMs ?? config.AI_TIMEOUT_MS ?? DEFAULT_AI_TIMEOUT_MS),
          });
          const body = await response.json().catch(() => null) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            error?: { message?: string };
          };
          if (!response.ok) {
            const code = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503
              ? 'AI_PROVIDER_BUSY'
              : 'AI_PROVIDER_ERROR';
            throw new AiProviderError(body.error?.message ?? 'AI provider request failed.', code);
          }
          const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
          if (!text) throw new AiProviderError('AI provider returned an empty response.');
          return text;
        } catch (error) {
          const providerError = error instanceof AiProviderError
            ? error
            : error instanceof DOMException && error.name === 'TimeoutError'
              ? new AiProviderError('AI provider request timed out.', 'AI_PROVIDER_TIMEOUT')
              : new AiProviderError(error instanceof Error ? error.message : 'AI provider request failed.');
          lastError = providerError;
          if (providerError.code !== 'AI_PROVIDER_BUSY' || attempt === 1) break;
        }
      }
    }
    throw lastError ?? new AiProviderError('AI provider request failed.');
  }

  async generateStructured<T>(prompt: string, schema: ZodType<T>, options?: GenerateOptions): Promise<T> {
    const text = await this.generateText(prompt, options);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AiResponseError('AI provider returned invalid JSON.');
    }
    const result = schema.safeParse(parsed);
    if (!result.success) throw new AiResponseError('AI provider returned an invalid workout plan.');
    return result.data;
  }
}

export class FakeProvider implements AiProvider {
  constructor(private readonly response: string) {}

  async generateText(): Promise<string> {
    return this.response;
  }

  async analyzeImage(_prompt: string, _imageBytes: Uint8Array, _mimeType: ImageMimeType): Promise<string> {
    return this.response;
  }

  async generateStructured<T>(_prompt: string, schema: ZodType<T>): Promise<T> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.response);
    } catch {
      throw new AiResponseError('AI provider returned invalid JSON.');
    }
    const result = schema.safeParse(parsed);
    if (!result.success) throw new AiResponseError('AI provider returned an invalid workout plan.');
    return result.data;
  }
}

export function createAiProvider(): AiProvider {
  if (config.AI_PROVIDER === 'fake') {
    return new FakeProvider('{"name":"Test plan","days":[]}');
  }
  if (!config.AI_API_KEY || !config.AI_MODEL) throw new AiProviderError('AI provider is not configured.');
  return new GeminiProvider(
    config.AI_API_KEY,
    config.AI_MODEL,
    config.AI_VISION_MODEL ?? config.AI_MODEL,
    config.AI_FALLBACK_MODEL,
  );
}
