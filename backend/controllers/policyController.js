const Policy = require('../models/Policy');
const User = require('../models/User');
const Claim = require('../models/Claim');
const axios = require('axios');
const { validationResult } = require('express-validator');

// Get premium calculation from ML service
const calculatePremium = async (zone, vehicleType, historicalClaims, dailyEarnings) => {
  try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL}/api/calculate-premium`, {
      zone,
      vehicleType,
      historicalClaims,
      dailyEarnings
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Premium calculation error:', error);
    // Fallback to basic calculation
    const zoneMultipliers = { 'Zone A (Bandra)': 1.3, 'Zone B (Andheri)': 1.0, 'Zone C (Navi Mumbai)': 0.7 };
    const vehicleMultipliers = { 'bike': 1.1, 'scooter': 1.0 };
    
    const basePremium = 150;
    const weeklyPremium = Math.round(basePremium * zoneMultipliers[zone] * vehicleMultipliers[vehicleType]);
    const dailyCoverage = Math.min(dailyEarnings, 800);
    const weeklyCoverage = dailyCoverage * 5;
    
    return {
      weeklyPremium,
      dailyCoverage,
      weeklyCoverage,
      riskAssessment: {
        zoneRisk: zoneMultipliers[zone] > 1.2 ? 'high' : zoneMultipliers[zone] > 0.9 ? 'medium' : 'low',
        vehicleRisk: vehicleMultipliers[vehicleType] > 1.05 ? 'high' : 'medium',
        riskScore: Math.round(weeklyPremium / 3),
        explanation: 'Fallback calculation due to ML service unavailability'
      }
    };
  }
};

// Create new policy
const createPolicy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { autoRenewal = true } = req.body;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has active policy
    const existingActivePolicy = await Policy.findOne({
      userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });

    if (existingActivePolicy) {
      return res.status(409).json({
        success: false,
        message: 'User already has an active policy'
      });
    }

    // Calculate premium using ML service
    const premiumData = await calculatePremium(
      user.zone,
      user.vehicleType,
      user.riskProfile.historicalClaims,
      user.dailyEarningsExpectation
    );

    // Create new policy
    const policy = new Policy({
      userId,
      weeklyPremium: premiumData.weeklyPremium,
      coverageAmountPerDay: premiumData.dailyCoverage,
      maxCoveragePerWeek: premiumData.weeklyCoverage,
      autoRenewal,
      riskAssessment: premiumData.riskAssessment,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    await policy.save();

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: { policy }
    });

  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create policy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's policies
const getUserPolicies = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const policies = await Policy.find(query)
      .populate('userId', 'name email phone zone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Policy.countDocuments(query);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get policy by ID
const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const policy = await Policy.findOne({ _id: id, userId })
      .populate('userId', 'name email phone zone vehicleType dailyEarningsExpectation')
      .populate('claims', 'claimNumber status claimedAmount eventDate claimDate');

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: { policy }
    });

  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update policy
const updatePolicy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user._id;
    const { autoRenewal, coveredTriggers } = req.body;

    const policy = await Policy.findOne({ _id: id, userId });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Only allow updating certain fields
    const updates = {};
    if (autoRenewal !== undefined) updates.autoRenewal = autoRenewal;
    if (coveredTriggers) updates.coveredTriggers = coveredTriggers;

    const updatedPolicy = await Policy.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone zone');

    res.json({
      success: true,
      message: 'Policy updated successfully',
      data: { policy: updatedPolicy }
    });

  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update policy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Cancel policy
const cancelPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    const policy = await Policy.findOne({ _id: id, userId });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    if (policy.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Policy is already cancelled'
      });
    }

    policy.status = 'cancelled';
    policy.autoRenewal = false;
    if (reason) {
      policy.metadata.cancellationReason = reason;
    }

    await policy.save();

    res.json({
      success: true,
      message: 'Policy cancelled successfully',
      data: { policy }
    });

  } catch (error) {
    console.error('Cancel policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel policy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Renew policy
const renewPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const policy = await Policy.findOne({ _id: id, userId });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    if (policy.status === 'active' && policy.endDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Policy is still active'
      });
    }

    // Calculate new premium (could change based on updated risk profile)
    const user = await User.findById(userId);
    const premiumData = await calculatePremium(
      user.zone,
      user.vehicleType,
      user.riskProfile.historicalClaims,
      user.dailyEarningsExpectation
    );

    // Create new policy period
    const newPolicy = new Policy({
      userId,
      weeklyPremium: premiumData.weeklyPremium,
      coverageAmountPerDay: premiumData.dailyCoverage,
      maxCoveragePerWeek: premiumData.weeklyCoverage,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      autoRenewal: policy.autoRenewal,
      riskAssessment: premiumData.riskAssessment,
      renewalCount: policy.renewalCount + 1,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web',
        previousPolicyId: policy._id
      }
    });

    await newPolicy.save();

    res.status(201).json({
      success: true,
      message: 'Policy renewed successfully',
      data: { policy: newPolicy }
    });

  } catch (error) {
    console.error('Renew policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew policy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Admin: Get all policies
const getAllPolicies = async (req, res) => {
  try {
    const { status, zone, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (zone) {
      const users = await User.find({ zone }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }

    const policies = await Policy.find(query)
      .populate('userId', 'name email phone zone vehicleType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Policy.countDocuments(query);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Admin: Get policy statistics
const getPolicyStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Policy.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPremium: { $sum: '$weeklyPremium' },
          avgPremium: { $avg: '$weeklyPremium' }
        }
      }
    ]);

    const zoneStats = await Policy.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.zone',
          count: { $sum: 1 },
          totalPremium: { $sum: '$weeklyPremium' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        zoneStats
      }
    });

  } catch (error) {
    console.error('Get policy stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createPolicy,
  getUserPolicies,
  getPolicyById,
  updatePolicy,
  cancelPolicy,
  renewPolicy,
  getAllPolicies,
  getPolicyStats
};
