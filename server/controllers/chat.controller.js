// server/controllers/chat.controller.js
const mongoose = require("mongoose");
const ChatMessage = require("../models/ChatMessage");
const Document = require("../models/Document");
const { answerQuestionFromDocument } = require("../services/rag.service");

async function postChatMessage(req, res, next) {
  try {
    const { docId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const document = await Document.findOne({
      _id: docId,
      userId,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.status !== "ready") {
      return res.status(400).json({
        message: "Document is not ready for chat yet",
      });
    }

    const userMessage = await ChatMessage.create({
      documentId: docId,
      userId,
      role: "user",
      content: question.trim(),
    });

    const ragResult = await answerQuestionFromDocument({
      docId,
      question: question.trim(),
      topK: 5,
    });

    const assistantMessage = await ChatMessage.create({
      documentId: docId,
      userId,
      role: "assistant",
      content: ragResult.answer,
      sourceChunks: ragResult.sourceChunks,
    });

    return res.status(200).json({
      message: "Chat answer generated",
      reply: assistantMessage.content,
      data: {
        userMessage,
        assistantMessage,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getChatHistory(req, res, next) {
  try {
    const { docId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    const document = await Document.findOne({
      _id: docId,
      userId,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const messages = await ChatMessage.find({
      documentId: docId,
      userId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      message: "Chat history fetched",
      messages,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

async function clearChatHistory(req, res, next) {
  try {
    const { docId } = req.params;
    const userId = req.user.id;

    await ChatMessage.deleteMany({
      documentId: docId,
      userId,
    });

    return res.status(200).json({
      message: "Chat history cleared",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  postChatMessage,
  getChatHistory,
  clearChatHistory,
};