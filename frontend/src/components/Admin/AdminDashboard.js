import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { 
  Users, 
  Shield, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Activity,
  Eye,
  Settings,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getAdminDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Admin dashboard error:', error);
      toast.error('Failed to load admin dashboard');
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

  const { overview, financials, alerts, activities } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            GuardianByte Insurance Platform Overview
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/analytics"
            className="btn-primary flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </Link>
          <Link
            to="/admin/fraud"
            className="btn-secondary flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Fraud Alerts</span>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">{overview.activePolicies}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalClaims}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Triggers</p>
                <p className="text-2xl font-bold text-gray-900">{overview.activeTriggers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{financials.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ₹{financials.totalPayouts.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Total Payouts</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    parseFloat(overview.lossRatio) > 80 ? 'text-red-600' : 
                    parseFloat(overview.lossRatio) > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {overview.lossRatio}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Loss Ratio</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Loss Ratio Indicator</span>
                  <span className="font-medium">{overview.lossRatio}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      parseFloat(overview.lossRatio) > 80 ? 'bg-red-600' : 
                      parseFloat(overview.lossRatio) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(parseFloat(overview.lossRatio), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {parseFloat(overview.lossRatio) > 80 ? 'High risk - Review pricing' :
                   parseFloat(overview.lossRatio) > 60 ? 'Moderate risk - Monitor closely' :
                   'Healthy - Good performance'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="card-body space-y-3">
            <Link
              to="/admin/triggers"
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Manage Triggers</span>
              </div>
              <Eye className="h-4 w-4 text-gray-400" />
            </Link>
            
            <Link
              to="/admin/analytics"
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">View Analytics</span>
              </div>
              <Eye className="h-4 w-4 text-gray-400" />
            </Link>
            
            <Link
              to="/admin/fraud"
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Review Fraud Alerts</span>
              </div>
              {alerts.flaggedClaimsCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {alerts.flaggedClaimsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Zone Performance */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Zone Performance</h2>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Zone</th>
                  <th>Total Policies</th>
                  <th>Active Policies</th>
                  <th>Total Claims</th>
                  <th>Total Payouts</th>
                  <th>Loss Ratio</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.analytics.zoneStats.map((zone) => {
                  const lossRatio = zone.totalPremium > 0 ? (zone.totalPayouts / zone.totalPremium * 100).toFixed(1) : 0;
                  const isHighRisk = parseFloat(lossRatio) > 80;
                  
                  return (
                    <tr key={zone._id}>
                      <td className="font-medium text-gray-900">{zone._id}</td>
                      <td className="text-gray-500">{zone.totalPolicies}</td>
                      <td className="text-gray-500">{zone.activePolicies}</td>
                      <td className="text-gray-500">{zone.totalClaims}</td>
                      <td className="text-gray-500">₹{zone.totalPayouts.toLocaleString()}</td>
                      <td className="text-gray-500">{lossRatio}%</td>
                      <td>
                        <span className={`badge ${isHighRisk ? 'badge-danger' : 'badge-success'}`}>
                          {isHighRisk ? 'High Risk' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user} • {activity.zone} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">₹{activity.amount}</div>
                  <span className={`badge ${
                    activity.status === 'approved' ? 'badge-success' :
                    activity.status === 'flagged' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Backend API</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">ML Service</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    alerts.monitoringStatus.isMonitoring ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">Trigger Monitoring</span>
                </div>
                <span className={`text-sm ${
                  alerts.monitoringStatus.isMonitoring ? 'text-green-600' : 'text-red-600'
                }`}>
                  {alerts.monitoringStatus.isMonitoring ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Database</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* High Risk Zones */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">High Risk Zones</h2>
          </div>
          <div className="card-body">
            {alerts.highRiskZones.length > 0 ? (
              <div className="space-y-3">
                {alerts.highRiskZones.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">{zone._id}</p>
                      <p className="text-sm text-red-700">
                        Loss Ratio: {((zone.totalPayouts / zone.totalPremium) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No high risk zones detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
