






import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parsePDF } from '../parsers/pdf.js';
import { parseImage } from '../parsers/image.js';
import { extractTablesFromText } from '../parsers/table.js';
import { extractChartsFromPDF } from '../parsers/chart.js';
import { chunkByPageAndParagraph } from '../chunking.js';
import { getEmbeddings } from '../embeddings.js';
import { storeInPinecone, deleteAllVectors } from '../storage.js';
import mammoth from 'mammoth'; // For DOCX
import xlsx from 'xlsx';        // For Excel

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let parsed = { pages: [] };
    let chartPaths = [];

    console.log(`Processing file: ${req.file.originalname} (${ext})`);

    // ---- PDF Handling ----
    if (ext === '.pdf') {
      parsed = await parsePDF(req.file.path);
      chartPaths = await extractChartsFromPDF(req.file.path, 'uploads/charts');

    // ---- Image Handling ----
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const imgParsed = await parseImage(req.file.path);
      parsed.pages.push({ page: 1, text: imgParsed.text });

    // ---- DOCX Handling ----
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: req.file.path });
      parsed.pages.push({ page: 1, text: result.value });

    // ---- TXT Handling ----
    } else if (ext === '.txt') {
      const text = fs.readFileSync(req.file.path, 'utf-8');
      parsed.pages.push({ page: 1, text });

    // ---- XLSX/CSV Handling ----
    } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      const workbook = xlsx.readFile(req.file.path);
      workbook.SheetNames.forEach((sheetName, idx) => {
        const sheet = workbook.Sheets[sheetName];
        const text = xlsx.utils.sheet_to_csv(sheet);
        parsed.pages.push({ page: idx + 1, text });
      });

    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    console.log(`Extracted ${parsed.pages.length} pages`);

    // ---- Text Chunking ----
    const chunks = chunkByPageAndParagraph(parsed.pages, 300);
    console.log(`Generated ${chunks.length} text chunks`);

    // ---- Table Extraction ----
    const tableChunks = [];
    for (const p of parsed.pages) {
      const tables = extractTablesFromText(p.text || '');
      tables.forEach((t) => {
        tableChunks.push({ text: t, page: p.page || 1, type: 'table' });
      });
    }
    console.log(`Extracted ${tableChunks.length} table chunks`);

    // ---- Chart Captions ----
    const chartChunks = chartPaths.map((chartPath, idx) => ({
      text: `Chart image located at ${chartPath} (captioning not implemented yet)`,
      page: idx + 1,
      type: 'chart'
    }));
    console.log(`Generated ${chartChunks.length} chart chunks`);

    // ---- Combine all chunks ----
    const allChunks = [...chunks, ...tableChunks, ...chartChunks];
    const filtered = allChunks.filter(c => c.text && c.text.trim());
    console.log(`Total filtered chunks: ${filtered.length}`);

    if (filtered.length === 0) {
      return res.status(400).json({ error: 'No content found in the uploaded file' });
    }

    // ---- Clear previous embeddings ----
    console.log('Clearing existing vectors from Pinecone...');
    try {
      await deleteAllVectors();
      console.log('Successfully cleared existing vectors');
    } catch (deleteError) {
      console.error('Error clearing vectors:', deleteError.message);
      // Continue processing even if delete fails
    }

    // ---- Add timestamp for current upload ----
    const timestamp = Date.now();

    // ---- Generate embeddings with proper error handling ----
    console.log('Generating embeddings...');
    const vectors = [];
    
    for (let i = 0; i < filtered.length; i++) {
      const chunk = filtered[i];
      try {
        console.log(`Processing chunk ${i + 1}/${filtered.length}`);
        
        // Get embedding
        const embedding = await getEmbeddings(chunk.text);
        
        // Validate embedding
        if (!Array.isArray(embedding)) {
          throw new Error(`Embedding for chunk ${i} is not an array`);
        }
        
        if (embedding.length === 0) {
          throw new Error(`Embedding for chunk ${i} is empty`);
        }
        
        if (embedding.some(val => typeof val !== 'number' || isNaN(val))) {
          throw new Error(`Embedding for chunk ${i} contains invalid values`);
        }
        
        // Create vector object
        const vector = {
          id: `${req.file.filename}-${chunk.page || 1}-${i}-${timestamp}`,
          values: embedding,
          metadata: {
            source: req.file.originalname,
            page: chunk.page || 1,
            type: chunk.type || 'paragraph',
            excerpt: chunk.text.slice(0, 300),
            timestamp,
            chunkIndex: i
          }
        };
        
        vectors.push(vector);
        
      } catch (embeddingError) {
        console.error(`Error processing chunk ${i}:`, embeddingError.message);
        // Skip this chunk and continue
        continue;
      }
    }

    if (vectors.length === 0) {
      return res.status(500).json({ error: 'Failed to generate any valid embeddings' });
    }

    console.log(`Successfully generated ${vectors.length} vectors`);

    // Debug: Log sample vector structure
    if (vectors.length > 0) {
      const sample = vectors[0];
      console.log('Sample vector structure:', {
        id: sample.id,
        valuesType: typeof sample.values,
        valuesLength: sample.values?.length,
        valuesIsArray: Array.isArray(sample.values),
        metadataKeys: Object.keys(sample.metadata || {})
      });
    }

    // ---- Store in Pinecone with proper validation ----
    console.log('Storing vectors in Pinecone...');
    try {
      // Validate vectors array before storing
      if (!Array.isArray(vectors)) {
        throw new Error('Vectors is not an array');
      }
      
      // Final validation of vector format
      vectors.forEach((vector, index) => {
        if (!vector.id || typeof vector.id !== 'string') {
          throw new Error(`Vector ${index} has invalid ID`);
        }
        if (!Array.isArray(vector.values)) {
          throw new Error(`Vector ${index} values is not an array`);
        }
        if (vector.values.length === 0) {
          throw new Error(`Vector ${index} has empty values array`);
        }
      });
      
      await storeInPinecone(vectors);
      console.log('Successfully stored vectors in Pinecone');
      
    } catch (storageError) {
      console.error('Error storing in Pinecone:', storageError);
      return res.status(500).json({ 
        error: 'Failed to store vectors in Pinecone', 
        details: storageError.message 
      });
    }

    // ---- Cleanup uploaded file ----
    try {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up uploaded file');
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError.message);
    }

    res.json({
      message: 'File processed & stored successfully.',
      storedChunks: vectors.length,
      chartsExtracted: chartPaths.length,
      timestamp,
      fileProcessed: req.file.originalname
    });

  } catch (err) {
    console.error('Ingest error:', err);
    
    // Cleanup uploaded file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file on error:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Processing failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;