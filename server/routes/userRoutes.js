const express = require('express');
const { body } = require('express-validator');
const {
  getMe,
  updateMe,
  updatePassword,
  deleteMe,
} = require('../controllers/userController');
const { protect } = require('../middleware/protect');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);

router.put(
  '/me',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required'),
  ],
  handleValidationErrors,
  updateMe
);

router.put(
  '/me/password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  handleValidationErrors,
  updatePassword
);

router.delete('/me', deleteMe);

module.exports = router;