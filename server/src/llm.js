import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function askLLM(prompt) {
  // Use a Gemini chat model — you can change model name if needed
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);

  // result.response.text() returns the string output
  return result.response.text();
}
