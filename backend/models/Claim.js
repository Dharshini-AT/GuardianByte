const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^GC-\d{4}-\d{8}$/, 'Claim number format: GC-YYYY-XXXXXXXX']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: [true, 'Policy ID is required']
  },
  triggerType: {
    type: String,
    enum: ['heavy_rain', 'extreme_heat', 'air_pollution', 'curfew', 'platform_outage'],
    required: [true, 'Trigger type is required']
  },
  triggerEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TriggerEvent',
    required: [true, 'Trigger event ID is required']
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  claimDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged', 'paid'],
    default: 'pending'
  },
  claimedAmount: {
    type: Number,
    required: [true, 'Claimed amount is required'],
    min: [0, 'Claimed amount cannot be negative']
  },
  approvedAmount: {
    type: Number,
    min: [0, 'Approved amount cannot be negative']
  },
  payoutAmount: {
    type: Number,
    min: [0, 'Payout amount cannot be negative']
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  fraudAnalysis: {
    locationMatch: {
      type: Boolean,
      default: true
    },
    timingMatch: {
      type: Boolean,
      default: true
    },
    frequencyCheck: {
      type: Boolean,
      default: true
    },
    anomalies: [String],
    explanation: String,
    riskFactors: [{
      type: String,
      enum: ['location_mismatch', 'unusual_timing', 'high_frequency', 'new_user', 'large_amount', 'multiple_triggers']
    }]
  },
  verificationData: {
    weatherData: {
      temperature: Number,
      rainfall: Number,
      aqi: Number,
      location: String,
      timestamp: Date
    },
    gpsLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    },
    platformData: {
      platform: String,
      outageStart: Date,
      outageEnd: Date,
      affectedZones: [String]
    }
  },
  processing: {
    autoApproved: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewDate: Date,
    reviewNotes: String,
    processingTime: Number // milliseconds
  },
  payment: {
    paymentId: String,
    transactionId: String,
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['upi', 'bank_transfer', 'wallet'],
      default: 'upi'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    utr: String, // UTR for UPI payments
    bankReference: String
  },
  notifications: {
    smsSent: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
    lastNotification: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['auto', 'manual', 'admin'],
      default: 'auto'
    },
    apiVersion: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
claimSchema.index({ claimNumber: 1 });
claimSchema.index({ userId: 1, status: 1 });
claimSchema.index({ policyId: 1 });
claimSchema.index({ triggerType: 1 });
claimSchema.index({ eventDate: 1 });
claimSchema.index({ claimDate: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ fraudScore: 1 });
claimSchema.index({ 'payment.paymentStatus': 1 });

// Virtual for checking if claim is paid
claimSchema.virtual('isPaid').get(function() {
  return this.status === 'paid' && this.payment.paymentStatus === 'completed';
});

// Virtual for claim processing time
claimSchema.virtual('processingTimeHours').get(function() {
  if (!this.processing.reviewDate) return null;
  const diffMs = this.processing.reviewDate - this.claimDate;
  return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
});

// Virtual for days since event
claimSchema.virtual('daysSinceEvent').get(function() {
  const now = new Date();
  const diffMs = now - this.eventDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate claim number
claimSchema.pre('save', async function(next) {
  if (this.isNew && !this.claimNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    this.claimNumber = `GC-${year}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate processing time
claimSchema.pre('save', function(next) {
  if (this.processing.reviewDate && this.claimDate) {
    this.processing.processingTime = this.processing.reviewDate - this.claimDate;
  }
  next();
});

// Instance method to approve claim
claimSchema.methods.approve = function(approvedAmount, reviewerId = null) {
  this.status = 'approved';
  this.approvedAmount = approvedAmount;
  this.processing.reviewDate = new Date();
  this.processing.reviewedBy = reviewerId;
  this.processing.autoApproved = !reviewerId;
};

// Instance method to reject claim
claimSchema.methods.reject = function(reason, reviewerId) {
  this.status = 'rejected';
  this.processing.reviewDate = new Date();
  this.processing.reviewedBy = reviewerId;
  this.processing.reviewNotes = reason;
  this.processing.autoApproved = false;
};

// Instance method to flag for fraud
claimSchema.methods.flagForFraud = function(fraudScore, analysis) {
  this.status = 'flagged';
  this.fraudScore = fraudScore;
  this.fraudAnalysis = { ...this.fraudAnalysis, ...analysis };
};

// Instance method to process payment
claimSchema.methods.processPayment = function(paymentDetails) {
  this.payment = { ...this.payment, ...paymentDetails };
  this.payment.paymentDate = new Date();
  if (this.payment.paymentStatus === 'completed') {
    this.status = 'paid';
    this.payoutAmount = this.approvedAmount || this.claimedAmount;
  }
};

// Static method to find claims by fraud score
claimSchema.statics.findByFraudScore = function(minScore = 70) {
  return this.find({
    fraudScore: { $gte: minScore },
    status: { $in: ['flagged', 'pending'] }
  }).populate('userId', 'name phone email zone')
    .populate('policyId', 'policyNumber weeklyPremium');
};

// Static method to get claims statistics
claimSchema.statics.getStats = function(startDate, endDate) {
  const matchStage = {
    claimDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$claimedAmount' },
        avgAmount: { $avg: '$claimedAmount' }
      }
    }
  ]);
};

// Static method to find duplicate claims
claimSchema.statics.findDuplicates = function(userId, eventDate, triggerType) {
  const startOfDay = new Date(eventDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(eventDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findOne({
    userId,
    triggerType,
    eventDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['approved', 'paid'] }
  });
};

module.exports = mongoose.model('Claim', claimSchema);
