import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  DollarSign, 
  FileText, 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Crown,
  User,
  LogOut,
  Settings,
  BarChart3,
  Eye
} from 'lucide-react';

const DashboardPage = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    } else {
      // Redirect to login if no user data
      navigate('/login');
    }
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const isAdmin = userData.role === 'admin';

  // User Dashboard Data
  const userStats = {
    activePolicy: true,
    weeklyCoverage: 4000,
    totalClaims: 2,
    totalPayouts: 1500,
    weeklyPremium: 200,
    dailyEarnings: 800,
    zone: 'Zone A (Bandra)',
    vehicleType: 'bike'
  };

  // Admin Dashboard Data
  const adminStats = {
    totalUsers: 156,
    activePolicies: 142,
    totalClaims: 38,
    totalRevenue: 28400,
    pendingClaims: 5,
    fraudAlerts: 2,
    monthlyGrowth: 12.5
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">GuardianByte</h1>
              {isAdmin && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {isAdmin ? (
                  <Crown className="h-4 w-4 text-purple-600 mr-2" />
                ) : (
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                )}
                <span className="text-sm text-gray-600">{userData.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {userData.name}!
          </h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Here\'s your admin dashboard overview' 
              : 'Here\'s your insurance dashboard overview'
            }
          </p>
        </div>

        {isAdmin ? (
          /* ADMIN DASHBOARD */
          <div className="space-y-8">
            {/* Admin Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-lg font-semibold text-gray-900">{adminStats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active Policies</p>
                    <p className="text-lg font-semibold text-gray-900">{adminStats.activePolicies}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Claims</p>
                    <p className="text-lg font-semibold text-gray-900">{adminStats.totalClaims}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">₹{adminStats.totalRevenue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">New Users This Month</p>
                      <p className="text-sm text-gray-600">23 new registrations</p>
                    </div>
                    <span className="text-green-600 font-semibold">+18%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Active Users</p>
                      <p className="text-sm text-gray-600">142 users active</p>
                    </div>
                    <span className="text-blue-600 font-semibold">91%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Pending Verifications</p>
                      <p className="text-sm text-gray-600">5 users pending</p>
                    </div>
                    <span className="text-yellow-600 font-semibold">5</span>
                  </div>
                </div>
                <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Manage Users
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Pending Claims</p>
                      <p className="text-sm text-gray-600">Awaiting review</p>
                    </div>
                    <span className="text-yellow-600 font-semibold">{adminStats.pendingClaims}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Fraud Alerts</p>
                      <p className="text-sm text-gray-600">Flagged for review</p>
                    </div>
                    <span className="text-red-600 font-semibold">{adminStats.fraudAlerts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Monthly Growth</p>
                      <p className="text-sm text-gray-600">Claims processed</p>
                    </div>
                    <span className="text-green-600 font-semibold">+{adminStats.monthlyGrowth}%</span>
                  </div>
                </div>
                <button className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                  Review Claims
                </button>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </button>
                <button className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </button>
                <button className="flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* USER DASHBOARD */
          <div className="space-y-8">
            {/* User Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active Policy</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {userStats.activePolicy ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Weekly Coverage</p>
                    <p className="text-lg font-semibold text-gray-900">₹{userStats.weeklyCoverage}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Claims</p>
                    <p className="text-lg font-semibold text-gray-900">{userStats.totalClaims}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Payouts</p>
                    <p className="text-lg font-semibold text-gray-900">₹{userStats.totalPayouts}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Policy Number:</span>
                    <span className="font-medium">GB-2026-12345678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zone:</span>
                    <span className="font-medium">{userStats.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-medium">{userStats.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Premium:</span>
                    <span className="font-medium">₹{userStats.weeklyPremium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Earnings:</span>
                    <span className="font-medium">₹{userStats.dailyEarnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Claims</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Heavy Rain Claim</p>
                        <p className="text-sm text-gray-600">2024-03-15</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                        Approved
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Amount: ₹800</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Platform Outage</p>
                        <p className="text-sm text-gray-600">2024-03-10</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Amount: ₹600</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  File New Claim
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  View Policy Details
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                  Download Documents
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
