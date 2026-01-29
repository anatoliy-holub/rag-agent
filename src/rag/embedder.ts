import axios, { type AxiosInstance } from 'axios';
import { config } from '../config.js';

const BASE = config.lmStudio.baseUrl;
const MODEL = config.lmStudio.embeddingModel;

/** LM Studio embeddings API (OpenAI-compatible). */
export interface EmbedderConfig {
  baseUrl?: string;
  model?: string;
}

export class Embedder {
  private client: AxiosInstance;
  private model: string;

  constructor(options: EmbedderConfig = {}) {
    this.model = options.model ?? MODEL;
    this.client = axios.create({
      baseURL: options.baseUrl ?? BASE,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60_000,
    });
  }

  private wrapEmbedError(err: unknown, context: string): Error {
    if (axios.isAxiosError(err) && err.response?.data) {
      const msg =
        typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data
          ? String((err.response.data as { error: unknown }).error)
          : err.response.statusText || 'Bad Request';
      return new Error(`${context}: ${msg}`);
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  /** Embed a single text. */
  async embed(text: string): Promise<number[]> {
    const normalized = text.replace(/\n/g, ' ').trim();
    try {
      const res = await this.client.post<{ data: Array<{ embedding: number[] }> }>(
        '/embeddings',
        { input: [normalized], model: this.model }
      );
      const embedding = res.data?.data?.[0]?.embedding;
      if (!Array.isArray(embedding)) {
        throw new Error('Invalid embeddings response from LM Studio');
      }
      return embedding;
    } catch (err) {
      throw this.wrapEmbedError(err, 'LM Studio embeddings failed');
    }
  }

  /** Embed multiple texts in one request (batch). */
  async embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const normalized = texts.map((t) => t.replace(/\n/g, ' ').trim());
    try {
      const res = await this.client.post<{ data: Array<{ embedding: number[] }> }>(
        '/embeddings',
        { input: normalized, model: this.model }
      );
      const data = res.data?.data;
      if (!Array.isArray(data) || data.length !== normalized.length) {
        throw new Error('Invalid embeddings response from LM Studio');
      }
      return data.map((d) => d.embedding).filter((e): e is number[] => Array.isArray(e));
    } catch (err) {
      throw this.wrapEmbedError(err, 'LM Studio embeddings failed');
    }
  }
}
