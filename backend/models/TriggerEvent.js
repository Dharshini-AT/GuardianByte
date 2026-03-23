const mongoose = require('mongoose');

const triggerEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['heavy_rain', 'extreme_heat', 'air_pollution', 'curfew', 'platform_outage'],
    required: [true, 'Event type is required']
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  affectedZones: [{
    type: String,
    enum: ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)'],
    required: true
  }],
  eventStart: {
    type: Date,
    required: [true, 'Event start time is required']
  },
  eventEnd: {
    type: Date,
    required: [true, 'Event end time is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['weather_api', 'admin_manual', 'system_detected', 'mock'],
    default: 'weather_api'
  },
  measurements: {
    // For weather-related events
    weather: {
      temperature: {
        current: Number,
        max: Number,
        min: Number,
        unit: { type: String, default: 'celsius' }
      },
      rainfall: {
        amount: Number,
        duration: Number, // in hours
        intensity: { type: String, enum: ['light', 'moderate', 'heavy', 'extreme'] },
        unit: { type: String, default: 'mm' }
      },
      humidity: Number,
      windSpeed: Number,
      visibility: Number,
      aqi: {
        value: Number,
        category: { type: String, enum: ['good', 'moderate', 'unhealthy', 'very_unhealthy', 'hazardous'] }
      }
    },
    // For platform outages
    platform: {
      platformName: String, // e.g., 'Zomato', 'Swiggy'
      outageType: { type: String, enum: ['partial', 'full', 'regional'] },
      affectedServices: [String], // e.g., ['delivery', 'payments', 'app']
      estimatedUsersAffected: Number,
      technicalDetails: String
    },
    // For curfews
    curfew: {
      authority: String, // e.g., 'Municipal Corporation', 'Police'
      type: { type: String, enum: ['partial', 'full', 'section_144'] },
      restrictions: [String], // e.g., ['no_delivery', 'limited_hours']
      exemptionAllowed: Boolean
    }
  },
  thresholds: {
    // What thresholds were met to trigger this event
    triggered: [{
      metric: String,
      value: Number,
      threshold: Number,
      unit: String,
      exceededAt: Date
    }],
    // Minimum thresholds for this event type
    minimum: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  verification: {
    dataSources: [{
      name: String,
      url: String,
      lastChecked: Date,
      confidence: Number // 0-100
    }],
    manualVerification: {
      verified: Boolean,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date,
      notes: String
    }
  },
  impact: {
    estimatedClaims: Number,
    estimatedPayout: Number,
    actualClaims: { type: Number, default: 0 },
    actualPayout: { type: Number, default: 0 },
    affectedUsers: { type: Number, default: 0 }
  },
  notifications: {
    systemAlert: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      channels: [String] // e.g., ['email', 'sms', 'push']
    },
    userNotifications: {
      totalSent: { type: Number, default: 0 },
      totalDelivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    sourceIp: String,
    apiVersion: String,
    externalId: String // ID from external systems
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
triggerEventSchema.index({ eventType: 1, isActive: 1 });
triggerEventSchema.index({ affectedZones: 1, isActive: 1 });
triggerEventSchema.index({ eventStart: 1, eventEnd: 1 });
triggerEventSchema.index({ severity: 1 });
triggerEventSchema.index({ source: 1 });
triggerEventSchema.index({ 'verification.manualVerification.verified': 1 });

// Virtual for event duration
triggerEventSchema.virtual('durationHours').get(function() {
  if (!this.eventStart || !this.eventEnd) return 0;
  const diffMs = this.eventEnd - this.eventStart;
  return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
});

// Virtual for checking if event is currently active
triggerEventSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && this.eventStart <= now && this.eventEnd >= now;
});

// Virtual for claims related to this event
triggerEventSchema.virtual('claims', {
  ref: 'Claim',
  localField: '_id',
  foreignField: 'triggerEventId'
});

// Pre-save middleware to set default thresholds
triggerEventSchema.pre('save', function(next) {
  if (this.isNew && !this.thresholds.minimum) {
    const defaultThresholds = {
      heavy_rain: { rainfall_mm: 20, duration_hours: 1 },
      extreme_heat: { temperature_celsius: 40, duration_hours: 3 },
      air_pollution: { aqi: 300 },
      curfew: { is_active: true },
      platform_outage: { duration_minutes: 30 }
    };
    
    this.thresholds.minimum = defaultThresholds[this.eventType] || {};
  }
  next();
});

// Pre-save middleware to update metadata
triggerEventSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

// Instance method to check if zone is affected
triggerEventSchema.methods.isZoneAffected = function(zone) {
  return this.affectedZones.includes(zone);
};

// Instance method to check if event is active at specific time
triggerEventSchema.methods.isActiveAt = function(date) {
  return this.isActive && this.eventStart <= date && this.eventEnd >= date;
};

// Instance method to add threshold trigger
triggerEventSchema.methods.addThresholdTrigger = function(metric, value, threshold, unit) {
  this.thresholds.triggered.push({
    metric,
    value,
    threshold,
    unit,
    exceededAt: new Date()
  });
};

// Static method to find active events
triggerEventSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    eventStart: { $lte: now },
    eventEnd: { $gte: now }
  }).sort({ severity: -1, eventStart: -1 });
};

// Static method to find events by zone and type
triggerEventSchema.statics.findByZoneAndType = function(zone, eventType, dateRange = null) {
  const query = {
    affectedZones: zone,
    eventType
  };
  
  if (dateRange) {
    query.eventStart = { $gte: dateRange.start };
    query.eventEnd = { $lte: dateRange.end };
  }
  
  return this.find(query).sort({ eventStart: -1 });
};

// Static method to get event statistics
triggerEventSchema.statics.getStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        eventStart: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          severity: '$severity'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: { $subtract: ['$eventEnd', '$eventStart'] } },
        avgDuration: { $avg: { $subtract: ['$eventEnd', '$eventStart'] } },
        totalClaims: { $sum: '$impact.actualClaims' },
        totalPayout: { $sum: '$impact.actualPayout' }
      }
    },
    {
      $group: {
        _id: '$_id.eventType',
        severities: {
          $push: {
            severity: '$_id.severity',
            count: '$count',
            totalDuration: '$totalDuration',
            avgDuration: '$avgDuration',
            totalClaims: '$totalClaims',
            totalPayout: '$totalPayout'
          }
        },
        totalCount: { $sum: '$count' },
        totalClaims: { $sum: '$totalClaims' },
        totalPayout: { $sum: '$totalPayout' }
      }
    }
  ]);
};

module.exports = mongoose.model('TriggerEvent', triggerEventSchema);
