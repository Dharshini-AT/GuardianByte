const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const policyController = require('../controllers/policyController');
const { authenticateToken, requireAdmin } = require('../config/auth');

// Validation rules
const createPolicyValidation = [
  body('autoRenewal')
    .optional()
    .isBoolean()
    .withMessage('Auto renewal must be a boolean')
];

const updatePolicyValidation = [
  body('autoRenewal')
    .optional()
    .isBoolean()
    .withMessage('Auto renewal must be a boolean'),
  body('coveredTriggers')
    .optional()
    .isArray()
    .withMessage('Covered triggers must be an array'),
  body('coveredTriggers.*.type')
    .optional()
    .isIn(['heavy_rain', 'extreme_heat', 'air_pollution', 'curfew', 'platform_outage'])
    .withMessage('Invalid trigger type'),
  body('coveredTriggers.*.isActive')
    .optional()
    .isBoolean()
    .withMessage('Trigger active status must be a boolean')
];

const cancelPolicyValidation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Protected routes
router.post('/', authenticateToken, createPolicyValidation, policyController.createPolicy);
router.get('/', authenticateToken, policyController.getUserPolicies);
router.get('/:id', authenticateToken, policyController.getPolicyById);
router.put('/:id', authenticateToken, updatePolicyValidation, policyController.updatePolicy);
router.post('/:id/cancel', authenticateToken, cancelPolicyValidation, policyController.cancelPolicy);
router.post('/:id/renew', authenticateToken, policyController.renewPolicy);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, policyController.getAllPolicies);
router.get('/admin/stats', authenticateToken, requireAdmin, policyController.getPolicyStats);

module.exports = router;
