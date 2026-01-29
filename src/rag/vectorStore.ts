import { ChromaClient, type Collection, IncludeEnum } from 'chromadb';
import { config } from '../config.ts';

const { host, port, collectionName } = config.chroma;

export interface VectorStoreConfig {
  host?: string;
  port?: number;
  collectionName?: string;
}

function chromaPath(host: string, port: number): string {
  return `http://${host}:${port}`;
}

export class VectorStore {
  private client: ChromaClient;
  private collectionName: string;
  private collection: Collection | null = null;

  constructor(options: VectorStoreConfig = {}) {
    const h = options.host ?? host;
    const p = options.port ?? port;
    this.client = new ChromaClient({
      path: chromaPath(h, p),
    });
    this.collectionName = options.collectionName ?? collectionName;
  }

  private async getCollection(): Promise<Collection> {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
      });
    }
    return this.collection;
  }

  /** Add documents with precomputed embeddings. */
  async add(ids: string[], documents: string[], embeddings: number[][]): Promise<void> {
    const coll = await this.getCollection();
    await coll.add({
      ids,
      documents,
      embeddings,
    });
  }

  /** Query by embedding; returns documents and distances (L2). */
  async query(
    queryEmbedding: number[],
    nResults: number = 5
  ): Promise<{ documents: string[][]; distances: number[][] }> {
    const coll = await this.getCollection();
    const result = await coll.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
      include: [IncludeEnum.Documents, IncludeEnum.Distances],
    });
    const documents = (result.documents ?? []) as string[][];
    const distances = (result.distances ?? []) as number[][];
    return {
      documents: documents.length ? documents : [[]],
      distances: distances.length ? distances : [[]],
    };
  }

  /** Count documents in the collection. */
  async count(): Promise<number> {
    const coll = await this.getCollection();
    return coll.count();
  }

  /** Reset collection (delete and recreate). Use for re-ingestion. */
  async reset(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
    } catch {
      // ignore if not exists
    }
    this.collection = null;
    await this.getCollection();
  }
}
