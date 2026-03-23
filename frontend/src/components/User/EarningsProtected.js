import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, Shield, Calendar, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const EarningsProtected = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const response = await dashboardAPI.getUserDashboard();
      setEarningsData(response.data);
    } catch (error) {
      console.error('Fetch earnings error:', error);
      // Use mock data for demo
      setEarningsData({
        summary: {
          earningsProtected: 2400,
          weeklyCoverage: 4000,
          totalClaims: 3,
          approvedClaims: 2,
          avgFraudScore: 25
        },
        coverageStatus: {
          isActive: true,
          daysRemaining: 5,
          weeklyPayoutsUsed: 1600,
          maxWeeklyCoverage: 4000
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const { summary, coverageStatus } = earningsData;

  // Mock monthly data for chart
  const monthlyData = [
    { month: 'Jan', protected: 0, claims: 0 },
    { month: 'Feb', protected: 800, claims: 1 },
    { month: 'Mar', protected: 2400, claims: 3 },
    { month: 'Apr', protected: 1600, claims: 2 },
    { month: 'May', protected: 3200, claims: 4 },
    { month: 'Jun', protected: 0, claims: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Earnings Protection</h1>
        <Link
          to="/dashboard"
          className="text-primary-600 hover:text-primary-500"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Protected</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.earningsProtected}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Coverage</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.weeklyCoverage}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Claims Filed</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalClaims}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalClaims > 0 ? Math.round((summary.approvedClaims / summary.totalClaims) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Coverage */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Current Coverage</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`badge ${coverageStatus.isActive ? 'badge-success' : 'badge-gray'}`}>
                  {coverageStatus.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Days Remaining</span>
                <span className="font-medium">{coverageStatus.daysRemaining} days</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weekly Usage</span>
                <span className="font-medium">
                  ₹{coverageStatus.weeklyPayoutsUsed} / ₹{coverageStatus.maxWeeklyCoverage}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Weekly Progress</span>
                  <span className="font-medium">
                    {Math.round((coverageStatus.weeklyPayoutsUsed / coverageStatus.maxWeeklyCoverage) * 100)}%
                  </span>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${(coverageStatus.weeklyPayoutsUsed / coverageStatus.maxWeeklyCoverage) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Overview</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{data.month}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Protected</p>
                      <p className="font-medium text-green-600">₹{data.protected}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Claims</p>
                      <p className="font-medium text-blue-600">{data.claims}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Protection Benefits */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Protection Benefits</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Parametric Coverage</h3>
              <p className="text-sm text-gray-600">
                Automatic payouts based on trigger events, no manual claims required
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Instant Payouts</h3>
              <p className="text-sm text-gray-600">
                Get paid immediately when trigger events occur in your delivery zone
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Affordable Premiums</h3>
              <p className="text-sm text-gray-600">
                Weekly premiums based on your risk profile and delivery patterns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsProtected;
