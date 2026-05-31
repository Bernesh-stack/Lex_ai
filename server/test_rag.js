require('dotenv').config();
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const Chunk = require('./models/Chunk');
const Document = require('./models/Document');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const docs = await Document.find({ fileName: /test-doc-1/ });
  const chunks = await Chunk.find({ documentId: docs[0]._id });
  
  const context = chunks[0].content;
  const question = 'How many days of written notice are required for either party to terminate this agreement?';
  
  const messages = [
    { 
      role: 'system', 
      content: `You are an AI legal document assistant. Answer the user's question using ONLY the provided context. Do NOT generate new questions or repeat the context.\n\nContext:\n\`\`\`json\n${JSON.stringify({ text: context })}\n\`\`\``
    },
    { role: 'user', content: question }
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      messages: messages,
    });
    console.log('Response:', completion.choices[0].message.content);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
