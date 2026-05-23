const express = require('express');
const { param } = require('express-validator');
const upload = require('../utils/gridfsStorage');
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validate');
const {
  uploadDocument,
  getDocumentFile,
  analyseDocument,
} = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadDocument);

router.get(
  '/:id/file',
  protect,
  param('id').isMongoId().withMessage('Invalid document id'),
  handleValidationErrors,
  getDocumentFile
);

router.post(
  '/:id/analyse',
  protect,
  param('id').isMongoId().withMessage('Invalid document id'),
  handleValidationErrors,
  analyseDocument
);

module.exports = router;