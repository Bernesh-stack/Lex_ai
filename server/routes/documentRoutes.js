const express = require('express');
const { param } = require('express-validator');
const upload = require('../utils/gridfsStorage');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadDocument,
  getDocumentFile,
} = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadDocument);

router.get(
  '/:id/file',
  protect,
  param('id').isMongoId().withMessage('Invalid document id'),
  getDocumentFile
);

module.exports = router;