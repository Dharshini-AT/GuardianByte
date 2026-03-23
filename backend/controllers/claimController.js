const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const User = require('../models/User');
const TriggerEvent = require('../models/TriggerEvent');
const axios = require('axios');
const { validationResult } = require('express-validator');

// Create automated claim from trigger
const createAutoClaim = async (userId, policyId, triggerEventId, triggerType, eventDate, claimedAmount) => {
  try {
    // Check for duplicate claims
    const existingClaim = await Claim.findDuplicates(userId, eventDate, triggerType);
    if (existingClaim) {
      console.log(`⚠️ Duplicate claim detected for user ${userId} on ${eventDate}`);
      return null;
    }

    const claim = new Claim({
      userId,
      policyId,
      triggerEventId,
      triggerType,
      eventDate,
      claimedAmount,
      status: 'pending',
      processing: {
        autoApproved: false
      },
      metadata: {
        source: 'auto'
      }
    });

    await claim.save();
    
    // Run fraud detection
    await runFraudCheck(claim);
    
    // Process claim based on fraud check results
    await processClaim(claim);
    
    return claim;

  } catch (error) {
    console.error('Auto claim creation error:', error);
    return null;
  }
};

// Run fraud detection on claim
const runFraudCheck = async (claim) => {
  try {
    const user = await User.findById(claim.userId);
    const triggerEvent = await TriggerEvent.findById(claim.triggerEventId);
    
    if (!user || !triggerEvent) {
      console.error('Missing user or trigger event for fraud check');
      return;
    }

    // Get user's work hours (default 9-6)
    const workHours = user.preferences?.workHours || { start: '09:00', end: '18:00' };
    
    // Get monthly claims count
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyClaims = await Claim.countDocuments({
      userId: claim.userId,
      claimDate: { $gte: oneMonthAgo },
      status: { $in: ['approved', 'paid'] }
    });

    // Prepare fraud check data
    const fraudCheckData = {
      userZone: user.zone,
      claimZone: triggerEvent.affectedZones[0] || user.zone,
      claimTime: claim.eventDate.toISOString(),
      userWorkHours: workHours,
      monthlyClaims,
      claimAmount: claim.claimedAmount,
      weatherData: triggerEvent.measurements.weather ? {
        matchesTrigger: true,
        temperature: triggerEvent.measurements.weather.temperature?.current,
        rainfall: triggerEvent.measurements.weather.rainfall?.amount,
        aqi: triggerEvent.measurements.weather.aqi?.value
      } : { matchesTrigger: true }
    };

    // Call ML service for fraud detection
    const response = await axios.post(`${process.env.ML_SERVICE_URL}/api/fraud-check`, fraudCheckData);
    const fraudResult = response.data.data;

    // Update claim with fraud analysis
    claim.fraudScore = fraudResult.fraudScore;
    claim.fraudAnalysis = {
      locationMatch: fraudResult.analysis.locationMatch,
      timingMatch: fraudResult.analysis.timingMatch,
      frequencyCheck: fraudResult.analysis.frequencyCheck,
      anomalies: fraudResult.anomalies,
      riskFactors: fraudResult.riskFactors,
      explanation: fraudResult.analysis.explanation
    };

    // Update verification data
    claim.verificationData = {
      weatherData: fraudCheckData.weatherData,
      gpsLocation: {
        latitude: 19.0760 + Math.random() * 0.1,
        longitude: 72.8777 + Math.random() * 0.1,
        accuracy: 10,
        timestamp: claim.eventDate
      }
    };

    await claim.save();

  } catch (error) {
    console.error('Fraud check error:', error);
    // Set default fraud score on error
    claim.fraudScore = 50;
    claim.fraudAnalysis = {
      locationMatch: true,
      timingMatch: true,
      frequencyCheck: true,
      anomalies: ['Fraud check failed'],
      explanation: 'Fraud detection service unavailable'
    };
    await claim.save();
  }
};

// Process claim based on fraud check
const processClaim = async (claim) => {
  try {
    const policy = await Policy.findById(claim.policyId);
    
    if (!policy) {
      console.error('Policy not found for claim processing');
      return;
    }

    // Auto-approve if fraud score is low
    if (claim.fraudScore < 50) {
      claim.approve(claim.claimedAmount); // Auto-approved
      claim.status = 'approved';
      
      // Update policy
      policy.totalClaims += 1;
      policy.weeklyPayoutsUsed += claim.claimedAmount;
      policy.totalPayouts += claim.claimedAmount;
      policy.lastClaimDate = claim.eventDate;
      
      await policy.save();
      
      // Process payment
      await processClaimPayment(claim);
      
      console.log(`✅ Auto-approved claim ${claim.claimNumber} for ₹${claim.claimedAmount}`);
      
    } else if (claim.fraudScore >= 70) {
      // Flag for manual review
      claim.flagForFraud(claim.fraudScore, claim.fraudAnalysis);
      console.log(`🚩 Flagged claim ${claim.claimNumber} for fraud review (score: ${claim.fraudScore})`);
      
    } else {
      // Moderate risk - approve but flag for review
      claim.approve(claim.claimedAmount);
      claim.status = 'approved';
      claim.fraudAnalysis.riskFactors.push('moderate_risk');
      
      // Update policy
      policy.totalClaims += 1;
      policy.weeklyPayoutsUsed += claim.claimedAmount;
      policy.totalPayouts += claim.claimedAmount;
      policy.lastClaimDate = claim.eventDate;
      
      await policy.save();
      
      // Process payment
      await processClaimPayment(claim);
      
      console.log(`⚠️ Approved claim ${claim.claimNumber} with moderate risk (score: ${claim.fraudScore})`);
    }

    await claim.save();

  } catch (error) {
    console.error('Claim processing error:', error);
  }
};

// Process claim payment
const processClaimPayment = async (claim) => {
  try {
    const payoutService = require('./payoutService');
    
    const paymentResult = await payoutService.processPayout({
      userId: claim.userId,
      claimId: claim._id,
      amount: claim.approvedAmount || claim.claimedAmount,
      claimNumber: claim.claimNumber
    });

    if (paymentResult.success) {
      claim.processPayment({
        paymentId: paymentResult.data.paymentId,
        transactionId: paymentResult.data.transactionId,
        paymentStatus: 'completed',
        paymentMethod: 'upi',
        utr: paymentResult.data.utr
      });
      
      console.log(`💰 Payment processed for claim ${claim.claimNumber}: ${paymentResult.data.transactionId}`);
    } else {
      claim.payment.paymentStatus = 'failed';
      console.error(`❌ Payment failed for claim ${claim.claimNumber}: ${paymentResult.message}`);
    }

    await claim.save();

  } catch (error) {
    console.error('Payment processing error:', error);
    claim.payment.paymentStatus = 'failed';
    await claim.save();
  }
};

// Get user's claims
const getUserClaims = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate('policyId', 'policyNumber weeklyPremium')
      .populate('triggerEventId', 'eventType title eventStart')
      .sort({ claimDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Claim.countDocuments(query);

    res.json({
      success: true,
      data: {
        claims,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claims',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get claim by ID
const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findOne({ _id: id, userId })
      .populate('policyId', 'policyNumber weeklyPremium coverageAmountPerDay')
      .populate('triggerEventId', 'eventType title description eventStart eventEnd')
      .populate('userId', 'name phone email zone');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    res.json({
      success: true,
      data: { claim }
    });

  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claim',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Admin: Get all claims
const getAllClaims = async (req, res) => {
  try {
    const { status, fraudScoreMin, fraudScoreMax, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (fraudScoreMin !== undefined) query.fraudScore = { $gte: parseInt(fraudScoreMin) };
    if (fraudScoreMax !== undefined) {
      query.fraudScore = query.fraudScore || {};
      query.fraudScore.$lte = parseInt(fraudScoreMax);
    }

    const claims = await Claim.find(query)
      .populate('userId', 'name phone email zone')
      .populate('policyId', 'policyNumber weeklyPremium')
      .populate('triggerEventId', 'eventType title eventStart')
      .sort({ claimDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Claim.countDocuments(query);

    res.json({
      success: true,
      data: {
        claims,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claims',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Admin: Review flagged claim
const reviewClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, approvedAmount } = req.body;
    const reviewerId = req.user._id;

    const claim = await Claim.findById(id)
      .populate('policyId')
      .populate('userId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    if (claim.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot review a paid claim'
      });
    }

    if (action === 'approve') {
      const amount = approvedAmount || claim.claimedAmount;
      claim.approve(amount, reviewerId);
      claim.processing.reviewNotes = notes;
      
      // Update policy
      const policy = claim.policyId;
      policy.totalClaims += 1;
      policy.weeklyPayoutsUsed += amount;
      policy.totalPayouts += amount;
      policy.lastClaimDate = claim.eventDate;
      await policy.save();
      
      // Process payment
      await processClaimPayment(claim);
      
    } else if (action === 'reject') {
      claim.reject(notes, reviewerId);
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    await claim.save();

    res.json({
      success: true,
      message: `Claim ${action}d successfully`,
      data: { claim }
    });

  } catch (error) {
    console.error('Review claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review claim',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Admin: Get claim statistics
const getClaimStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.claimDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Claim.getStats(
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    const fraudStats = await Claim.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          avgFraudScore: { $avg: '$fraudScore' },
          flaggedClaims: { $sum: { $cond: [{ $gte: ['$fraudScore', 70] }, 1, 0] } },
          autoApproved: { $sum: { $cond: ['$processing.autoApproved', 1, 0] } },
          totalPayout: { $sum: '$payoutAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        fraudStats: fraudStats[0] || {
          totalClaims: 0,
          avgFraudScore: 0,
          flaggedClaims: 0,
          autoApproved: 0,
          totalPayout: 0
        }
      }
    });

  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claim statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createAutoClaim,
  getUserClaims,
  getClaimById,
  getAllClaims,
  reviewClaim,
  getClaimStats,
  runFraudCheck,
  processClaim
};
