import axios from 'axios';
import { config } from '../config.js';
import { Embedder } from './embedder.js';
import { VectorStore } from './vectorStore.js';

const BASE = config.lmStudio.baseUrl;
const CHAT_MODEL = config.lmStudio.chatModel;
const THRESHOLD = config.rag.similarityThreshold;

const SYSTEM_PROMPT = `Answer ONLY using the provided context. If the context does not contain the answer, reply exactly: I don't know the answer to your question.`;

export interface AskResult {
  answer: string;
  contextUsed: string | null;
  score: number;
}

export class RAGService {
  private embedder: Embedder;
  private vectorStore: VectorStore;

  constructor(embedder?: Embedder, vectorStore?: VectorStore) {
    this.embedder = embedder ?? new Embedder();
    this.vectorStore = vectorStore ?? new VectorStore();
  }

  /** Convert L2 distance to a 0–1 similarity score (higher = more similar). */
  private distanceToScore(distance: number): number {
    return 1 / (1 + distance);
  }

  async ask(question: string): Promise<AskResult> {
    const queryEmbedding = await this.embedder.embed(question);
    const { documents, distances } = await this.vectorStore.query(queryEmbedding, 5);

    const docList = documents[0] ?? [];
    const distList = distances[0] ?? [];

    if (docList.length === 0) {
      return {
        answer: "I don't know the answer to your question.",
        contextUsed: null,
        score: 0,
      };
    }

    const bestDistance = Math.min(...distList);
    const score = this.distanceToScore(bestDistance);

    if (score < THRESHOLD) {
      return {
        answer: "I don't know the answer to your question.",
        contextUsed: null,
        score,
      };
    }

    const context = docList.join('\n\n').trim();
    const answer = await this.chatWithContext(question, context);

    return {
      answer,
      contextUsed: context,
      score,
    };
  }

  private async chatWithContext(question: string, context: string): Promise<string> {
    const fullSystem = `${SYSTEM_PROMPT}\n\nContext:\n${context}`;
    const res = await axios.post<{ choices?: Array<{ message?: { content?: string } }> }>(
      `${BASE}/chat/completions`,
      {
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: fullSystem },
          { role: 'user', content: question },
        ],
        max_tokens: 500,
        temperature: 0.2,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60_000 }
    );
    const content = res.data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : "I don't know the answer to your question.";
  }
}
