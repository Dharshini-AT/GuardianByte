const crypto = require('crypto');
const User = require('../models/User');
const Claim = require('../models/Claim');

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'GB' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Generate UTR (Unique Transaction Reference)
const generateUTR = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp.slice(-6) + random;
};

// Process payout to user
const processPayout = async (payoutData) => {
  try {
    const { userId, claimId, amount, claimNumber } = payoutData;
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate amount
    if (amount <= 0 || amount > 1000) {
      throw new Error('Invalid payout amount');
    }

    // Generate transaction details
    const transactionId = generateTransactionId();
    const utr = generateUTR();
    const paymentId = 'pay_' + crypto.randomBytes(16).toString('hex');

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate payment success (95% success rate for demo)
    const isSuccess = Math.random() < 0.95;

    if (!isSuccess) {
      throw new Error('Payment gateway temporarily unavailable');
    }

    const paymentResult = {
      success: true,
      data: {
        paymentId,
        transactionId,
        utr,
        amount,
        status: 'completed',
        paymentMethod: 'upi',
        processedAt: new Date(),
        beneficiary: {
          name: user.name,
          phone: user.phone,
          email: user.email
        },
        metadata: {
          claimNumber,
          processingTime: 'instant',
          gateway: 'MockUPI Gateway v2.0'
        }
      }
    };

    console.log(`💰 Payout processed: ₹${amount} to ${user.name} (${user.phone}) - TXN: ${transactionId}`);
    
    return paymentResult;

  } catch (error) {
    console.error('Payout processing error:', error);
    
    return {
      success: false,
      message: error.message || 'Payment processing failed',
      error: {
        code: 'PAYMENT_FAILED',
        details: error.message
      }
    };
  }
};

// Create Razorpay order for policy purchase
const createPaymentOrder = async (policyId, amount, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate order ID
    const orderId = 'order_' + crypto.randomBytes(12).toString('hex');
    
    // Mock Razorpay order creation
    const order = {
      id: orderId,
      entity: 'order',
      amount: amount * 100, // Razorpay uses paise
      amount_paid: 0,
      amount_due: amount * 100,
      currency: 'INR',
      receipt: `receipt_${policyId}`,
      status: 'created',
      attempts: 0,
      notes: {
        policyId: policyId.toString(),
        userId: userId.toString(),
        purpose: 'policy_purchase'
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    console.log(`💳 Created payment order: ${orderId} for ₹${amount}`);
    
    return {
      success: true,
      data: {
        order,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyIDHere',
        amount,
        currency: 'INR',
        name: 'GuardianByte Insurance',
        description: 'Weekly Policy Premium',
        image: 'https://example.com/logo.png',
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#3399cc'
        }
      }
    };

  } catch (error) {
    console.error('Create payment order error:', error);
    
    return {
      success: false,
      message: error.message || 'Failed to create payment order'
    };
  }
};

// Verify payment signature
const verifyPaymentSignature = async (orderId, paymentId, signature) => {
  try {
    // In production, this would verify Razorpay's webhook signature
    // For demo, we'll simulate verification
    
    // Mock payment data
    const payment = {
      id: paymentId,
      entity: 'payment',
      amount: 15000, // ₹150 in paise
      currency: 'INR',
      status: 'captured',
      order_id: orderId,
      invoice_id: null,
      international: false,
      method: 'upi',
      amount_refunded: 0,
      refund_status: null,
      captured: true,
      description: 'Weekly Policy Premium',
      card_id: null,
      bank: null,
      wallet: null,
      vpa: 'user@upi',
      email: 'user@example.com',
      contact: '+919876543210',
      notes: {},
      fee: 0,
      tax: 0,
      error_code: null,
      error_description: null,
      created_at: Math.floor(Date.now() / 1000)
    };

    // Simulate signature verification
    const isValid = Math.random() < 0.95; // 95% success rate

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    console.log(`✅ Payment verified: ${paymentId} for order ${orderId}`);
    
    return {
      success: true,
      data: {
        payment,
        verified: true
      }
    };

  } catch (error) {
    console.error('Payment verification error:', error);
    
    return {
      success: false,
      message: error.message || 'Payment verification failed'
    };
  }
};

// Process payment webhook
const processPaymentWebhook = async (webhookData) => {
  try {
    const { event, payload } = webhookData;
    
    console.log(`🪝 Processing webhook: ${event}`);

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return {
      success: true,
      message: 'Webhook processed successfully'
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return {
      success: false,
      message: error.message || 'Webhook processing failed'
    };
  }
};

// Handle successful payment
const handlePaymentCaptured = async (payment) => {
  try {
    const Policy = require('../models/Policy');
    
    // Extract policy ID from payment notes
    const policyId = payment.notes?.policyId;
    const userId = payment.notes?.userId;
    
    if (!policyId || !userId) {
      throw new Error('Missing policy or user information in payment');
    }

    // Update policy status
    const policy = await Policy.findById(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    policy.paymentStatus = 'paid';
    policy.status = 'active';
    policy.paymentId = payment.id;
    policy.orderId = payment.order_id;
    policy.startDate = new Date();
    policy.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    await policy.save();

    console.log(`💳 Payment captured and policy activated: ${policy.policyNumber}`);
    
  } catch (error) {
    console.error('Handle payment captured error:', error);
    throw error;
  }
};

// Handle failed payment
const handlePaymentFailed = async (payment) => {
  try {
    const Policy = require('../models/Policy');
    
    const policyId = payment.notes?.policyId;
    
    if (!policyId) {
      throw new Error('Missing policy information in failed payment');
    }

    // Update policy status
    const policy = await Policy.findById(policyId);
    if (policy) {
      policy.paymentStatus = 'failed';
      policy.status = 'pending';
      policy.paymentId = payment.id;
      policy.orderId = payment.order_id;
      
      await policy.save();
    }

    console.log(`❌ Payment failed for policy: ${policyId}`);
    
  } catch (error) {
    console.error('Handle payment failed error:', error);
    throw error;
  }
};

// Get payment statistics
const getPaymentStats = async (days = 30) => {
  try {
    const Policy = require('../models/Policy');
    const Claim = require('../models/Claim');
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Policy payment stats
    const policyPayments = await Policy.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalRevenue: { $sum: '$weeklyPremium' },
          avgPremium: { $avg: '$weeklyPremium' }
        }
      }
    ]);

    // Claim payout stats
    const claimPayouts = await Claim.aggregate([
      {
        $match: {
          'payment.paymentStatus': 'completed',
          claimDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          totalAmount: { $sum: '$payoutAmount' },
          avgPayout: { $avg: '$payoutAmount' }
        }
      }
    ]);

    return {
      policyPayments: policyPayments[0] || { totalPayments: 0, totalRevenue: 0, avgPremium: 0 },
      claimPayouts: claimPayouts[0] || { totalPayouts: 0, totalAmount: 0, avgPayout: 0 },
      lossRatio: policyPayments[0]?.totalRevenue > 0 
        ? ((claimPayouts[0]?.totalAmount || 0) / policyPayments[0].totalRevenue * 100).toFixed(2)
        : 0
    };

  } catch (error) {
    console.error('Get payment stats error:', error);
    return {
      policyPayments: { totalPayments: 0, totalRevenue: 0, avgPremium: 0 },
      claimPayouts: { totalPayouts: 0, totalAmount: 0, avgPayout: 0 },
      lossRatio: 0
    };
  }
};

// Refund payment (for cancelled policies)
const processRefund = async (policyId, amount, reason) => {
  try {
    const Policy = require('../models/Policy');
    
    const policy = await Policy.findById(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    if (policy.paymentStatus !== 'paid') {
      throw new Error('Cannot refund unpaid policy');
    }

    // Generate refund ID
    const refundId = 'refund_' + crypto.randomBytes(12).toString('hex');
    
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update policy
    policy.paymentStatus = 'refunded';
    policy.status = 'cancelled';
    
    await policy.save();

    console.log(`💸 Refund processed: ₹${amount} for policy ${policy.policyNumber}`);
    
    return {
      success: true,
      data: {
        refundId,
        amount,
        policyId: policy.policyNumber,
        reason,
        processedAt: new Date(),
        status: 'processed'
      }
    };

  } catch (error) {
    console.error('Process refund error:', error);
    
    return {
      success: false,
      message: error.message || 'Refund processing failed'
    };
  }
};

module.exports = {
  processPayout,
  createPaymentOrder,
  verifyPaymentSignature,
  processPaymentWebhook,
  getPaymentStats,
  processRefund,
  generateTransactionId,
  generateUTR
};
