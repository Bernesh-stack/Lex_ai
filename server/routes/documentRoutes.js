const express = require('express');
const { param } = require('express-validator');
const upload = require('../utils/gridfsStorage');
const { protect } = require('../middleware/protect');
const { handleValidationErrors: validate } = require('../middleware/validate');
const {
  uploadDocument,
  getDocumentFile,
  analyseDocument,
  getDocuments,
  getDocumentStatus,
  deleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

// Upload document
router.post('/upload', protect, upload.single('file'), uploadDocument);

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

// Get all documents
router.get('/', protect, getDocuments);

// Get document status
router.get(
  '/:id/status',
  protect,
  [param('id').isMongoId().withMessage('Valid document id is required')],
  validate,
  getDocumentStatus
);

// Delete document
router.delete(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Valid document id is required')],
  validate,
  deleteDocument
);

module.exports = router;