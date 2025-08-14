



// src/index.js - Add this at the VERY TOP, before any other imports

import dotenv from 'dotenv';

// Load environment variables from the server root (one level up from src)
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Variables Check:');
console.log('  - PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Found' : '❌ Missing');
console.log('  - PINECONE_INDEX:', process.env.PINECONE_INDEX ? `✅ Found: ${process.env.PINECONE_INDEX}` : '❌ Missing');
console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('  - PORT:', process.env.PORT || 'Using default 5000');

// Now import your other modules
import express from 'express';
import cors from 'cors';
import ingestRouter from './routes/ingest.js';
import queryRouter from './routes/query.js';
// ... other imports

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/ingest', ingestRouter);
app.use('/query', queryRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Visual RAG API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});