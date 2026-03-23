# GuardianByte Login Fix Guide

## 🚀 Quick Start Solution

### Step 1: Start All Services
Run the batch file I created:
```bash
START_SERVICES.bat
```

Or start manually:
```bash
# Terminal 1 - ML Service
cd backend-ml
python app-minimal.py

# Terminal 2 - Backend
cd backend
npm start

# Terminal 3 - Frontend
cd frontend
npm start
```

### Step 2: Verify Services Are Running
- Frontend: http://localhost:3000
- Backend: http://localhost:5001/api/health
- ML Service: http://localhost:5000/api/health

### Step 3: Database Setup
```bash
cd backend
node utils/seedData.js
```

### Step 4: Login Credentials
- **User**: raj@example.com / password123
- **Admin**: admin@guardianbyte.com / admin123

## 🔧 What I Fixed

### 1. Removed Proxy Issues
- Removed problematic proxy configuration
- Set direct API calls to backend

### 2. Fixed API Configuration
- Updated API service to use direct backend URL
- Added proper CORS configuration

### 3. Database Seeding
- Fixed policy number format (GB-2026-XXXXXXXX)
- Fixed claim number format (GC-2026-XXXXXXXX)
- Fixed coverage amounts within limits

### 4. Added Debug Logging
- Console logs in login component
- API response logging in AuthContext

## 🗄️ Database Operations

### MongoDB Connection
```javascript
// In backend/.env
MONGODB_URI=mongodb://localhost:27017/guardianbyte
```

### Manual Database Access
```bash
# Connect to MongoDB
mongosh guardianbyte

# Check collections
show collections

# View users
db.users.find().pretty()

# View policies
db.policies.find().pretty()

# View claims
db.claims.find().pretty()
```

### CRUD Operations Examples

#### Create User
```javascript
const User = require('./models/User');
const user = new User({
  email: 'newuser@example.com',
  password: 'hashedPassword',
  name: 'New User',
  role: 'user',
  zone: 'Zone A (Bandra)',
  vehicleType: 'bike',
  dailyEarningsExpectation: 800
});
await user.save();
```

#### Find User
```javascript
const user = await User.findOne({ email: 'raj@example.com' });
```

#### Update User
```javascript
await User.updateOne(
  { email: 'raj@example.com' },
  { $set: { dailyEarningsExpectation: 900 } }
);
```

#### Delete User
```javascript
await User.deleteOne({ email: 'raj@example.com' });
```

## 🔍 Troubleshooting

### If Login Still Fails:

1. **Check Browser Console**
   - Open http://localhost:3000
   - Press F12 → Console tab
   - Look for error messages

2. **Check Backend Logs**
   - Look at backend terminal
   - Should show "✅ Connected to MongoDB"

3. **Test API Directly**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"raj@example.com","password":"password123"}'
   ```

4. **Check Database**
   ```bash
   cd backend
   node utils/seedData.js
   ```

### Common Issues:

#### "Cannot GET /api/auth/login"
- Backend not running
- Wrong port
- CORS issues

#### "Invalid email or password"
- User not in database
- Wrong password
- Database not seeded

#### "Network Error"
- Backend not accessible
- Wrong API URL
- Firewall issues

## 🎯 Final Verification

### Test Complete Flow:
1. ✅ Services running
2. ✅ Database seeded
3. ✅ Frontend accessible
4. ✅ Backend API responding
5. ✅ Login working

### Expected Login Flow:
1. Enter email: raj@example.com
2. Enter password: password123
3. Click "Sign in"
4. Redirect to dashboard
5. See user dashboard with policies and claims

## 📱 Dashboard Features

### User Dashboard:
- Coverage status
- Active policies
- Claims history
- Earnings protected

### Admin Dashboard:
- User management
- Analytics
- Fraud alerts
- Trigger management

## 🚀 Ready to Use!

The GuardianByte platform should now be fully functional. If you still have issues:

1. Check all services are running
2. Verify database is seeded
3. Check browser console for errors
4. Test API endpoints directly

**Access the application at: http://localhost:3000**
