const express = require('express');
const { param } = require('express-validator');
const upload = require('../utils/gridfsStorage');
const { protect } = require('../middleware/protect');
const { handleValidationErrors: validate } = require('../middleware/validate');
const {
  uploadDocument,
  getDocument,
  getDocumentFile,
  analyseDocument,
} = require('../controllers/documentController');

const router = express.Router();

// Upload document
router.post('/upload', protect, upload.single('file'), uploadDocument);

// Get document details/status
router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Valid document id is required')],
  validate,
  getDocument
);

// Get document file
router.get(
  '/:id/file',
  protect,
  [param('id').isMongoId().withMessage('Valid document id is required')],
  validate,
  getDocumentFile
);

// Analyse document
router.post(
  '/:id/analyse',
  protect,
  [param('id').isMongoId().withMessage('Valid document id is required')],
  validate,
  analyseDocument
);

module.exports = router;