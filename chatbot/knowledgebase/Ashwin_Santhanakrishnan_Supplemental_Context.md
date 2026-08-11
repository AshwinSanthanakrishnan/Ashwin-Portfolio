# Supplemental RAG Context Document
**Subject:** Ashwin Santhanakrishnan - Additional Personal Information

## 1. Location & Work Authorization
* **Current Location:** Washington, D.C.
* **Relocation Status:** Open and willing to relocate for work depending on the position.
* **Work Authorization:** Fully authorized to work for any employer in the United States without restriction.

## 2. Specific Work Environments & Employment Types
* **Dementia Aide (Oct 2025 - May 2026):** Worked entirely **Remote** for this position based in California.
* **Ark Infotech LLC (May 2023 - Aug 2024):** Worked **In-Person** for this position based in Maryland. This role was standard employment and strictly not an internship.

## 3. Key GitHub Projects & Portfolio
* **House Price Prediction Model:**
  * **Repository:** [House-Price-Prediction](https://github.com/AshwinSanthanakrishnan/House-Price-Prediction)
  * **Description:** A machine learning project built with Python and Jupyter Notebooks, incorporating real estate market analysis, regression modeling, and feature engineering to predict property pricing accurately.
  * **Tech Stack:** Python, Jupyter Notebooks, Pandas, NumPy, Scikit-Learn.
* **Intelligent Hiring Assistant:**
  * **Repository:** [intelligent-hiring-assistant](https://github.com/AshwinSanthanakrishnan/intelligent-hiring-assistant)
  * **Description:** An applied Natural Language Processing (NLP) system designed to automate candidate resume screening, key skill extraction, and profile analysis for streamlined talent acquisition.
  * **Tech Stack:** Node.js, TypeScript, Applied ML, NLP.
* **RAG-Based Portfolio Chatbot (This Project):**
  * **Repository:** [Ashwin-Portfolio](https://github.com/AshwinSanthanakrishnan/Ashwin-Portfolio)
  * **Description:** An AI-powered personal portfolio website featuring a Retrieval-Augmented Generation (RAG) chatbot. The chatbot can search Ashwin's resume and supplemental context dynamically to answer user and recruiter queries instantly.
  * **Architecture & Flow:**
    * **Ingestion (`ingest.ts`):** Parses resume documents (PDF, MD, TXT), splits them into 1000-character chunks with a 200-character overlap using RecursiveCharacterTextSplitter, embeds them into 768-dimensional vectors using Google Gemini (`gemini-embedding-2`), and upserts them to a Pinecone vector database.
    * **Retrieval (`rag.ts`):** Converts user queries to embeddings, queries Pinecone to find the 5 most mathematically similar chunks, and feeds them into Gemini (`gemini-flash-lite-latest`) to generate contextual, grounded answers.
  * **Tech Stack:** Next.js (App Router), React, TypeScript, Vanilla CSS, Pinecone Vector Database, Google Generative AI (Gemini), LangChain.


