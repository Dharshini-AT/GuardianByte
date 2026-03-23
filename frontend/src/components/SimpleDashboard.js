import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, FileText, Activity } from 'lucide-react';

const SimpleDashboard = () => {
  const [userData, setUserData] = useState({
    name: 'Demo User',
    email: 'raj@example.com',
    zone: 'Zone A (Bandra)',
    vehicleType: 'bike',
    dailyEarnings: 800,
    weeklyPremium: 200,
    coverageAmount: 4000,
    activePolicy: true
  });

  const [stats, setStats] = useState({
    totalClaims: 2,
    approvedClaims: 1,
    pendingClaims: 1,
    totalPayouts: 1500
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">GuardianByte</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{userData.name}</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
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
            Here's your insurance dashboard overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Policy</p>
                <p className="text-lg font-semibold text-gray-900">
                  {userData.activePolicy ? 'Active' : 'Inactive'}
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
                <p className="text-lg font-semibold text-gray-900">₹{userData.coverageAmount}</p>
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
                <p className="text-lg font-semibold text-gray-900">{stats.totalClaims}</p>
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
                <p className="text-lg font-semibold text-gray-900">₹{stats.totalPayouts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Policy Number:</span>
                <span className="font-medium">GB-2026-12345678</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zone:</span>
                <span className="font-medium">{userData.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Type:</span>
                <span className="font-medium">{userData.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Premium:</span>
                <span className="font-medium">₹{userData.weeklyPremium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Earnings:</span>
                <span className="font-medium">₹{userData.dailyEarnings}</span>
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

        {/* Quick Actions */}
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
    </div>
  );
};

export default SimpleDashboard;
