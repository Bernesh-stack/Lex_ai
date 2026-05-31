// server/services/chromadb.service.js
const Chunk = require('../models/Chunk');

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function upsertChunks(docId, chunks, embeddings) {
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new Error("upsertChunks requires non-empty chunks array");
  }

  if (!Array.isArray(embeddings) || embeddings.length !== chunks.length) {
    throw new Error("embeddings length must match chunks length");
  }

  const chunkDocs = chunks.map((chunk, i) => ({
    documentId: docId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    embedding: embeddings[i],
    startChar: chunk.startChar ?? 0,
    endChar: chunk.endChar ?? 0,
  }));

  await Chunk.deleteMany({ documentId: docId });
  await Chunk.insertMany(chunkDocs);

  return { inserted: chunks.length };
}

async function queryChunks(docId, queryEmbedding, topK = 5) {
  const chunks = await Chunk.find({ documentId: docId });
  
  const scoredChunks = chunks.map(chunk => {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      id: chunk._id.toString(),
      content: chunk.content,
      metadata: {
        docId: String(docId),
        chunkIndex: chunk.chunkIndex,
        startChar: chunk.startChar,
        endChar: chunk.endChar
      },
      score
    };
  });

  // Sort descending by similarity
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK);
}

async function deleteDocCollection(docId) {
  await Chunk.deleteMany({ documentId: docId });
}

// Dummy for compat
async function getOrCreateDocCollection() {
  return {};
}

module.exports = {
  getOrCreateDocCollection,
  upsertChunks,
  queryChunks,
  deleteDocCollection,
};