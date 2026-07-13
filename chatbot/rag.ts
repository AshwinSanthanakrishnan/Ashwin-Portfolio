import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load the environment variables from the custom location inside the chatbot folder
dotenv.config({ path: path.join(process.cwd(), 'chatbot', '.env.local') });

/**
 * generateChatReply
 * -----------------
 * This function takes the user's message from the frontend, searches the 
 * Pinecone vector database for relevant facts about Ashwin, and then uses 
 * Google Gemini to generate a smart, conversational answer.
 */
export async function generateChatReply(message: string): Promise<string> {
  // 1. Initialize the tools we need
  // Pinecone is our vector database where we stored Ashwin's resume chunks.
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const pineconeIndex = pc.Index(process.env.PINECONE_INDEX as string);
  
  // GoogleGenerativeAI is the Google Gemini AI client.
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

  // 2. Convert the user's text message into a vector (a list of numbers)
  // We use the 'gemini-embedding-2' model because it turns text into mathematical vectors.
  // We have to turn the question into a vector so we can search the database mathematically.
  const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  
  const embedResult = await embedModel.embedContent({
    content: { role: 'user', parts: [{ text: message }] },
    outputDimensionality: 768 // We limit it to 768 dimensions to match our Pinecone database settings
  } as any);
  
  // Extract the raw mathematical numbers
  const queryVector = embedResult.embedding.values;

  // 3. Search the Pinecone database
  // We ask Pinecone: "Here is the math vector for the user's question. Find the top 5 chunks of Ashwin's resume that are mathematically closest to this question."
  const searchResponse = await pineconeIndex.query({
    vector: queryVector,
    topK: 5, // Get the 5 most relevant paragraphs
    includeMetadata: true, // We need the metadata because that's where the actual English text is stored!
  });

  // 4. Put the search results together into one big string of context
  const contextChunks = searchResponse.matches
    .map(match => match.metadata?.text)
    .filter(text => text)
    .join('\n\n---\n\n');

  // 5. Ask Gemini to generate the final English response
  // We use 'gemini-flash-lite-latest' because it is lightning fast and highly reliable.
  const chatModel = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
  
  // This is the "System Prompt" - a set of strict rules we give to the AI so it behaves correctly.
  const prompt = `You are Ashwin's personal portfolio chatbot. A recruiter or visitor is asking you questions about Ashwin.
Answer the user's question clearly, professionally, and concisely (do not use excessive emojis). 

IMPORTANT FORMATTING RULES: 
- Use HTML tags like <b>, <strong>, <br>, and <ul>/<li> for formatting instead of Markdown.
- Do NOT use Markdown asterisks (**bold**). Use <b>bold</b> instead.

ONLY use the context provided below. If the answer is not in the context, politely state that you don't have that information but they can reach out to Ashwin directly.

CRITICAL INSTRUCTION: If the user asks for Ashwin's contact information (email, phone, linkedin, github, or how to reach him/hire him), you MUST reply with EXACTLY this word and nothing else:
__CONTACT_CARD__

CONTEXT FROM ASHWIN'S KNOWLEDGE BASE (Resume):
${contextChunks}

USER'S QUESTION:
${message}

YOUR ANSWER:`;

  // 6. Generate the content and return the text
  const chatResult = await chatModel.generateContent(prompt);
  return chatResult.response.text();
}
