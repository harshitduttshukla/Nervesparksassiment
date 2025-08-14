import Tesseract from 'tesseract.js';

export async function parseImage(filePath) {
  const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
  return text;
}
