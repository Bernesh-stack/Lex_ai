// server/routes/chat.routes.js
const express = require("express");
const { body, param } = require("express-validator");
const {
  postChatMessage,
  getChatHistory,
  clearChatHistory,
} = require("../controllers/chat.controller");
const protect = require("../middleware/protect");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.post(
  "/:docId",
  [
    param("docId").isMongoId().withMessage("Invalid document id"),
    body("question")
      .trim()
      .notEmpty()
      .withMessage("Question is required")
      .isLength({ min: 3, max: 2000 })
      .withMessage("Question must be between 3 and 2000 characters"),
    validate,
  ],
  postChatMessage
);

router.get(
  "/:docId",
  [param("docId").isMongoId().withMessage("Invalid document id"), validate],
  getChatHistory
);

router.delete(
  "/:docId",
  [param("docId").isMongoId().withMessage("Invalid document id"), validate],
  clearChatHistory
);

module.exports = router;