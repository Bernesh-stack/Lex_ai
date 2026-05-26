// server/services/chromadb.service.js
const { ChromaClient } = require("chromadb");

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

async function getOrCreateDocCollection(docId) {
  const collectionName = String(docId);

  const collection = await chroma.getOrCreateCollection({
    name: collectionName,
    metadata: {
      description: `LexAI vectors for document ${collectionName}`,
    },
  });

  return collection;
}

async function upsertChunks(docId, chunks, embeddings) {
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new Error("upsertChunks requires non-empty chunks array");
  }

  if (!Array.isArray(embeddings) || embeddings.length !== chunks.length) {
    throw new Error("embeddings length must match chunks length");
  }

  const collection = await getOrCreateDocCollection(docId);

  const ids = chunks.map((chunk) => `${docId}_chunk_${chunk.chunkIndex}`);
  const documents = chunks.map((chunk) => chunk.content);
  const metadatas = chunks.map((chunk) => ({
    docId: String(docId),
    chunkIndex: chunk.chunkIndex,
    startChar: chunk.startChar ?? 0,
    endChar: chunk.endChar ?? 0,
  }));

  await collection.upsert({
    ids,
    documents,
    embeddings,
    metadatas,
  });

  return { inserted: chunks.length };
}

async function queryChunks(docId, queryEmbedding, topK = 5) {
  const collection = await getOrCreateDocCollection(docId);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const ids = results.ids?.[0] || [];
  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  return ids.map((id, i) => ({
    id,
    content: documents[i],
    metadata: metadatas[i],
    score: distances[i],
  }));
}

async function deleteDocCollection(docId) {
  try {
    await chroma.deleteCollection({ name: String(docId) });
  } catch (error) {
    if (!String(error.message || "").includes("does not exist")) {
      throw error;
    }
  }
}

module.exports = {
  getOrCreateDocCollection,
  upsertChunks,
  queryChunks,
  deleteDocCollection,
};