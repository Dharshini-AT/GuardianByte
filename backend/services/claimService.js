const Claim = require('../models/Claim');
const claimController = require('../controllers/claimController');

// Service wrapper for claim operations
const createAutoClaim = async (userId, policyId, triggerEventId, triggerType, eventDate, claimedAmount) => {
  return await claimController.createAutoClaim(userId, policyId, triggerEventId, triggerType, eventDate, claimedAmount);
};

// Get claims by fraud score
const getFlaggedClaims = async (minScore = 70) => {
  try {
    const claims = await Claim.findByFraudScore(minScore)
      .populate('userId', 'name phone email zone')
      .populate('policyId', 'policyNumber weeklyPremium')
      .populate('triggerEventId', 'eventType title eventStart');
    
    return claims;
  } catch (error) {
    console.error('Get flagged claims error:', error);
    return [];
  }
};

// Get claims by user
const getUserClaimsSummary = async (userId, days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const claims = await Claim.find({
      userId,
      claimDate: { $gte: startDate }
    }).sort({ claimDate: -1 });

    const summary = {
      totalClaims: claims.length,
      approvedClaims: claims.filter(c => c.status === 'approved').length,
      paidClaims: claims.filter(c => c.status === 'paid').length,
      flaggedClaims: claims.filter(c => c.status === 'flagged').length,
      totalPayout: claims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0),
      avgFraudScore: claims.length > 0 ? claims.reduce((sum, c) => sum + c.fraudScore, 0) / claims.length : 0
    };

    return { claims, summary };
  } catch (error) {
    console.error('Get user claims summary error:', error);
    return { claims: [], summary: null };
  }
};

// Process pending claims
const processPendingClaims = async () => {
  try {
    const pendingClaims = await Claim.find({ status: 'pending' })
      .populate('userId')
      .populate('policyId')
      .populate('triggerEventId');

    let processed = 0;
    
    for (const claim of pendingClaims) {
      try {
        await claimController.processClaim(claim);
        processed++;
      } catch (error) {
        console.error(`Error processing claim ${claim._id}:`, error);
      }
    }

    console.log(`✅ Processed ${processed} pending claims`);
    return processed;
  } catch (error) {
    console.error('Process pending claims error:', error);
    return 0;
  }
};

// Get claim trends
const getClaimTrends = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const trends = await Claim.aggregate([
      {
        $match: {
          claimDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$claimDate' },
            month: { $month: '$claimDate' },
            day: { $dayOfMonth: '$claimDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$claimedAmount' },
          avgFraudScore: { $avg: '$fraudScore' },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return trends;
  } catch (error) {
    console.error('Get claim trends error:', error);
    return [];
  }
};

module.exports = {
  createAutoClaim,
  getFlaggedClaims,
  getUserClaimsSummary,
  processPendingClaims,
  getClaimTrends
};
