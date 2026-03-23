import React, { useState, useEffect } from 'react';
import { claimAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { FileText, Calendar, DollarSign, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const ClaimHistory = () => {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await claimAPI.getUserClaims();
      setClaims(response.data.claims || []);
    } catch (error) {
      console.error('Fetch claims error:', error);
      // Use mock data for demo
      setClaims([
        {
          _id: '1',
          claimNumber: 'GB-CLM-2026-001',
          triggerType: 'heavy_rain',
          claimedAmount: 800,
          approvedAmount: 800,
          status: 'approved',
          claimDate: new Date('2026-03-20'),
          fraudScore: 15,
          paymentStatus: 'completed'
        },
        {
          _id: '2',
          claimNumber: 'GB-CLM-2026-002',
          triggerType: 'extreme_heat',
          claimedAmount: 600,
          approvedAmount: null,
          status: 'pending',
          claimDate: new Date('2026-03-21'),
          fraudScore: 45,
          paymentStatus: 'pending'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'approved': CheckCircle,
      'pending': Clock,
      'flagged': AlertTriangle,
      'rejected': AlertTriangle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      'approved': 'text-green-600 bg-green-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'flagged': 'text-red-600 bg-red-100',
      'rejected': 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getTriggerTypeLabel = (type) => {
    return type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Claim History</h1>
        <Link
          to="/dashboard"
          className="text-primary-600 hover:text-primary-500"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claims.filter(c => c.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{claims.reduce((sum, claim) => sum + (claim.approvedAmount || 0), 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">All Claims</h2>
        </div>
        <div className="card-body">
          {claims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Claim ID</th>
                    <th>Trigger Type</th>
                    <th>Claimed Amount</th>
                    <th>Approved Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Fraud Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.map((claim) => {
                    const StatusIcon = getStatusIcon(claim.status);
                    return (
                      <tr key={claim._id}>
                        <td className="font-medium text-gray-900">
                          {claim.claimNumber}
                        </td>
                        <td className="text-gray-500">
                          {getTriggerTypeLabel(claim.triggerType)}
                        </td>
                        <td className="text-gray-500">
                          ₹{claim.claimedAmount}
                        </td>
                        <td className="text-gray-500">
                          {claim.approvedAmount ? `₹${claim.approvedAmount}` : '-'}
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                              {claim.status}
                            </span>
                          </div>
                        </td>
                        <td className="text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(claim.claimDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              claim.fraudScore < 30 ? 'bg-green-500' :
                              claim.fraudScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm">{claim.fraudScore}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't filed any claims yet. Claims are automatically created when trigger events occur.
              </p>
              <Link
                to="/dashboard"
                className="btn-primary"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimHistory;
