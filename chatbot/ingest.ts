import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
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

  // 3. Find all supported files in the knowledgebase folder (including subfolders)
  const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else if (file.match(/\.(pdf|md|txt)$/i)) {
        arrayOfFiles.push(fullPath);
      }
    });
    return arrayOfFiles;
  };

  const targetFiles = getAllFiles(KNOWLEDGEBASE_DIR);

  if (targetFiles.length === 0) {
    console.log('No supported files (PDF, MD, TXT) found in knowledgebase folder.');
    return;
  }
  console.log(`Found ${targetFiles.length} file(s). Loading...`);

  // 4. Read the text out of the files
  let allDocs: any[] = [];
  for (const filePath of targetFiles) {
    const file = path.basename(filePath);

    if (file.toLowerCase().endsWith('.pdf')) {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      console.log(`Loaded ${file} - ${docs.length} section(s)`);
      allDocs = allDocs.concat(docs);
    } else if (file.toLowerCase().match(/\.(md|txt)$/)) {
      const text = fs.readFileSync(filePath, 'utf-8');
      const doc = new Document({ pageContent: text, metadata: { source: filePath } });
      console.log(`Loaded ${file} - 1 section(s)`);
      allDocs.push(doc);
    }
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
