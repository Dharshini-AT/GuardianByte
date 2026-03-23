import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Cloud,
  Sun,
  Wind
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getUserDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTriggerIcon = (eventType) => {
    const icons = {
      'heavy_rain': Cloud,
      'extreme_heat': Sun,
      'air_pollution': Wind,
      'curfew': AlertTriangle,
      'platform_outage': AlertTriangle
    };
    return icons[eventType] || AlertTriangle;
  };

  const getTriggerColor = (severity) => {
    const colors = {
      'low': 'text-green-600 bg-green-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'high': 'text-orange-600 bg-orange-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return colors[severity] || colors.medium;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const { user, policy, summary, activeTriggers, coverageStatus } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-primary-100">
          Your income protection is active and monitoring disruptions in {user?.zone}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {coverageStatus.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Shield className={`h-8 w-8 ${coverageStatus.isActive ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Earnings Protected</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.earningsProtected}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalClaims}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{coverageStatus.daysRemaining}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Card */}
        <div className="lg:col-span-2">
          {policy ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Active Policy</h2>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    coverageStatus.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {coverageStatus.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Policy Number</p>
                      <p className="font-medium text-gray-900">{policy.policyNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Weekly Premium</p>
                      <p className="font-medium text-gray-900">₹{policy.weeklyPremium}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Daily Coverage</p>
                      <p className="font-medium text-gray-900">₹{policy.coverageAmountPerDay}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Weekly Coverage</p>
                      <p className="font-medium text-gray-900">₹{policy.maxCoveragePerWeek}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Coverage Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ 
                          width: `${(coverageStatus.weeklyPayoutsUsed / coverageStatus.maxWeeklyCoverage) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{coverageStatus.weeklyPayoutsUsed} of ₹{coverageStatus.maxWeeklyCoverage} used this week
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link
                      to="/policy"
                      className="flex-1 bg-primary-600 text-white text-center py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      to="/claims"
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      View Claims
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Policy</h3>
                <p className="text-gray-600 mb-4">
                  Get protected today with our parametric insurance
                </p>
                <Link
                  to="/policy"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Get Coverage
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Active Triggers */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h2>
            
            {activeTriggers.length > 0 ? (
              <div className="space-y-3">
                {activeTriggers.map((trigger) => {
                  const Icon = getTriggerIcon(trigger.eventType);
                  return (
                    <div key={trigger._id} className="border-l-4 border-orange-400 bg-orange-50 p-3">
                      <div className="flex items-start">
                        <Icon className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {trigger.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {trigger.description}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${getTriggerColor(trigger.severity)}`}>
                            {trigger.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No active alerts in your area</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Claims */}
      {dashboardData.recentClaims && dashboardData.recentClaims.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Claims</h2>
              <Link
                to="/claims"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentClaims.map((claim) => (
                    <tr key={claim._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.claimNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.triggerEventId?.eventType?.replace('_', ' ') || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{claim.claimedAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                          claim.status === 'flagged' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(claim.claimDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
