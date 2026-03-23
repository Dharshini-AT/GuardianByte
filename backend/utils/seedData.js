const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const TriggerEvent = require('../models/TriggerEvent');

// Sample data
const sampleUsers = [
  {
    name: 'Raj Kumar',
    phone: '9876543210',
    email: 'raj@example.com',
    password: 'password123',
    city: 'Mumbai',
    zone: 'Zone A (Bandra)',
    vehicleType: 'bike',
    dailyEarningsExpectation: 1200,
    role: 'user'
  },
  {
    name: 'Priya Sharma',
    phone: '9876543211',
    email: 'priya@example.com',
    password: 'password123',
    city: 'Mumbai',
    zone: 'Zone B (Andheri)',
    vehicleType: 'scooter',
    dailyEarningsExpectation: 1000,
    role: 'user'
  },
  {
    name: 'Amit Patel',
    phone: '9876543212',
    email: 'amit@example.com',
    password: 'password123',
    city: 'Mumbai',
    zone: 'Zone C (Navi Mumbai)',
    vehicleType: 'bike',
    dailyEarningsExpectation: 800,
    role: 'user'
  },
  {
    name: 'Sneha Reddy',
    phone: '9876543213',
    email: 'sneha@example.com',
    password: 'password123',
    city: 'Mumbai',
    zone: 'Zone A (Bandra)',
    vehicleType: 'scooter',
    dailyEarningsExpectation: 1500,
    role: 'user'
  },
  {
    name: 'Vijay Singh',
    phone: '9876543214',
    email: 'vijay@example.com',
    password: 'password123',
    city: 'Mumbai',
    zone: 'Zone B (Andheri)',
    vehicleType: 'bike',
    dailyEarningsExpectation: 900,
    role: 'user'
  }
];

const adminUser = {
  name: 'Admin GuardianByte',
  phone: '9876543215',
  email: 'admin@guardianbyte.com',
  password: 'admin123',
  city: 'Mumbai',
  zone: 'Zone B (Andheri)',
  vehicleType: 'bike',
  dailyEarningsExpectation: 1000,
  role: 'admin'
};

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  console.log('🗑️  Clearing existing data...');
  
  await User.deleteMany({});
  await Policy.deleteMany({});
  await Claim.deleteMany({});
  await TriggerEvent.deleteMany({});
  
  console.log('✅ Data cleared successfully');
};

// Seed users
const seedUsers = async () => {
  console.log('👥 Seeding users...');
  
  const createdUsers = [];
  
  // Create admin user
  const admin = new User(adminUser);
  await admin.save();
  createdUsers.push(admin);
  
  // Create regular users
  for (const userData of sampleUsers) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
  }
  
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

// Seed policies
const seedPolicies = async (users) => {
  console.log('📋 Seeding policies...');
  
  const regularUsers = users.filter(user => user.role === 'user');
  const createdPolicies = [];
  
  for (const user of regularUsers) {
    // Create 1-2 policies per user
    const policyCount = Math.random() > 0.5 ? 2 : 1;
    
    for (let i = 0; i < policyCount; i++) {
      const isActive = i === 0; // First policy is active
      
      const policy = new Policy({
        userId: user._id,
        policyNumber: `GB-2026-${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        weeklyPremium: 150 + Math.floor(Math.random() * 100),
        coverageAmountPerDay: Math.min(user.dailyEarningsExpectation, 800),
        maxCoveragePerWeek: Math.min(user.dailyEarningsExpectation * 5, 4000),
        startDate: isActive ? new Date() : new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: isActive ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        status: isActive ? 'active' : 'expired',
        paymentStatus: 'paid',
        totalClaims: Math.floor(Math.random() * 3),
        totalPayouts: Math.floor(Math.random() * 2000),
        weeklyPayoutsUsed: Math.floor(Math.random() * 500),
        autoRenewal: Math.random() > 0.2,
        riskAssessment: {
          basePremium: 150,
          riskMultiplier: user.zone === 'Zone A (Bandra)' ? 1.3 : user.zone === 'Zone B (Andheri)' ? 1.0 : 0.7,
          zoneRisk: user.zone === 'Zone A (Bandra)' ? 'high' : user.zone === 'Zone B (Andheri)' ? 'medium' : 'low',
          vehicleRisk: user.vehicleType === 'bike' ? 'high' : 'medium',
          finalPremium: 150 + Math.floor(Math.random() * 100),
          explanation: `${user.zone} zone risk factor applied`
        }
      });
      
      await policy.save();
      createdPolicies.push(policy);
    }
  }
  
  console.log(`✅ Created ${createdPolicies.length} policies`);
  return createdPolicies;
};

// Seed trigger events
const seedTriggerEvents = async () => {
  console.log('🎯 Seeding trigger events...');
  
  const triggerTypes = ['heavy_rain', 'extreme_heat', 'air_pollution', 'curfew', 'platform_outage'];
  const zones = ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)'];
  const createdTriggers = [];
  
  // Create some historical triggers
  for (let i = 0; i < 15; i++) {
    const eventType = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
    const affectedZones = [zones[Math.floor(Math.random() * zones.length)]];
    
    const eventStart = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const eventEnd = new Date(eventStart.getTime() + (2 + Math.random() * 6) * 60 * 60 * 1000);
    
    const trigger = new TriggerEvent({
      eventType,
      title: `${eventType.replace('_', ' ').charAt(0).toUpperCase() + eventType.slice(1).replace('_', ' ')} Alert`,
      description: `Sample ${eventType.replace('_', ' ')} event in ${affectedZones[0]}`,
      affectedZones,
      eventStart,
      eventEnd,
      isActive: false, // Historical events are inactive
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      source: 'mock',
      measurements: {
        weather: eventType === 'heavy_rain' ? {
          rainfall: { amount: 25 + Math.random() * 20, duration: 2, intensity: 'heavy', unit: 'mm' },
          temperature: { current: 25 + Math.random() * 5, unit: 'celsius' }
        } : eventType === 'extreme_heat' ? {
          temperature: { current: 40 + Math.random() * 5, max: 45, min: 35, unit: 'celsius' }
        } : eventType === 'air_pollution' ? {
          aqi: { value: 300 + Math.random() * 100, category: 'hazardous' }
        } : {}
      },
      impact: {
        estimatedClaims: Math.floor(Math.random() * 10),
        estimatedPayout: Math.floor(Math.random() * 5000),
        actualClaims: Math.floor(Math.random() * 8),
        actualPayout: Math.floor(Math.random() * 4000),
        affectedUsers: Math.floor(Math.random() * 20)
      }
    });
    
    await trigger.save();
    createdTriggers.push(trigger);
  }
  
  // Create some active triggers
  for (let i = 0; i < 3; i++) {
    const eventType = triggerTypes[Math.floor(Math.random() * 3)]; // Only weather triggers for active
    const affectedZones = [zones[Math.floor(Math.random() * zones.length)]];
    
    const eventStart = new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000);
    const eventEnd = new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000);
    
    const trigger = new TriggerEvent({
      eventType,
      title: `Active ${eventType.replace('_', ' ').charAt(0).toUpperCase() + eventType.slice(1).replace('_', ' ')} Alert`,
      description: `Active ${eventType.replace('_', ' ')} event in ${affectedZones[0]}`,
      affectedZones,
      eventStart,
      eventEnd,
      isActive: true,
      severity: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)],
      source: 'mock',
      measurements: {
        weather: eventType === 'heavy_rain' ? {
          rainfall: { amount: 30 + Math.random() * 15, duration: 1, intensity: 'heavy', unit: 'mm' }
        } : eventType === 'extreme_heat' ? {
          temperature: { current: 41 + Math.random() * 4, max: 46, min: 38, unit: 'celsius' }
        } : eventType === 'air_pollution' ? {
          aqi: { value: 320 + Math.random() * 80, category: 'hazardous' }
        } : {}
      },
      impact: {
        estimatedClaims: Math.floor(Math.random() * 15),
        estimatedPayout: Math.floor(Math.random() * 8000),
        actualClaims: 0,
        actualPayout: 0,
        affectedUsers: Math.floor(Math.random() * 25)
      }
    });
    
    await trigger.save();
    createdTriggers.push(trigger);
  }
  
  console.log(`✅ Created ${createdTriggers.length} trigger events`);
  return createdTriggers;
};

// Seed claims
const seedClaims = async (users, policies, triggers) => {
  console.log('💰 Seeding claims...');
  
  const activePolicies = policies.filter(policy => policy.status === 'active');
  const allTriggers = triggers.filter(trigger => !trigger.isActive); // Use historical triggers
  const createdClaims = [];
  
  for (const policy of activePolicies.slice(0, 10)) { // Limit to 10 policies for demo
    const claimCount = Math.floor(Math.random() * 3); // 0-2 claims per policy
    
    for (let i = 0; i < claimCount; i++) {
      const trigger = allTriggers[Math.floor(Math.random() * allTriggers.length)];
      const eventDate = new Date(trigger.eventStart);
      
      const fraudScore = Math.random() * 100;
      const status = fraudScore > 70 ? 'flagged' : fraudScore > 50 ? 'pending' : 'approved';
      
      const claim = new Claim({
        claimNumber: `GC-2026-${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        userId: policy.userId,
        policyId: policy._id,
        triggerType: trigger.eventType,
        triggerEventId: trigger._id,
        eventDate,
        claimedAmount: Math.min(policy.coverageAmountPerDay, 500 + Math.floor(Math.random() * 300)),
        status,
        fraudScore,
        approvedAmount: status === 'approved' ? Math.min(policy.coverageAmountPerDay, 500 + Math.floor(Math.random() * 300)) : null,
        payoutAmount: status === 'approved' ? Math.min(policy.coverageAmountPerDay, 500 + Math.floor(Math.random() * 300)) : null,
        fraudAnalysis: {
          locationMatch: Math.random() > 0.2,
          timingMatch: Math.random() > 0.3,
          frequencyCheck: Math.random() > 0.1,
          anomalies: fraudScore > 70 ? ['Unusual timing detected', 'Location mismatch'] : [],
          riskFactors: fraudScore > 50 ? ['high_frequency'] : [],
          explanation: `Fraud score calculated based on various factors`
        },
        processing: {
          autoApproved: fraudScore < 50,
          reviewDate: status !== 'pending' ? new Date() : null,
          processingTime: Math.random() * 3600000 // Random processing time
        },
        payment: status === 'approved' ? {
          paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
          transactionId: 'GB' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
          paymentDate: new Date(),
          paymentStatus: 'completed',
          paymentMethod: 'upi',
          utr: Math.random().toString(36).substr(2, 12).toUpperCase()
        } : {
          paymentStatus: 'pending'
        }
      });
      
      await claim.save();
      createdClaims.push(claim);
    }
  }
  
  console.log(`✅ Created ${createdClaims.length} claims`);
  return createdClaims;
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Clear existing data
    await clearData();
    
    // Seed data
    const users = await seedUsers();
    const policies = await seedPolicies(users);
    const triggers = await seedTriggerEvents();
    const claims = await seedClaims(users, policies, triggers);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Policies: ${policies.length}`);
    console.log(`   - Trigger Events: ${triggers.length}`);
    console.log(`   - Claims: ${claims.length}`);
    console.log(`\n👤 Demo Accounts:`);
    console.log(`   - User: raj@example.com / password123`);
    console.log(`   - Admin: admin@guardianbyte.com / admin123`);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
