import express from 'express';
import multer from 'multer';
import { parsePDF } from '../parsers/pdf.js';
import { parseImage } from '../parsers/image.js';
import { chunkText } from '../chunking.js';
import { getEmbeddings } from '../embeddings.js';
import { storeInPinecone } from '../storage.js';
import path from 'path';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let text = '';
    if (ext === '.pdf') text = await parsePDF(filePath);
    else text = await parseImage(filePath);

    const chunks = chunkText(text, 500);

    const vectors = await Promise.all(chunks.map(async (chunk, i) => ({
      id: `${req.file.filename}-${i}`,
      values: await getEmbeddings(chunk),
      metadata: { text: chunk }
    })));

    await storeInPinecone(vectors);

    res.json({ message: 'File processed & stored successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Processing failed' });
  }
});

export default router;

