export function chunkByPageAndParagraph(pages, maxWords = 250) {
 
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

  return chunks; 
}
