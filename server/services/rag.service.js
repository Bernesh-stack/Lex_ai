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
Your task is to answer the user's question based STRICTLY and ONLY on the provided document context data.

RULES:
1. Do NOT use any outside knowledge. If the answer is not in the context, output exactly: "The document does not clearly state it."
2. Do NOT repeat or regurgitate the context verbatim. Formulate a direct, human-readable answer.
3. Keep the answer concise, plain-English, and helpful.
4. Do NOT generate new questions or simulate a conversation.
5. Answer the question directly without any preamble.
`.trim();

  const userPrompt = `
CONTEXT DATA:
\`\`\`json
${JSON.stringify({ chunks: retrievedChunks.map(c => c.content) })}
\`\`\`

USER QUESTION:
${question.trim()}
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