const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  startChar: {
    type: Number,
    default: 0,
  },
  endChar: {
    type: Number,
    default: 0,
  }
});

chunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('Chunk', chunkSchema);
