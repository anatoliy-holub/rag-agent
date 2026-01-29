import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Embedder, VectorStore } from './rag/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEXT_PATH = join(ROOT, 'text.txt');

const MIN_CHUNK = 300;
const MAX_CHUNK = 500;

/** Split text into chunks of ~300–500 characters, on sentence boundaries when possible. */
function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + MAX_CHUNK, normalized.length);
    if (end < normalized.length) {
      const slice = normalized.slice(start, end + 1);
      const lastPeriod = slice.lastIndexOf('.');
      const lastNewline = slice.lastIndexOf('\n');
      const breakAt = Math.max(lastPeriod, lastNewline);
      if (breakAt > MIN_CHUNK) {
        end = start + breakAt + 1;
      }
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = end;
  }

  return chunks;
}

async function main(): Promise<void> {
  const embedder = new Embedder();
  const vectorStore = new VectorStore();

  const raw = await readFile(TEXT_PATH, 'utf-8');
  const chunks = chunkText(raw);
  if (chunks.length === 0) {
    console.log('No text to ingest.');
    return;
  }

  console.log(`Chunked into ${chunks.length} chunks. Generating embeddings...`);
  const embeddings = await embedder.embedMany(chunks);
  const ids = chunks.map((_, i) => `chunk_${i}`);

  await vectorStore.reset();
  await vectorStore.add(ids, chunks, embeddings);
  const count = await vectorStore.count();
  console.log(`Ingestion complete. Stored ${count} chunks in ChromaDB.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
