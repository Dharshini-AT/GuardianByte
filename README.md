# GuardianByte - Parametric Insurance Platform

A comprehensive parametric insurance platform built for food delivery partners, providing automated income protection against external disruptions like weather events, curfews, and platform outages.

## 🚀 Features

### Core Functionality
- **Parametric Triggers**: Automated claim processing based on real-world events
- **AI-Powered Risk Assessment**: Dynamic premium calculation using ML models
- **Fraud Detection**: Intelligent fraud detection system with risk scoring
- **Instant Payouts**: Automated payment processing via mock UPI gateway
- **Real-time Monitoring**: Weather API integration and trigger monitoring system

### User Experience
- **Mobile-First Design**: Optimized for delivery partners using smartphones
- **Simple Onboarding**: Quick registration with risk profiling
- **Transparent Dashboard**: Real-time coverage status and claim history
- **Automated Claims**: No manual claim filing required

### Admin Features
- **Analytics Dashboard**: Comprehensive insights and performance metrics
- **Fraud Management**: Review flagged claims and manage risk
- **Trigger Control**: Manual trigger creation and system monitoring
- **User Management**: Complete oversight of policies and claims

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful API**: Comprehensive endpoints for all operations
- **JWT Authentication**: Secure user and admin access
- **MongoDB**: Scalable data storage with Mongoose ODM
- **Cron Jobs**: Automated trigger monitoring every 30 minutes

### ML Service (Python + Flask)
- **Premium Calculation**: Risk-based pricing using Random Forest models
- **Fraud Detection**: Multi-factor analysis with explainable AI
- **REST API**: Integration with backend for ML predictions

### Frontend (React + Tailwind CSS)
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live dashboard and notifications
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

## 📋 Prerequisites

- Node.js 16+ and npm
- Python 3.8+ and pip
- MongoDB 4.4+
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd guardianbyte
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
```

**Environment Variables (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/guardianbyte
JWT_SECRET=your_jwt_secret_key_here_change_in_production
OPENWEATHER_API_KEY=your_openweather_api_key_here
RAZORPAY_KEY_ID=rzp_test_YourKeyIDHere
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
ML_SERVICE_URL=http://localhost:5000
PORT=5001
NODE_ENV=development
```

### 3. ML Service Setup

```bash
# Navigate to ML service directory
cd backend-ml

# Install Python dependencies
pip install -r requirements.txt

# Generate training data and train models
python training/generate_training_data.py
python training/train_premium_model.py
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5001/api" > .env
echo "REACT_APP_ML_URL=http://localhost:5000" >> .env
```

### 5. Database Setup

```bash
# Start MongoDB service
# For Ubuntu/Debian:
sudo systemctl start mongod

# For macOS (using Homebrew):
brew services start mongodb-community

# For Windows:
net start MongoDB
```

### 6. Seed Database (Optional)

```bash
# Navigate to backend directory
cd backend

# Run seed script to populate with sample data
npm run seed
```

## 🚀 Running the Application

### 1. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - ML Service:**
```bash
cd backend-ml
python app.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api/health
- **ML Service**: http://localhost:5000/api/health

## 👤 Demo Accounts

### User Account
- **Email**: raj@example.com
- **Password**: password123
- **Role**: Regular User

### Admin Account
- **Email**: admin@guardianbyte.com
- **Password**: admin123
- **Role**: Administrator

## 🎯 Demo Scenario (5-Minute Walkthrough)

### Step 1: User Registration & Onboarding
1. Navigate to http://localhost:3000
2. Click "Register" and create a new account
3. Fill in personal and professional details
4. System calculates risk profile and premium

### Step 2: Policy Purchase
1. User dashboard shows "Get Coverage" option
2. System displays weekly premium (₹150-₹300 range)
3. User purchases policy via mock Razorpay payment
4. Policy becomes active immediately

### Step 3: Trigger Event Simulation
1. Login as admin (admin@guardianbyte.com / admin123)
2. Navigate to Admin Dashboard → Triggers
3. Click "Create Demo Triggers"
4. System creates weather events in different zones

### Step 4: Automated Claim Processing
1. System detects trigger events automatically
2. Claims created for eligible users in affected zones
3. Fraud detection analyzes each claim
4. Approved claims trigger instant payouts

### Step 5: User Experience
1. Users receive notifications about claims
2. Dashboard shows updated earnings protected
3. Claim history displays auto-filed claims
4. Payout status shows "Completed" with transaction ID

### Step 6: Admin Analytics
1. Admin dashboard shows updated metrics
2. Loss ratio and claim statistics refresh
3. Fraud alerts display flagged claims for review
4. Zone performance shows risk analysis

## 📊 Key Features Demonstration

### Parametric Triggers
- **Heavy Rain**: >20mm rainfall triggers claims
- **Extreme Heat**: >40°C for 3+ hours
- **Air Pollution**: AQI >300 hazardous levels
- **Curfews**: Manual admin-triggered events
- **Platform Outages**: Mock delivery platform issues

### AI Risk Assessment
- **Zone-Based Pricing**: Bandra (high risk), Andheri (medium), Navi Mumbai (low)
- **Vehicle Type**: Bike vs scooter risk factors
- **Historical Data**: Claims history affects premiums
- **Explainable AI**: Clear reasoning for pricing decisions

### Fraud Detection
- **Location Verification**: GPS vs weather data consistency
- **Timing Analysis**: Working hours validation
- **Frequency Checks**: Multiple claim detection
- **Risk Scoring**: 0-100 fraud probability score

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Policy Endpoints
- `POST /api/policies` - Create policy
- `GET /api/policies` - Get user policies
- `GET /api/policies/:id` - Get policy details
- `PUT /api/policies/:id` - Update policy
- `POST /api/policies/:id/cancel` - Cancel policy

### Claim Endpoints
- `GET /api/claims` - Get user claims
- `GET /api/claims/:id` - Get claim details
- `POST /api/claims/admin/:id/review` - Review claim (admin)

### Payment Endpoints
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Payment webhook

### Dashboard Endpoints
- `GET /api/dashboard/user` - User dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data
- `POST /api/dashboard/triggers/demo` - Create demo triggers

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Policy creation and payment
- [ ] Trigger event creation
- [ ] Automated claim processing
- [ ] Fraud detection system
- [ ] Admin dashboard analytics
- [ ] Mobile responsiveness

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/guardianbyte
JWT_SECRET=strong_production_secret
OPENWEATHER_API_KEY=production_api_key
RAZORPAY_KEY_ID=production_key_id
RAZORPAY_KEY_SECRET=production_key_secret
ML_SERVICE_URL=https://ml-service.yourdomain.com
```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@guardianbyte.com
- Documentation: [Link to docs]

## 🏆 Acknowledgments

- Guidewire Hackathon 2026
- OpenWeatherMap API for weather data
- Razorpay for payment gateway integration
- MongoDB Atlas for database hosting
- Tailwind CSS for styling framework

---

**Built with ❤️ for delivery partners by GuardianByte Team**
