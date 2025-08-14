import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getEmbeddings(text) {
  if (!text || !text.trim()) {
    throw new Error("No text provided for embedding");
  }

  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await model.embedContent({
    content: {
      parts: [{ text }]
    }
  });

  return result.embedding.values;
}
