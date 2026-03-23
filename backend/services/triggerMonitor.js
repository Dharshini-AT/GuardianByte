const cron = require('node-cron');
const weatherService = require('./weatherService');
const claimService = require('./claimService');
const TriggerEvent = require('../models/TriggerEvent');

const zones = ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)'];
let monitoringJob = null;
let isMonitoring = false;

// Start trigger monitoring
const startMonitoring = () => {
  if (isMonitoring) {
    console.log('⚠️ Trigger monitoring is already running');
    return;
  }

  console.log('🔄 Starting trigger monitoring service...');
  isMonitoring = true;

  // Run every 30 minutes
  monitoringJob = cron.schedule('*/30 * * * *', async () => {
    console.log('🔍 Running trigger check cycle...');
    await runTriggerCheckCycle();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  // Also run immediately on start
  runTriggerCheckCycle();

  console.log('✅ Trigger monitoring started (runs every 30 minutes)');
};

// Stop trigger monitoring
const stopMonitoring = () => {
  if (!isMonitoring) {
    console.log('⚠️ Trigger monitoring is not running');
    return;
  }

  if (monitoringJob) {
    monitoringJob.stop();
    monitoringJob = null;
  }

  isMonitoring = false;
  console.log('🛑 Trigger monitoring stopped');
};

// Run a single trigger check cycle
const runTriggerCheckCycle = async () => {
  try {
    console.log(`🔍 Checking triggers for ${zones.length} zones...`);
    
    // Deactivate expired events first
    await weatherService.deactivateExpiredEvents();
    
    const newEvents = [];
    
    // Check weather-related triggers for each zone
    for (const zone of zones) {
      try {
        // Check heavy rain
        const rainEvent = await weatherService.checkHeavyRainTrigger(zone);
        if (rainEvent) {
          newEvents.push(rainEvent);
          await processTriggerEvent(rainEvent);
        }
        
        // Check extreme heat
        const heatEvent = await weatherService.checkExtremeHeatTrigger(zone);
        if (heatEvent) {
          newEvents.push(heatEvent);
          await processTriggerEvent(heatEvent);
        }
        
        // Check air pollution
        const pollutionEvent = await weatherService.checkAirPollutionTrigger(zone);
        if (pollutionEvent) {
          newEvents.push(pollutionEvent);
          await processTriggerEvent(pollutionEvent);
        }
        
      } catch (error) {
        console.error(`❌ Error checking triggers for ${zone}:`, error);
      }
    }
    
    if (newEvents.length > 0) {
      console.log(`🎯 Created ${newEvents.length} new trigger events`);
    } else {
      console.log('✅ No new trigger events detected');
    }
    
  } catch (error) {
    console.error('❌ Trigger check cycle error:', error);
  }
};

// Process a trigger event and create claims
const processTriggerEvent = async (triggerEvent) => {
  try {
    console.log(`🔄 Processing trigger event: ${triggerEvent.eventType} in ${triggerEvent.affectedZones.join(', ')}`);
    
    // For each affected zone, find eligible users and create claims
    for (const zone of triggerEvent.affectedZones) {
      await createClaimsForZone(triggerEvent, zone);
    }
    
  } catch (error) {
    console.error('❌ Error processing trigger event:', error);
  }
};

// Create claims for eligible users in a zone
const createClaimsForZone = async (triggerEvent, zone) => {
  try {
    const Policy = require('../models/Policy');
    const User = require('../models/User');
    
    // Find active policies for users in this zone
    const activePolicies = await Policy.findActive()
      .populate({
        path: 'userId',
        match: { zone: zone, isActive: true }
      })
      .populate('claims');

    // Filter out users who don't match the zone
    const eligiblePolicies = activePolicies.filter(policy => 
      policy.userId && policy.userId.zone === zone
    );

    console.log(`👥 Found ${eligiblePolicies.length} eligible policies in ${zone}`);

    let claimsCreated = 0;
    
    for (const policy of eligiblePolicies) {
      try {
        // Check if policy covers this trigger type
        if (!policy.isTriggerCovered(triggerEvent.eventType)) {
          continue;
        }
        
        // Check if user can claim for today (prevent duplicates)
        const today = new Date();
        if (!policy.canClaimForDate(today)) {
          continue;
        }
        
        // Check if user already has a claim for this event today
        const Claim = require('../models/Claim');
        const existingClaim = await Claim.findDuplicates(
          policy.userId._id,
          triggerEvent.eventStart,
          triggerEvent.eventType
        );
        
        if (existingClaim) {
          continue;
        }
        
        // Create claim
        const claim = await claimService.createAutoClaim(
          policy.userId._id,
          policy._id,
          triggerEvent._id,
          triggerEvent.eventType,
          triggerEvent.eventStart,
          policy.coverageAmountPerDay
        );
        
        if (claim) {
          claimsCreated++;
          console.log(`💰 Auto-created claim ₹${claim.claimedAmount} for ${policy.userId.name} in ${zone}`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating claim for policy ${policy._id}:`, error);
      }
    }
    
    console.log(`✅ Created ${claimsCreated} claims for ${triggerEvent.eventType} in ${zone}`);
    
  } catch (error) {
    console.error(`❌ Error creating claims for zone ${zone}:`, error);
  }
};

// Manual trigger check (for admin/demo)
const runManualTriggerCheck = async () => {
  console.log('🔍 Running manual trigger check...');
  await runTriggerCheckCycle();
};

// Create demo triggers for testing
const createDemoTriggers = async () => {
  try {
    console.log('🎭 Creating demo triggers...');
    
    // Demo heavy rain in Zone A
    const rainEvent = await weatherService.checkHeavyRainTrigger('Zone A (Bandra)');
    if (rainEvent) {
      await processTriggerEvent(rainEvent);
    }
    
    // Demo extreme heat in Zone B
    const heatEvent = await weatherService.checkExtremeHeatTrigger('Zone B (Andheri)');
    if (heatEvent) {
      await processTriggerEvent(heatEvent);
    }
    
    // Demo curfew in Zone C
    const curfewEvent = await weatherService.createCurfewTrigger(
      ['Zone C (Navi Mumbai)'],
      'Navi Mumbai Municipal Corporation',
      ['no_delivery_after_8pm', 'limited_hours']
    );
    if (curfewEvent) {
      await processTriggerEvent(curfewEvent);
    }
    
    // Demo platform outage
    const outageEvent = await weatherService.createPlatformOutageTrigger(
      'Zomato',
      ['Zone A (Bandra)', 'Zone B (Andheri)'],
      1
    );
    if (outageEvent) {
      await processTriggerEvent(outageEvent);
    }
    
    console.log('✅ Demo triggers created successfully');
    
  } catch (error) {
    console.error('❌ Error creating demo triggers:', error);
  }
};

// Get monitoring status
const getMonitoringStatus = () => {
  return {
    isMonitoring,
    schedule: monitoringJob ? 'Every 30 minutes' : 'Not scheduled',
    zones,
    lastCheck: new Date()
  };
};

module.exports = {
  startMonitoring,
  stopMonitoring,
  runTriggerCheckCycle,
  runManualTriggerCheck,
  createDemoTriggers,
  getMonitoringStatus,
  isMonitoring: () => isMonitoring
};
