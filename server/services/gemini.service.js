// server/services/gemini.service.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function embedText(text) {
  if (!text || !text.trim()) {
    throw new Error("embedText requires non-empty text");
  }

  const model = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent({
    content: {
      role: "user",
      parts: [{ text }],
    },
    taskType: "RETRIEVAL_DOCUMENT",
  });

  return result.embedding.values;
}

async function embedQuery(text) {
  if (!text || !text.trim()) {
    throw new Error("embedQuery requires non-empty text");
  }

  const model = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent({
    content: {
      role: "user",
      parts: [{ text }],
    },
    taskType: "RETRIEVAL_QUERY",
  });

  return result.embedding.values;
}

module.exports = {
  embedText,
  embedQuery,
};