import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const AnalyticsCharts = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await dashboardAPI.getAnalytics({ days: selectedPeriod });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Fetch analytics error:', error);
      // Use mock data for demo
      setAnalyticsData({
        claims: {
          claimsByStatus: [
            { _id: 'approved', count: 45, totalAmount: 36000 },
            { _id: 'pending', count: 12, totalAmount: 9600 },
            { _id: 'flagged', count: 8, totalAmount: 6400 }
          ],
          claimsByType: [
            { _id: 'heavy_rain', count: 25, totalAmount: 20000 },
            { _id: 'extreme_heat', count: 18, totalAmount: 14400 },
            { _id: 'air_pollution', count: 12, totalAmount: 9600 },
            { _id: 'curfew', count: 10, totalAmount: 8000 }
          ],
          fraudDistribution: [
            { _id: '0-25', count: 35 },
            { _id: '25-50', count: 20 },
            { _id: '50-75', count: 8 },
            { _id: '75-100', count: 2 }
          ]
        },
        policies: {
          policiesByStatus: [
            { _id: 'active', count: 150, totalPremium: 22500 },
            { _id: 'expired', count: 30, totalPremium: 4500 },
            { _id: 'cancelled', count: 10, totalPremium: 1500 }
          ],
          premiumDistribution: [
            { _id: '100-200', count: 80 },
            { _id: '200-300', count: 70 },
            { _id: '300-400', count: 30 },
            { _id: '400-500', count: 10 }
          ]
        },
        triggers: {
          triggersByType: [
            { _id: 'heavy_rain', count: 15, avgDuration: 2.5 },
            { _id: 'extreme_heat', count: 12, avgDuration: 4.2 },
            { _id: 'air_pollution', count: 8, avgDuration: 3.1 },
            { _id: 'curfew', count: 5, avgDuration: 6.0 }
          ],
          triggersBySeverity: [
            { _id: 'low', count: 10 },
            { _id: 'medium', count: 20 },
            { _id: 'high', count: 8 },
            { _id: 'critical', count: 2 }
          ]
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

  const { claims, policies, triggers } = analyticsData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Link
            to="/admin"
            className="text-primary-600 hover:text-primary-500"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claims.claimsByStatus.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.policiesByStatus.find(s => s._id === 'active')?.count || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{claims.claimsByStatus.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flagged Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claims.claimsByStatus.find(s => s._id === 'flagged')?.count || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims by Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Claims by Status</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {claims.claimsByStatus.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item._id === 'approved' ? 'bg-green-500' :
                      item._id === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-900 capitalize">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">₹{item.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Claims by Type */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Claims by Trigger Type</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {claims.claimsByType.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-900">
                      {item._id.replace('_', ' ').charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">₹{item.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policies by Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Policies by Status</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {policies.policiesByStatus.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item._id === 'active' ? 'bg-green-500' :
                      item._id === 'expired' ? 'bg-gray-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-900 capitalize">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">₹{item.totalPremium.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fraud Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Fraud Score Distribution</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {claims.fraudDistribution.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item._id === '0-25' ? 'bg-green-500' :
                      item._id === '25-50' ? 'bg-yellow-500' :
                      item._id === '50-75' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((item.count / claims.fraudDistribution.reduce((sum, i) => sum + i.count, 0)) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Analytics */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Trigger Event Analytics</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Triggers by Type</h3>
              <div className="space-y-3">
                {triggers.triggersByType.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item._id.replace('_', ' ').charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">Avg duration: {item.avgDuration}h</p>
                    </div>
                    <span className="badge badge-info">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Triggers by Severity</h3>
              <div className="space-y-3">
                {triggers.triggersBySeverity.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{item._id}</p>
                    </div>
                    <span className={`badge ${
                      item._id === 'low' ? 'badge-success' :
                      item._id === 'medium' ? 'badge-warning' :
                      item._id === 'high' ? 'badge-danger' : 'badge-danger'
                    }`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
