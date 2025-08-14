// working code 
// import pdf from 'pdf-parse';
// import fs from 'fs';

// export async function parsePDF(filePath) {
//   const dataBuffer = fs.readFileSync(filePath);
//   const data = await pdf(dataBuffer);
//   return data.text;
// }






// src/parsers/pdf.js
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { extractTablesFromText } from './table.js';
import { extractChartsFromPDF } from './chart.js';

/**
 * Parse PDF and also detect tables & charts.
 * @param {string} filePath
 * @returns {Promise<{ pages: object[], fullText: string, tables: object[], charts: string[] }>}
 */
export async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer, { pagerender: renderPageText });

  const fullText = data.text || '';
  const pages = fullText
    .split('\f')
    .map((t, i) => ({ page: i + 1, text: t.trim() }));

  // Extract tables per page
  const tables = [];
  pages.forEach(p => {
    const tbls = extractTablesFromText(p.text);
    tbls.forEach(t => tables.push({ page: p.page, text: t }));
  });

  // Extract chart images from PDF
  const chartsOutputDir = path.join('uploads', 'charts');
  const chartPaths = await extractChartsFromPDF(filePath, chartsOutputDir);

  return {
    pages,
    fullText,
    tables,
    charts: chartPaths // file paths to chart images
  };
}

// Optional custom pagerender
async function renderPageText(pageData) {
  return pageData.getTextContent().then(tc => {
    return tc.items.map(i => i.str).join(' ');
  });
}
