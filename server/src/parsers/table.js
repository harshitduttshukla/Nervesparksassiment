// src/parsers/table.js
export function extractTablesFromText(pageText) {
  const lines = pageText.split('\n').map(l => l.trim());
  const candidateLines = lines.filter(l => (l.match(/\s{2,}/g) || []).length >= 1 || l.includes('|'));
  // Group contiguous candidate lines into table blocks
  const tables = [];
  let cur = [];
  for (const line of lines) {
    if (candidateLines.includes(line)) {
      cur.push(line);
    } else {
      if (cur.length) { tables.push(cur.join('\n')); cur = []; }
    }
  }
  if (cur.length) tables.push(cur.join('\n'));
  return tables; // array of table-text blocks (strings)
}
