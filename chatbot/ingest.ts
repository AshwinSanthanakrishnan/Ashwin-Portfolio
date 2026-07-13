import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load the secret API keys from the chatbot/.env.local file
dotenv.config({ path: path.join(process.cwd(), 'chatbot', '.env.local') });

// Define where the resume PDFs are located
const KNOWLEDGEBASE_DIR = path.join(process.cwd(), 'chatbot', 'knowledgebase');

/**
 * ingestData
 * ----------
 * This script runs ONCE whenever you update your resume.
 * It reads the PDF, chops it into small paragraphs, turns those paragraphs into 
 * math vectors using Gemini, and uploads them to the Pinecone database.
 */
async function ingestData() {
  console.log('Starting ingestion process...');

  // 1. Check if all required API keys are present
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.GEMINI_API_KEY) {
    throw new Error('Missing Pinecone or Gemini API keys in .env.local');
  }

  // 2. Connect to Pinecone and Gemini
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const pineconeIndex = pc.Index(process.env.PINECONE_INDEX as string);
  
  console.log('Wiping old data from Pinecone database...');
  await pineconeIndex.deleteAll();
  console.log('Old data deleted successfully.');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

  // 3. Find the PDF file in the knowledgebase folder
  const files = fs.readdirSync(KNOWLEDGEBASE_DIR);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log('No PDF files found in knowledgebase folder.');
    return;
  }
  console.log(`Found ${pdfFiles.length} PDF(s). Loading...`);

  // 4. Read the text out of the PDF file
  let allDocs: any[] = [];
  for (const file of pdfFiles) {
    const filePath = path.join(KNOWLEDGEBASE_DIR, file);
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    console.log(`Loaded ${file} - ${docs.length} page(s)`);
    allDocs = allDocs.concat(docs);
  }

  // 5. Split the massive block of text into smaller paragraphs
  // AI models and vector databases perform best with smaller chunks of text
  // We use 1000 characters per chunk, and overlap them by 200 characters so sentences aren't cut in half.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  console.log('Splitting documents into chunks...');
  const chunkedDocs = await textSplitter.splitDocuments(allDocs);
  console.log(`Created ${chunkedDocs.length} chunks from the PDFs.`);

  // 6. Loop through each chunk, convert it to a vector, and prepare it for upload
  console.log('Generating embeddings for chunks via Gemini...');
  const records = [];
  
  for (let i = 0; i < chunkedDocs.length; i++) {
    const doc = chunkedDocs[i];
    
    // Send the English text to Gemini and get back the mathematical vector
    const result = await embedModel.embedContent({
      content: { role: 'user', parts: [{ text: doc.pageContent }] },
      outputDimensionality: 768 // Matching the Pinecone index settings
    } as any);
    
    const vectorValues = result.embedding.values;

    if (!vectorValues || vectorValues.length === 0) {
      console.warn(`Failed to get embedding for chunk ${i}`);
      continue;
    }

    // Prepare the record object for Pinecone
    records.push({
      id: `chunk-${i}`, // A unique ID for this paragraph
      values: vectorValues, // The mathematical vector
      metadata: { text: doc.pageContent } // The actual English text! (This is what the chatbot reads later)
    });
  }

  // 7. Upload everything to Pinecone database
  console.log(`Upserting ${records.length} vectors to Pinecone index: ${process.env.PINECONE_INDEX}...`);
  await pineconeIndex.upsert({ records });

  console.log('Ingestion complete! Your knowledge base is now live in Pinecone.');
}

// Run the function!
ingestData().catch(console.error);
