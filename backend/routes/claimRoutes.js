const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const claimController = require('../controllers/claimController');
const { authenticateToken, requireAdmin } = require('../config/auth');

// Validation rules
const reviewClaimValidation = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('approvedAmount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Approved amount must be a non-negative integer')
];

// Protected routes
router.get('/', authenticateToken, claimController.getUserClaims);
router.get('/:id', authenticateToken, claimController.getClaimById);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, claimController.getAllClaims);
router.post('/admin/:id/review', authenticateToken, requireAdmin, reviewClaimValidation, claimController.reviewClaim);
router.get('/admin/stats', authenticateToken, requireAdmin, claimController.getClaimStats);

module.exports = router;
