const User = require('../models/User');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const TriggerEvent = require('../models/TriggerEvent');
const claimService = require('../services/claimService');
const payoutService = require('../services/payoutService');
const weatherService = require('../services/weatherService');
const triggerMonitor = require('../services/triggerMonitor');

// Get user dashboard data
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's active policy
    const activePolicy = await Policy.findOne({
      userId,
      status: 'active',
      paymentStatus: 'paid',
      endDate: { $gte: new Date() }
    }).populate('userId', 'name zone vehicleType dailyEarningsExpectation');

    // Get user's recent claims
    const recentClaims = await Claim.find({ userId })
      .populate('triggerEventId', 'eventType title eventStart')
      .sort({ claimDate: -1 })
      .limit(5);

    // Get claims summary
    const { summary } = await claimService.getUserClaimsSummary(userId, 30);

    // Calculate earnings protected
    const earningsProtected = summary?.totalPayout || 0;
    const weeklyCoverage = activePolicy?.coverageAmountPerDay * 5 || 0;

    // Get active triggers affecting user's zone
    const userZone = activePolicy?.userId?.zone;
    let activeTriggers = [];
    if (userZone) {
      activeTriggers = await TriggerEvent.find({
        affectedZones: userZone,
        isActive: true,
        eventEnd: { $gte: new Date() }
      }).sort({ severity: -1 });
    }

    const dashboardData = {
      user: activePolicy?.userId,
      policy: activePolicy,
      recentClaims,
      summary: {
        earningsProtected,
        weeklyCoverage,
        totalClaims: summary?.totalClaims || 0,
        approvedClaims: summary?.approvedClaims || 0,
        avgFraudScore: summary?.avgFraudScore || 0
      },
      activeTriggers,
      coverageStatus: {
        isActive: !!activePolicy,
        daysRemaining: activePolicy?.daysRemaining || 0,
        weeklyPayoutsUsed: activePolicy?.weeklyPayoutsUsed || 0,
        maxWeeklyCoverage: activePolicy?.maxCoveragePerWeek || 0
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get admin dashboard data
const getAdminDashboard = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    // Get overall statistics
    const [
      totalUsers,
      activePolicies,
      totalClaims,
      activeTriggers
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Policy.countDocuments({ status: 'active', paymentStatus: 'paid' }),
      Claim.countDocuments({ claimDate: { $gte: startDate } }),
      TriggerEvent.countDocuments({ isActive: true })
    ]);

    // Get payment statistics
    const paymentStats = await payoutService.getPaymentStats(daysNum);

    // Get claim trends
    const claimTrends = await claimService.getClaimTrends(daysNum);

    // Get flagged claims for review
    const flaggedClaims = await claimService.getFlaggedClaims(70);

    // Get zone-wise statistics
    const zoneStats = await Policy.aggregate([
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
          totalPolicies: { $sum: 1 },
          activePolicies: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalPremium: { $sum: '$weeklyPremium' },
          totalClaims: { $sum: '$totalClaims' },
          totalPayouts: { $sum: '$totalPayouts' }
        }
      }
    ]);

    // Get trigger event statistics
    const triggerStats = await TriggerEvent.getStats(startDate, new Date());

    // Get recent activities
    const recentActivities = await Claim.aggregate([
      { $match: { claimDate: { $gte: startDate } } },
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
        $lookup: {
          from: 'triggerevents',
          localField: 'triggerEventId',
          foreignField: '_id',
          as: 'trigger'
        }
      },
      { $unwind: '$trigger' },
      {
        $project: {
          type: 'claim',
          description: `Claim ${claim.status === 'approved' ? 'approved' : 'filed'} for ${claim.trigger.eventType}`,
          amount: claim.claimedAmount,
          status: claim.status,
          user: '$user.name',
          zone: '$user.zone',
          timestamp: claim.claimDate,
          fraudScore: claim.fraudScore
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 10 }
    ]);

    // Get monitoring status
    const monitoringStatus = triggerMonitor.getMonitoringStatus();

    const dashboardData = {
      overview: {
        totalUsers,
        activePolicies,
        totalClaims,
        activeTriggers,
        lossRatio: parseFloat(paymentStats.lossRatio)
      },
      financials: {
        totalRevenue: paymentStats.policyPayments.totalRevenue,
        totalPayouts: paymentStats.claimPayouts.totalAmount,
        avgPremium: paymentStats.policyPayments.avgPremium,
        avgPayout: paymentStats.claimPayouts.avgPayout
      },
      analytics: {
        claimTrends,
        zoneStats,
        triggerStats,
        flaggedClaimsCount: flaggedClaims.length
      },
      alerts: {
        flaggedClaims,
        highRiskZones: zoneStats.filter(zone => zone.totalPayouts > zone.totalPremium * 0.8),
        monitoringStatus
      },
      activities: recentActivities
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    const { type, startDate, endDate, zone } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let analyticsData = {};

    switch (type) {
      case 'claims':
        analyticsData = await getClaimsAnalytics(start, end, zone);
        break;
      
      case 'policies':
        analyticsData = await getPoliciesAnalytics(start, end, zone);
        break;
      
      case 'revenue':
        analyticsData = await getRevenueAnalytics(start, end, zone);
        break;
      
      case 'triggers':
        analyticsData = await getTriggersAnalytics(start, end, zone);
        break;
      
      default:
        analyticsData = await getOverviewAnalytics(start, end, zone);
    }

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper functions for analytics
const getClaimsAnalytics = async (start, end, zone) => {
  const matchStage = {
    claimDate: { $gte: start, $lte: end }
  };
  
  if (zone) {
    const users = await User.find({ zone }).select('_id');
    matchStage.userId = { $in: users.map(u => u._id) };
  }

  const [
    claimsByStatus,
    claimsByType,
    claimsByZone,
    fraudDistribution,
    dailyClaims
  ] = await Promise.all([
    Claim.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$claimedAmount' } } }
    ]),
    Claim.aggregate([
      { $match: matchStage },
      { $group: { _id: '$triggerType', count: { $sum: 1 }, totalAmount: { $sum: '$claimedAmount' } } }
    ]),
    Claim.aggregate([
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
      { $group: { _id: '$user.zone', count: { $sum: 1 }, totalAmount: { $sum: '$claimedAmount' } } }
    ]),
    Claim.aggregate([
      { $match: matchStage },
      {
        $bucket: {
          groupBy: '$fraudScore',
          boundaries: [0, 25, 50, 75, 100],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    Claim.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$claimDate' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$claimedAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    claimsByStatus,
    claimsByType,
    claimsByZone,
    fraudDistribution,
    dailyClaims
  };
};

const getPoliciesAnalytics = async (start, end, zone) => {
  const matchStage = {
    createdAt: { $gte: start, $lte: end }
  };
  
  if (zone) {
    const users = await User.find({ zone }).select('_id');
    matchStage.userId = { $in: users.map(u => u._id) };
  }

  const [
    policiesByStatus,
    policiesByZone,
    premiumDistribution,
    dailyPolicies
  ] = await Promise.all([
    Policy.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 }, totalPremium: { $sum: '$weeklyPremium' } } }
    ]),
    Policy.aggregate([
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
      { $group: { _id: '$user.zone', count: { $sum: 1 }, totalPremium: { $sum: '$weeklyPremium' } } }
    ]),
    Policy.aggregate([
      { $match: matchStage },
      {
        $bucket: {
          groupBy: '$weeklyPremium',
          boundaries: [100, 200, 300, 400, 500],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    Policy.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalPremium: { $sum: '$weeklyPremium' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    policiesByStatus,
    policiesByZone,
    premiumDistribution,
    dailyPolicies
  };
};

const getRevenueAnalytics = async (start, end, zone) => {
  const paymentStats = await payoutService.getPaymentStats(
    Math.ceil((end - start) / (24 * 60 * 60 * 1000))
  );

  return paymentStats;
};

const getTriggersAnalytics = async (start, end, zone) => {
  const matchStage = {
    eventStart: { $gte: start, $lte: end }
  };
  
  if (zone) {
    matchStage.affectedZones = zone;
  }

  const [
    triggersByType,
    triggersBySeverity,
    triggersByZone,
    dailyTriggers
  ] = await Promise.all([
    TriggerEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: '$eventType', count: { $sum: 1 }, avgDuration: { $avg: { $subtract: ['$eventEnd', '$eventStart'] } } } }
    ]),
    TriggerEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    TriggerEvent.aggregate([
      { $match: matchStage },
      { $unwind: '$affectedZones' },
      { $group: { _id: '$affectedZones', count: { $sum: 1 } } }
    ]),
    TriggerEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$eventStart' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    triggersByType,
    triggersBySeverity,
    triggersByZone,
    dailyTriggers
  };
};

const getOverviewAnalytics = async (start, end, zone) => {
  const [claims, policies, triggers] = await Promise.all([
    getClaimsAnalytics(start, end, zone),
    getPoliciesAnalytics(start, end, zone),
    getTriggersAnalytics(start, end, zone)
  ]);

  return { claims, policies, triggers };
};

// Fraud alerts for admin
const getFraudAlerts = async (req, res) => {
  try {
    const { minScore = 70, status = 'flagged' } = req.query;
    
    const flaggedClaims = await Claim.find({
      fraudScore: { $gte: parseInt(minScore) },
      status: status === 'all' ? { $in: ['flagged', 'pending'] } : status
    })
      .populate('userId', 'name phone email zone')
      .populate('policyId', 'policyNumber weeklyPremium')
      .populate('triggerEventId', 'eventType title eventStart')
      .sort({ fraudScore: -1, claimDate: -1 });

    // Get fraud statistics
    const fraudStats = {
      totalFlagged: flaggedClaims.length,
      highRisk: flaggedClaims.filter(c => c.fraudScore >= 80).length,
      mediumRisk: flaggedClaims.filter(c => c.fraudScore >= 60 && c.fraudScore < 80).length,
      lowRisk: flaggedClaims.filter(c => c.fraudScore >= 40 && c.fraudScore < 60).length
    };

    res.json({
      success: true,
      data: {
        flaggedClaims,
        fraudStats
      }
    });

  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fraud alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getUserDashboard,
  getAdminDashboard,
  getAnalytics,
  getFraudAlerts
};
