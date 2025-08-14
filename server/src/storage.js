import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';


dotenv.config();


console.log('🔧 Storage.js Environment Check:');
console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Found' : 'Missing');
console.log('PINECONE_INDEX:', process.env.PINECONE_INDEX ? `Found: ${process.env.PINECONE_INDEX}` : 'Missing');


if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY environment variable is required');
}

if (!process.env.PINECONE_INDEX) {
  throw new Error('PINECONE_INDEX environment variable is required');
}

console.log('Initializing Pinecone with:', {
  hasApiKey: !!process.env.PINECONE_API_KEY,
  indexName: process.env.PINECONE_INDEX
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pc.index(process.env.PINECONE_INDEX);


export async function deleteAllVectors() {
  try {
    console.log('Attempting to delete all vectors...');
    
  
    await index.namespace('').deleteAll();
    console.log('All vectors deleted successfully');
    
  } catch (error) {
    console.error('Error deleting vectors from Pinecone:', error);
   
    console.log('Continuing without deleting existing vectors...');
  }
}


export async function storeInPinecone(vectors) {
  try {
    console.log(`Starting to store ${vectors.length} vectors in Pinecone`);
    

    if (!Array.isArray(vectors)) {
      throw new Error('Vectors parameter must be an array');
    }
    
    if (vectors.length === 0) {
      console.log('No vectors to store');
      return;
    }
    
    
    vectors.forEach((vector, index) => {
      if (!vector || typeof vector !== 'object') {
        throw new Error(`Vector at index ${index} is not a valid object`);
      }
      
      if (!vector.id || typeof vector.id !== 'string') {
        throw new Error(`Vector at index ${index} missing or invalid id field`);
      }
      
      if (!Array.isArray(vector.values)) {
        throw new Error(`Vector at index ${index} missing or invalid values array`);
      }
      
      if (vector.values.length === 0) {
        throw new Error(`Vector at index ${index} has empty values array`);
      }
      
      
      const invalidValues = vector.values.filter(val => typeof val !== 'number' || isNaN(val));
      if (invalidValues.length > 0) {
        throw new Error(`Vector at index ${index} contains invalid values: ${invalidValues.slice(0, 3).join(', ')}`);
      }
    });
    
    console.log('Vector validation passed');
    
    // Format vectors to ensure they meet Pinecone requirements
    const formattedVectors = vectors.map((vector, index) => ({
      id: String(vector.id), 
      values: vector.values, 
      metadata: vector.metadata || {} 
    }));
    
  
    if (formattedVectors.length > 0) {
      const sample = formattedVectors[0];
      console.log('Sample formatted vector:', {
        id: sample.id,
        valuesLength: sample.values.length,
        metadataKeys: Object.keys(sample.metadata)
      });
    }
    
  
    const batchSize = 100; 
    const totalBatches = Math.ceil(formattedVectors.length / batchSize);
    
    console.log(`Processing ${totalBatches} batches of up to ${batchSize} vectors each`);
    
    for (let i = 0; i < formattedVectors.length; i += batchSize) {
      const batch = formattedVectors.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      console.log(`Upserting batch ${batchNum}/${totalBatches} (${batch.length} vectors)`);
      
      try {
        await index.upsert(batch);
        console.log(`Successfully upserted batch ${batchNum}/${totalBatches}`);
        
       
        if (batchNum < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (batchError) {
        console.error(`Error upserting batch ${batchNum}:`, batchError);
        throw new Error(`Failed to upsert batch ${batchNum}: ${batchError.message}`);
      }
    }
    
    console.log(`Successfully stored all ${vectors.length} vectors in Pinecone`);
    
  } catch (error) {
    console.error('Error upserting vectors to Pinecone:', error);
    throw error;
  }
}


export async function queryPinecone(queryVector, options = {}) {
  try {
    const {
      topK = 10,
      includeMetadata = true,
      includeValues = false,
      namespace = '',
      filter = null
    } = options;
    
    const queryRequest = {
      vector: queryVector,
      topK,
      includeMetadata,
      includeValues
    };
    
    if (namespace) {
      queryRequest.namespace = namespace;
    }
    
    if (filter) {
      queryRequest.filter = filter;
    }
    
    const queryResponse = await index.query(queryRequest);
    
    return queryResponse;
    
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw error;
  }
}


export async function getIndexStats() {
  try {
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    throw error;
  }
}