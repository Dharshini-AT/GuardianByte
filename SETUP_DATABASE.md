# GuardianByte Database Setup Guide

## 🗄️ Database Setup

### MongoDB Connection
The GuardianByte platform uses MongoDB as the primary database. Make sure MongoDB is running locally.

### Database Collections
1. **users** - User accounts and profiles
2. **policies** - Insurance policies
3. **claims** - Insurance claims
4. **triggerEvents** - Weather/trigger events
5. **payments** - Payment records

### Seeding the Database
```bash
cd backend
node utils/seedData.js
```

### Manual Database Operations

#### Connect to MongoDB
```javascript
// In backend/server.js
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guardianbyte')
```

#### CRUD Operations Examples

##### Users Collection
```javascript
// Create User
const user = new User({
  email: 'user@example.com',
  password: 'hashedPassword',
  name: 'John Doe',
  role: 'user',
  zone: 'Zone A (Bandra)',
  vehicleType: 'bike',
  dailyEarningsExpectation: 800
});

// Find User
const user = await User.findOne({ email: 'user@example.com' });

// Update User
await User.updateOne(
  { _id: userId },
  { $set: { dailyEarningsExpectation: 900 } }
);

// Delete User
await User.deleteOne({ _id: userId });
```

##### Policies Collection
```javascript
// Create Policy
const policy = new Policy({
  userId: user._id,
  policyNumber: 'GB-2026-12345678',
  weeklyPremium: 200,
  coverageAmountPerDay: 800,
  maxCoveragePerWeek: 4000,
  status: 'active'
});

// Find Policies
const policies = await Policy.find({ userId: user._id });

// Update Policy
await Policy.updateOne(
  { _id: policyId },
  { $set: { status: 'expired' } }
);
```

##### Claims Collection
```javascript
// Create Claim
const claim = new Claim({
  userId: user._id,
  policyId: policy._id,
  claimNumber: 'GC-2026-87654321',
  triggerType: 'heavy_rain',
  claimedAmount: 500,
  status: 'pending'
});

// Find Claims
const claims = await Claim.find({ userId: user._id });

// Update Claim Status
await Claim.updateOne(
  { _id: claimId },
  { $set: { status: 'approved', approvedAmount: 500 } }
);
```

### Database Schema

#### User Schema
```javascript
{
  email: String (required, unique),
  password: String (required),
  name: String (required),
  role: String (enum: ['user', 'admin']),
  zone: String (enum: ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)']),
  vehicleType: String (enum: ['bike', 'scooter']),
  dailyEarningsExpectation: Number,
  riskProfile: {
    historicalClaims: Number,
    riskScore: Number,
    zoneRisk: String
  }
}
```

#### Policy Schema
```javascript
{
  userId: ObjectId (ref: User),
  policyNumber: String (unique, pattern: GB-YYYY-XXXXXXXX),
  weeklyPremium: Number (min: 100, max: 500),
  coverageAmountPerDay: Number (min: 200, max: 1000),
  maxCoveragePerWeek: Number (min: 1000, max: 5000),
  status: String (enum: ['active', 'expired', 'cancelled']),
  startDate: Date,
  endDate: Date
}
```

#### Claim Schema
```javascript
{
  userId: ObjectId (ref: User),
  policyId: ObjectId (ref: Policy),
  claimNumber: String (unique, pattern: GC-YYYY-XXXXXXXX),
  triggerType: String (enum: ['heavy_rain', 'extreme_heat', 'air_pollution', 'curfew', 'platform_outage']),
  claimedAmount: Number,
  approvedAmount: Number,
  status: String (enum: ['pending', 'approved', 'rejected', 'flagged']),
  fraudScore: Number (min: 0, max: 100)
}
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

#### Policies
- `GET /api/policies` - Get user policies
- `POST /api/policies` - Create new policy
- `PUT /api/policies/:id` - Update policy

#### Claims
- `GET /api/claims` - Get user claims
- `POST /api/claims` - Create new claim
- `PUT /api/claims/:id` - Update claim status

#### Dashboard
- `GET /api/dashboard/user` - User dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data

### Testing the Database Connection

#### 1. Check MongoDB Status
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"
```

#### 2. Test Backend Connection
```bash
cd backend
npm start
# Look for "✅ Connected to MongoDB" message
```

#### 3. Verify Data Seeding
```bash
cd backend
node utils/seedData.js
# Should show success message with user/policy counts
```

### Troubleshooting

#### MongoDB Connection Issues
1. **MongoDB not running**: Start MongoDB service
2. **Connection string wrong**: Check MONGODB_URI in .env file
3. **Authentication failed**: Verify MongoDB credentials

#### Data Issues
1. **No users found**: Run seed script
2. **Login fails**: Check user exists in database
3. **Policies missing**: Run seed script to create sample policies

#### Frontend Connection Issues
1. **CORS errors**: Check backend CORS configuration
2. **API timeouts**: Verify backend is running on correct port
3. **Proxy errors**: Check package.json proxy configuration
