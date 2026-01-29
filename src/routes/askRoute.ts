import { Router, type Request, type Response } from 'express';
import { RAGService } from '../rag/ragService.js';

const router = Router();
const rag = new RAGService();

router.post('/ask', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body as { question?: string };
    if (typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Missing or invalid "question" in body.' });
      return;
    }
    const result = await rag.ask(question.trim());
    res.json({
      answer: result.answer,
      contextUsed: result.contextUsed,
      score: result.score,
    });
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({
      error: 'Internal server error',
      answer: "I don't know the answer to your question.",
      contextUsed: null,
      score: 0,
    });
  }
});

export default router;
