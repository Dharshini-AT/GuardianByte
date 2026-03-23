import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, CheckCircle, X, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const FraudAlerts = () => {
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filters, setFilters] = useState({
    minScore: 70,
    status: 'flagged'
  });

  useEffect(() => {
    fetchFraudAlerts();
  }, [filters]);

  const fetchFraudAlerts = async () => {
    try {
      const response = await dashboardAPI.getFraudAlerts(filters);
      setFraudAlerts(response.data.flaggedClaims || []);
    } catch (error) {
      console.error('Fetch fraud alerts error:', error);
      // Use mock data for demo
      setFraudAlerts([
        {
          _id: '1',
          claimNumber: 'GB-CLM-2026-001',
          userId: { name: 'Raj Kumar', phone: '9876543210', email: 'raj@example.com', zone: 'Zone A (Bandra)' },
          policyId: { policyNumber: 'GB-2026-12345678', weeklyPremium: 180 },
          triggerEventId: { eventType: 'heavy_rain', title: 'Heavy Rain Alert', eventStart: new Date('2026-03-20') },
          claimedAmount: 800,
          fraudScore: 85,
          status: 'flagged',
          claimDate: new Date('2026-03-20'),
          fraudAnalysis: {
            locationMatch: false,
            timingMatch: false,
            frequencyCheck: true,
            anomalies: ['Claim zone does not match user zone', 'Claim filed outside working hours'],
            riskFactors: ['location_mismatch', 'unusual_timing']
          }
        },
        {
          _id: '2',
          claimNumber: 'GB-CLM-2026-002',
          userId: { name: 'Priya Sharma', phone: '9876543211', email: 'priya@example.com', zone: 'Zone B (Andheri)' },
          policyId: { policyNumber: 'GB-2026-12345679', weeklyPremium: 150 },
          triggerEventId: { eventType: 'extreme_heat', title: 'Extreme Heat Alert', eventStart: new Date('2026-03-21') },
          claimedAmount: 600,
          fraudScore: 72,
          status: 'flagged',
          claimDate: new Date('2026-03-21'),
          fraudAnalysis: {
            locationMatch: true,
            timingMatch: false,
            frequencyCheck: false,
            anomalies: ['High claim frequency this month'],
            riskFactors: ['high_frequency', 'unusual_timing']
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewClaim = async (claimId, action) => {
    try {
      await dashboardAPI.reviewClaim(claimId, { action, notes: `Claim ${action} by admin` });
      toast.success(`Claim ${action} successfully`);
      await fetchFraudAlerts();
      setSelectedClaim(null);
    } catch (error) {
      console.error('Review claim error:', error);
      toast.error('Failed to review claim');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
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
        <h1 className="text-3xl font-bold text-gray-900">Fraud Alerts</h1>
        <Link
          to="/admin"
          className="text-primary-600 hover:text-primary-500"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mr-2">Min Score:</label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
                className="form-select"
              >
                <option value={40}>40+</option>
                <option value={60}>60+</option>
                <option value={70}>70+</option>
                <option value={80}>80+</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mr-2">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="form-select"
              >
                <option value="all">All</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Flagged</p>
                <p className="text-2xl font-bold text-gray-900">{fraudAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk (80+)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fraudAlerts.filter(c => c.fraudScore >= 80).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medium Risk (60-79)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fraudAlerts.filter(c => c.fraudScore >= 60 && c.fraudScore < 80).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Risk (40-59)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fraudAlerts.filter(c => c.fraudScore >= 40 && c.fraudScore < 60).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Alerts List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Flagged Claims Review</h2>
        </div>
        <div className="card-body">
          {fraudAlerts.length > 0 ? (
            <div className="space-y-4">
              {fraudAlerts.map((claim) => (
                <div key={claim._id} className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-medium text-gray-900">{claim.claimNumber}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(claim.fraudScore)}`}>
                          Score: {claim.fraudScore}
                        </span>
                        <span className="badge badge-danger">Flagged</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">User</p>
                          <p className="font-medium text-gray-900">{claim.userId.name}</p>
                          <p className="text-sm text-gray-500">{claim.userId.email} • {claim.userId.zone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Claim Details</p>
                          <p className="font-medium text-gray-900">₹{claim.claimedAmount}</p>
                          <p className="text-sm text-gray-500">
                            {claim.triggerEventId.eventType.replace('_', ' ').charAt(0).toUpperCase() + claim.triggerEventId.eventType.slice(1).replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">Risk Factors:</p>
                        <div className="flex flex-wrap gap-2">
                          {claim.fraudAnalysis.riskFactors.map((factor, index) => (
                            <span key={index} className="badge badge-warning">
                              {factor.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Anomalies:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {claim.fraudAnalysis.anomalies.map((anomaly, index) => (
                            <li key={index}>• {anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReviewClaim(claim._id, 'approve')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReviewClaim(claim._id, 'reject')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Fraud Alerts</h3>
              <p className="text-gray-600">
                No flagged claims found with the current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Claim Details</h2>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Claim Number</p>
                    <p className="font-medium">{selectedClaim.claimNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fraud Score</p>
                    <p className="font-medium">{selectedClaim.fraudScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User</p>
                    <p className="font-medium">{selectedClaim.userId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">₹{selectedClaim.claimedAmount}</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleReviewClaim(selectedClaim._id, 'approve')}
                    className="btn-success"
                  >
                    Approve Claim
                  </button>
                  <button
                    onClick={() => handleReviewClaim(selectedClaim._id, 'reject')}
                    className="btn-danger"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => setSelectedClaim(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudAlerts;
