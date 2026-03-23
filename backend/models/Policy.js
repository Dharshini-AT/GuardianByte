const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  policyNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^GB-\d{4}-\d{8}$/, 'Policy number format: GB-YYYY-XXXXXXXX']
  },
  weeklyPremium: {
    type: Number,
    required: [true, 'Weekly premium is required'],
    min: [100, 'Weekly premium must be at least ₹100'],
    max: [500, 'Weekly premium cannot exceed ₹500']
  },
  coverageAmountPerDay: {
    type: Number,
    required: [true, 'Daily coverage amount is required'],
    min: [200, 'Daily coverage must be at least ₹200'],
    max: [1000, 'Daily coverage cannot exceed ₹1000']
  },
  maxCoveragePerWeek: {
    type: Number,
    required: [true, 'Weekly coverage limit is required'],
    min: [1000, 'Weekly coverage must be at least ₹1000'],
    max: [5000, 'Weekly coverage cannot exceed ₹5000']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    sparse: true
  },
  orderId: {
    type: String,
    sparse: true
  },
  coveredTriggers: [{
    type: {
      type: String,
      enum: ['heavy_rain', 'extreme_heat', 'air_pollution', 'curfew', 'platform_outage'],
      required: true
    },
    threshold: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  totalClaims: {
    type: Number,
    default: 0
  },
  totalPayouts: {
    type: Number,
    default: 0
  },
  weeklyPayoutsUsed: {
    type: Number,
    default: 0
  },
  lastClaimDate: {
    type: Date
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  autoRenewal: {
    type: Boolean,
    default: true
  },
  riskAssessment: {
    basePremium: Number,
    riskMultiplier: Number,
    zoneRisk: String,
    vehicleRisk: String,
    finalPremium: Number,
    explanation: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
policySchema.index({ userId: 1, status: 1 });
policySchema.index({ policyNumber: 1 });
policySchema.index({ status: 1 });
policySchema.index({ endDate: 1 });
policySchema.index({ paymentStatus: 1 });

// Virtual for checking if policy is currently active
policySchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         this.paymentStatus === 'paid';
});

// Virtual for days remaining
policySchema.virtual('daysRemaining').get(function() {
  if (!this.isActive) return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for claims
policySchema.virtual('claims', {
  ref: 'Claim',
  localField: '_id',
  foreignField: 'policyId'
});

// Pre-save middleware to generate policy number
policySchema.pre('save', async function(next) {
  if (this.isNew && !this.policyNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    this.policyNumber = `GB-${year}-${random}`;
  }
  next();
});

// Pre-save middleware to set default covered triggers
policySchema.pre('save', function(next) {
  if (this.isNew && this.coveredTriggers.length === 0) {
    this.coveredTriggers = [
      {
        type: 'heavy_rain',
        threshold: { rainfall_mm: 20, duration_hours: 1 },
        isActive: true
      },
      {
        type: 'extreme_heat',
        threshold: { temperature_celsius: 40, duration_hours: 3 },
        isActive: true
      },
      {
        type: 'air_pollution',
        threshold: { aqi: 300 },
        isActive: true
      },
      {
        type: 'curfew',
        threshold: { is_active: true },
        isActive: true
      },
      {
        type: 'platform_outage',
        threshold: { duration_minutes: 30 },
        isActive: true
      }
    ];
  }
  next();
});

// Instance method to check if trigger is covered
policySchema.methods.isTriggerCovered = function(triggerType) {
  const trigger = this.coveredTriggers.find(t => t.type === triggerType);
  return trigger && trigger.isActive;
};

// Instance method to check if user can claim for specific date
policySchema.methods.canClaimForDate = function(date) {
  const claimDate = new Date(date);
  const startOfDay = new Date(claimDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(claimDate.setHours(23, 59, 59, 999));
  
  // Check if policy was active on the claim date
  const policyActive = this.status === 'active' && 
                      this.startDate <= endOfDay && 
                      this.endDate >= startOfDay;
  
  if (!policyActive) return false;
  
  // Check if weekly limit is reached
  if (this.weeklyPayoutsUsed >= this.maxCoveragePerWeek) return false;
  
  return true;
};

// Instance method to calculate available coverage
policySchema.methods.getAvailableCoverage = function() {
  return Math.max(0, this.maxCoveragePerWeek - this.weeklyPayoutsUsed);
};

// Static method to find active policies
policySchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    paymentStatus: 'paid',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('userId', 'name phone email zone');
};

// Static method to find expiring policies
policySchema.statics.findExpiring = function(days = 1) {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'active',
    endDate: { $lte: futureDate, $gte: new Date() }
  }).populate('userId', 'name phone email');
};

module.exports = mongoose.model('Policy', policySchema);
