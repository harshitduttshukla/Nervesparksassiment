// export function chunkText(text, size = 500) {
//   const words = text.split(/\s+/);
//   const chunks = [];
//   for (let i = 0; i < words.length; i += size) {
//     chunks.push(words.slice(i, i + size).join(' '));
//   }
//   return chunks;
// }









// src/chunking.js
export function chunkByPageAndParagraph(pages, maxWords = 250) {
  // pages: [{page, text}, ...]
  const chunks = [];

  for (const p of pages) {
    const pageNum = p.page;
    const paragraphs = p.text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);

    for (const para of paragraphs) {
      const words = para.split(/\s+/);
      if (words.length <= maxWords) {
        chunks.push({
          text: para,
          page: pageNum,
          type: 'paragraph',
        });
      } else {
        // split paragraph into word-window chunks
        for (let i = 0; i < words.length; i += maxWords) {
          const chunkText = words.slice(i, i + maxWords).join(' ');
          chunks.push({
            text: chunkText,
            page: pageNum,
            type: 'paragraph',
          });
        }
      }
    }
  }

  return chunks; // array of { text, page, type }
}
