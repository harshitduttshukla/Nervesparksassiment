import express from 'express';
import pc from '../pineconeClient.js';
import { getEmbeddings } from '../embeddings.js';
import { askLLM } from '../llm.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    const index = pc.index(process.env.PINECONE_INDEX);

    const queryEmbedding = await getEmbeddings(query);

    const searchRes = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true
    });

    const context = searchRes.matches.map(m => m.metadata.text).join('\n\n');
    const answer = await askLLM(`Use the following context to answer:\n${context}\n\nQuestion: ${query}`);

    res.json({ answer, sources: searchRes.matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});

export default router;
