# RAG Agent (Node.js + LM Studio + ChromaDB)

A full RAG (Retrieval-Augmented Generation) agent using Node.js, TypeScript, Express, LM Studio (OpenAI-compatible API), and ChromaDB. Users can ask questions; answers use retrieved context when available, otherwise the system replies: *"I don't know the answer to your question."*

## Project structure

```
rag-agent/
├── src/
│   ├── server.ts
│   ├── ingest.ts
│   ├── config.ts
│   ├── swagger.ts
│   ├── rag/
│   │   ├── vectorStore.ts
│   │   ├── embedder.ts
│   │   ├── ragService.ts
│   └── routes/
│       └── askRoute.ts
├── ui/
│   └── index.html
├── text.txt
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **LM Studio** running locally with:
  - Chat model loaded: `Qwen2.5-7B-Instruct-GGUF`
  - Server: `http://localhost:1234/v1`
  - Embeddings and chat endpoints enabled
- **ChromaDB** server at `http://localhost:8000` (see below; Docker is the easiest)

## Setup

1. **Enter project directory**

   ```bash
   cd rag-agent
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment**

   Copy `.env.example` to `.env` and adjust if needed:

   ```bash
   cp .env.example .env
   ```

   Defaults:

   - LM Studio: `http://localhost:1234/v1`, chat model `Qwen2.5-7B-Instruct-GGUF`, embedding model (e.g. `nomic-ai/nomic-embed-text-v1.5`)
   - ChromaDB: `localhost:8000`
   - Server: port `3000`
   - `SIMILARITY_THRESHOLD=0.3` (min score to use context)

4. **Start ChromaDB** (if not already running)

   ```bash
   docker run -p 8000:8000 chromadb/chroma
   ```

5. **Start LM Studio**

   - Open LM Studio, load the chat model `Qwen2.5-7B-Instruct-GGUF`, and start the local server (port 1234).
   - Ensure an embedding model is available for the `/v1/embeddings` endpoint (e.g. `nomic-ai/nomic-embed-text-v1.5`).

## Run

1. **Ingest** (chunk `text.txt`, embed via LM Studio, store in ChromaDB). This builds the project then runs the ingest script:

   ```bash
   npm run ingest
   ```

2. **Start the server**

   ```bash
   npm run server
   ```

   Or built + run:

   ```bash
   npm run build
   npm start
   ```

3. **Use the app**

   - **Web UI:** http://localhost:3000/ (redirects to `/ui/index.html`)
   - **Swagger:** http://localhost:3000/swagger
   - **API:** `POST http://localhost:3000/ask` with body `{ "question": "Your question?" }`

## API

### POST /ask

**Request:**

```json
{
  "question": "string"
}
```

**Response:**

```json
{
  "answer": "string",
  "contextUsed": "string | null",
  "score": number
}
```

- `answer`: Reply from the RAG pipeline (from context or *"I don't know the answer to your question."*).
- `contextUsed`: Concatenated retrieved chunks used for the answer, or `null` if none met the threshold.
- `score`: Similarity score (0–1) of the best chunk; used to decide whether to use context.

## Behaviour

1. **Ingest:** Reads `text.txt`, splits into chunks (~300–500 chars), gets embeddings from LM Studio, stores them in ChromaDB.
2. **Ask:** Embeds the question, retrieves top chunks from ChromaDB, converts distance to a similarity score.
3. If **score ≥ threshold** → context is sent to the LLM with a strict system prompt to answer only from context; otherwise the LLM must say it doesn't know.
4. If **score < threshold** (or no chunks) → the API returns *"I don't know the answer to your question."* without calling the LLM.

## Scripts

| Script        | Description                          |
|---------------|--------------------------------------|
| `npm run ingest` | Chunk, embed, and store `text.txt` |
| `npm run server` | Start Express server (tsx)        |
| `npm run dev`    | Start server with watch            |
| `npm run build`  | Compile TypeScript to `dist/`     |
| `npm start`      | Run `dist/server.js`               |

## Tech stack

- **Runtime:** Node.js, TypeScript (ESM)
- **Server:** Express
- **LLM / Embeddings:** LM Studio (OpenAI-compatible: `/v1/chat/completions`, `/v1/embeddings`)
- **Vector DB:** ChromaDB
- **API docs:** Swagger UI at `/swagger`
- **Frontend:** Static HTML chat at `/ui/index.html`
