import express from 'express';
import { body } from 'express-validator';
import {
  getMe,
  updateMe,
  updatePassword,
  deleteMe,
} from '../controllers/userController.js';
import { protect } from '../middleware/protect.js';
import { handleValidationErrors } from '../middleware/validate.js';

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

export default router;