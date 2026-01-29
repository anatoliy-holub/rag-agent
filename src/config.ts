import { config as loadEnv } from 'dotenv';

loadEnv();

export const config = {
  lmStudio: {
    baseUrl: process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1',
    chatModel: process.env.LM_STUDIO_CHAT_MODEL ?? 'Qwen2.5-7B-Instruct-GGUF',
    embeddingModel: process.env.LM_STUDIO_EMBEDDING_MODEL ?? 'nomic-ai/nomic-embed-text-v1.5',
  },
  chroma: {
    host: process.env.CHROMA_HOST ?? 'localhost',
    port: parseInt(process.env.CHROMA_PORT ?? '8000', 10),
    collectionName: process.env.CHROMA_COLLECTION ?? 'rag_docs',
  },
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
  },
  rag: {
    /** Min similarity score (0–1) to use retrieved context. Higher = stricter. */
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD ?? '0.3'),
  },
} as const;
