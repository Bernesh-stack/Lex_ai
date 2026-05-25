const mongoose = require('mongoose');

const clauseSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    clauseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    simplifiedText: {
      type: String,
      required: true,
    },
    aiRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    aiRiskReason: {
      type: String,
      required: true,
    },
    keywordRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    triggeredKeywords: {
      type: [String],
      required: true,
      default: [],
    },
    finalRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    finalRiskReason: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    charStart: {
      type: Number,
      required: true,
    },
    charEnd: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clause', clauseSchema);