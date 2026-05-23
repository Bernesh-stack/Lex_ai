const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    gridfsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'extracting', 'scanned', 'analysing', 'ready', 'error'],
      default: 'pending',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      default: '',
      select: false,
    },
    riskScore: {
      type: Number,
      default: null,
    },
    shareToken: {
      type: String,
      default: null,
    },
    shareExpiry: {
      type: Date,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);