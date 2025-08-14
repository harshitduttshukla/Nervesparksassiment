

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function getEmbeddings(text) {
  try {
    // Check API key at function level (after dotenv has loaded)
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    console.log('🔑 Using Gemini API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    
    return embedding.values;
    
  } catch (error) {
    console.error('❌ Embedding generation failed:', error.message);
    
    // If API key is invalid, provide more helpful error
    if (error.message.includes('API key not valid')) {
      console.error('🔑 Your Gemini API key appears to be invalid or expired.');
      console.error('   Current key preview:', process.env.GEMINI_API_KEY?.substring(0, 15) + '...');
      console.error('   Please get a new API key from: https://makersuite.google.com/app/apikey');
    }
    
    throw error;
  }
}