// server/services/rag.service.js
const { embedQuery } = require("./gemini.service");
const { queryChunks } = require("./chromadb.service");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function answerQuestionFromDocument({ docId, question, topK = 5 }) {
  if (!docId) throw new Error("docId is required");
  if (!question || !question.trim()) throw new Error("question is required");

  const qVec = await embedQuery(question);
  const retrievedChunks = await queryChunks(docId, qVec, topK);

  if (!retrievedChunks.length) {
    return {
      answer:
        "I could not find enough relevant text in this document to answer that question confidently.",
      sourceChunks: [],
    };
  }

  const context = retrievedChunks
    .map(
      (chunk, idx) =>
        `[Source ${idx + 1} | chunkIndex=${chunk.metadata?.chunkIndex ?? idx}]\n${chunk.content}`
    )
    .join("\n\n----------------------\n\n");

  const systemPrompt = `
You are LexAI, an AI legal document assistant.
Answer ONLY from the provided document context.
Do not use outside knowledge.
If the answer is not clearly present in the context, say that the document does not clearly state it.
Keep the answer concise, plain-English, and helpful.
`.trim();

  const userPrompt = `
DOCUMENT CONTEXT:
${context}

QUESTION:
${question}

Return a helpful answer based only on the context above.
`.trim();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const answer =
    completion.choices?.[0]?.message?.content?.trim() ||
    "No answer generated.";

  return {
    answer,
    sourceChunks: retrievedChunks.map((chunk) => ({
      chunkIndex: chunk.metadata?.chunkIndex,
      content: chunk.content,
      score: chunk.score,
    })),
  };
}

module.exports = {
  answerQuestionFromDocument,
};