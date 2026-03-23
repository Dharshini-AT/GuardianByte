const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  zone: {
    type: String,
    required: [true, 'Zone is required'],
    enum: ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)']
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['bike', 'scooter']
  },
  dailyEarningsExpectation: {
    type: Number,
    required: [true, 'Daily earnings expectation is required'],
    min: [500, 'Daily earnings must be at least ₹500'],
    max: [3000, 'Daily earnings cannot exceed ₹3000']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  riskProfile: {
    zoneRisk: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    historicalClaims: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    autoRenewal: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ zone: 1 });
userSchema.index({ 'riskProfile.riskScore': 1 });

// Virtual for user's active policies
userSchema.virtual('activePolicies', {
  ref: 'Policy',
  localField: '_id',
  foreignField: 'userId',
  match: { status: 'active' }
});

// Virtual for user's claims
userSchema.virtual('claims', {
  ref: 'Claim',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set risk profile based on zone
userSchema.pre('save', function(next) {
  const zoneRiskMap = {
    'Zone A (Bandra)': 'high',
    'Zone B (Andheri)': 'medium',
    'Zone C (Navi Mumbai)': 'low'
  };
  
  this.riskProfile.zoneRisk = zoneRiskMap[this.zone] || 'medium';
  
  // Calculate risk score based on zone and vehicle type
  let baseScore = 50;
  const zoneMultiplier = { 'high': 1.3, 'medium': 1.0, 'low': 0.7 };
  const vehicleMultiplier = { 'bike': 1.1, 'scooter': 1.0 };
  
  this.riskProfile.riskScore = Math.min(100, Math.round(
    baseScore * zoneMultiplier[this.riskProfile.zoneRisk] * vehicleMultiplier[this.vehicleType]
  ));
  
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user's risk category
userSchema.methods.getRiskCategory = function() {
  const score = this.riskProfile.riskScore;
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

// Static method to find users by risk profile
userSchema.statics.findByRiskProfile = function(riskLevel) {
  return this.find({ 'riskProfile.riskScore': { 
    $gte: riskLevel === 'high' ? 70 : riskLevel === 'medium' ? 40 : 0,
    $lt: riskLevel === 'high' ? 101 : riskLevel === 'medium' ? 70 : 40 
  }});
};

module.exports = mongoose.model('User', userSchema);
