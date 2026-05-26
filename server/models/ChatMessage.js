// server/models/ChatMessage.js
const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    sourceChunks: [
      {
        chunkIndex: Number,
        content: String,
        score: Number,
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatMessageSchema.index({ documentId: 1, userId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);