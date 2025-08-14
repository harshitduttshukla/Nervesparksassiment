import pdf from 'pdf-parse';
import fs from 'fs';

export async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

