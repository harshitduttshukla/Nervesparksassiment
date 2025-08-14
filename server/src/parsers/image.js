// import Tesseract from 'tesseract.js';

// export async function parseImage(filePath) {
//   const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
//   return text;
// }









// src/parsers/image.js
import Tesseract from 'tesseract.js';
import { extractTablesFromText } from './table.js';

/**
 * Parse an image file for text, tables, and block-level OCR results.
 * @param {string} filePath
 * @returns {Promise<{ text: string, blocks: object[], tables: object[] }>}
 */
export async function parseImage(filePath) {
  const { data } = await Tesseract.recognize(filePath, 'eng', {
    // Tesseract page segmentation mode
    tessedit_pageseg_mode: Tesseract.PSM.AUTO
  });

  const text = data?.text || '';
  const blocks = (data?.blocks || []).map(b => ({
    text: b.text,
    bbox: b.bbox // left, top, width, height
  }));

  // Detect tables in the recognized text
  const tables = extractTablesFromText(text).map(t => ({
    page: 1, // Images don't have pages, so we use page 1
    text: t
  }));

  return { text, blocks, tables };
}
