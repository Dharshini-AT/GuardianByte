const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const payoutService = require('../services/payoutService');
const { authenticateToken, requireAdmin } = require('../config/auth');

// Validation rules
const createOrderValidation = [
  body('policyId')
    .isMongoId()
    .withMessage('Valid policy ID is required'),
  body('amount')
    .isInt({ min: 100, max: 500 })
    .withMessage('Amount must be between ₹100 and ₹500')
];

const verifyPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('signature')
    .notEmpty()
    .withMessage('Payment signature is required')
];

const refundValidation = [
  body('policyId')
    .isMongoId()
    .withMessage('Valid policy ID is required'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Refund amount must be positive'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

// Protected routes
router.post('/create-order', authenticateToken, createOrderValidation, async (req, res) => {
  try {
    const { policyId, amount } = req.body;
    const userId = req.user._id;

    const result = await payoutService.createPaymentOrder(policyId, amount, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/verify', authenticateToken, verifyPaymentValidation, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const result = await payoutService.verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Webhook endpoint (no authentication required for webhooks)
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature in production
    const webhookData = {
      event: req.body.event,
      payload: req.body
    };

    const result = await payoutService.processPaymentWebhook(webhookData);
    
    // Always return 200 to webhook service
    res.status(200).json({
      success: result.success,
      message: result.message
    });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent webhook retries
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Admin routes
router.post('/refund', authenticateToken, requireAdmin, refundValidation, async (req, res) => {
  try {
    const { policyId, amount, reason } = req.body;

    const result = await payoutService.processRefund(policyId, amount, reason);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await payoutService.getPaymentStats(parseInt(days));

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
