import pc from './pineconeClient.js';

export async function storeInPinecone(vectors) {
  const index = pc.index(process.env.PINECONE_INDEX);
  await index.upsert(vectors);
}
