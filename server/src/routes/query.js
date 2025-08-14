// import express from 'express';
// import pc from '../pineconeClient.js';
// import { getEmbeddings } from '../embeddings.js';
// import { askLLM } from '../llm.js';

// const router = express.Router();

// router.post('/', async (req, res) => {
//   try {
//     const { query } = req.body;
//     const index = pc.index(process.env.PINECONE_INDEX);

//     const queryEmbedding = await getEmbeddings(query);

//     const searchRes = await index.query({
//       vector: queryEmbedding,
//       topK: 5,
//       includeMetadata: true
//     });

//     const context = searchRes.matches.map(m => m.metadata.text).join('\n\n');
//     const answer = await askLLM(`Use the following context to answer:\n${context}\n\nQuestion: ${query}`);

//     res.json({ answer, sources: searchRes.matches });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Query failed' });
//   }
// });

// export default router;







// // src/routes/query.js
// import express from 'express';
// import pc from '../pineconeClient.js';
// import { getEmbeddings } from '../embeddings.js';
// import { askLLM } from '../llm.js';

// const router = express.Router();

// router.post('/', async (req, res) => {
//   try {
//     const { query } = req.body;
//     if (!query || !query.trim()) 
//       return res.status(400).json({ error: 'Query text is required' });

//     const index = pc.index(process.env.PINECONE_INDEX);
//     const queryEmbedding = await getEmbeddings(query);

//     const searchRes = await index.query({
//       vector: queryEmbedding,
//       topK: 5,
//       includeMetadata: true
//     });

//     const sources = (searchRes.matches || []).map(m => ({
//       id: m.id,
//       score: m.score,
//       metadata: m.metadata
//     }));

//     // Build context using excerpt if available, otherwise fallback to text
//     const context = sources.map(s => {
//       const snippet = s.metadata.excerpt || s.metadata.text || '';
//       return `Source (${s.metadata.source} page:${s.metadata.page} type:${s.metadata.type}):\n${snippet}`;
//     }).join('\n\n');

//     // Debug: see what context is sent to LLM
//     console.log("Context sent to LLM:", context);

//     const prompt = `Use the following sources to answer the question. If unsure, say you don't know.\n\n${context}\n\nQuestion: ${query}\nAnswer concisely and reference source pages.`;

//     const answer = await askLLM(prompt);

//     res.json({ answer, sources });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Query failed', details: err.message });
//   }
// });

// export default router;







// src/routes/query.js
import express from 'express';
import pc from '../pineconeClient.js';
import { getEmbeddings } from '../embeddings.js';
import { askLLM } from '../llm.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim())
      return res.status(400).json({ error: 'Query text is required' });

    const index = pc.index(process.env.PINECONE_INDEX);
    const queryEmbedding = await getEmbeddings(query);

    // --- Get the latest timestamp in the index ---
    const allMatches = await index.query({
      vector: queryEmbedding,
      topK: 1,
      includeMetadata: true
    });

    const latestTimestamp = allMatches.matches?.[0]?.metadata?.timestamp;

    if (!latestTimestamp) {
      return res.status(404).json({ error: 'No documents found in the index.' });
    }

    // --- Query only vectors with the latest timestamp ---
    const searchRes = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: { timestamp: { $eq: latestTimestamp } }
    });

    const sources = (searchRes.matches || []).map(m => ({
      id: m.id,
      score: m.score,
      metadata: {
        source: m.metadata.source || 'unknown',
        page: m.metadata.page || 1,
        type: m.metadata.type || 'paragraph',
        excerpt: m.metadata.excerpt || m.metadata.text || ''
      }
    }));

    // --- Build context for LLM ---
    const context = sources.map(s =>
      `Source (${s.metadata.source} page:${s.metadata.page} type:${s.metadata.type}):\n${s.metadata.excerpt}`
    ).join('\n\n');

    console.log("Context sent to LLM:", context);

    const prompt = `Use the following sources to answer the question. If unsure, say you don't know.\n\n${context}\n\nQuestion: ${query}\nAnswer concisely and reference source pages.`;

    const answer = await askLLM(prompt);

    res.json({ answer, sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
});

export default router;
