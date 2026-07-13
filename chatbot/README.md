# Portfolio Chatbot AI (RAG Architecture)

This folder contains all the AI logic for your portfolio chatbot! 

I have organized the code here so you can easily study it. I have also left extremely detailed comments on every single line of code in `rag.ts` and `ingest.ts` so you can understand the exact mechanics.

## How It Works (The "RAG" Pipeline)

**RAG** stands for **Retrieval-Augmented Generation**. Here is how we use it:

1. **Ingestion (`ingest.ts`)**: 
   - When you have a new resume, this script reads the PDF text.
   - It breaks the text into small paragraphs.
   - It uses Google Gemini to turn those paragraphs into **Vectors** (lists of mathematical numbers).
   - It saves those vectors into the **Pinecone Database**.

2. **Retrieving & Chatting (`rag.ts`)**:
   - When a recruiter asks a question on your website, we turn their question into a math vector too.
   - We ask Pinecone to find the 5 paragraphs from your resume that are mathematically closest to the question.
   - We take those 5 paragraphs and hand them to Gemini, saying: *"Here is Ashwin's resume data. Answer the recruiter's question using ONLY this data."*
   - Gemini formats the response and sends it back to the screen!

## Files in this Folder

1. **`ingest.ts`**: Run this script (`npx tsx chatbot/ingest.ts`) anytime you drop a new PDF into the `knowledgebase/` folder. It updates the database.
2. **`rag.ts`**: The core AI logic that powers the chat window. It handles connecting to Pinecone, querying vectors, and generating the final response with the `gemini-flash-lite-latest` model.
3. **`README.md`**: You are reading it!

## Why is it built this way?
If we just sent your entire PDF to Gemini every single time someone asked a question, it would be slow, and we would quickly run out of API limits. By using Pinecone to only fetch the exact 5 paragraphs relevant to the user's question, we make the AI insanely fast and cheap!
