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

    // Day 5 fields can stay optional for now
    simplifiedText: {
      type: String,
      default: '',
    },
    aiRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
    aiRiskReason: {
      type: String,
      default: '',
    },
    keywordRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
    triggeredKeywords: {
      type: [String],
      default: [],
    },
    finalRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
    finalRiskReason: {
      type: String,
      default: '',
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