import { NextResponse } from 'next/server';
import { generateChatReply } from '../../../chatbot/rag';

/**
 * Next.js API Route handler for /api/chat
 * We have moved all the complex AI logic into the 'chatbot/' folder at the root of the project.
 * This file just receives the web request and passes the message to our AI helper.
 */
export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    // Call the heavy AI logic stored in the chatbot folder
    const answer = await generateChatReply(message);

    return NextResponse.json({ reply: answer });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
