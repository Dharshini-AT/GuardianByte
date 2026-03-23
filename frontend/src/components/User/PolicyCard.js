import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, DollarSign, Calendar, CheckCircle } from 'lucide-react';

const PolicyCard = () => {
  // Mock data for demo
  const policy = {
    policyNumber: 'GB-2026-12345678',
    weeklyPremium: 180,
    dailyCoverage: 800,
    weeklyCoverage: 4000,
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    coverageProgress: 25
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Policy</h1>
        <Link
          to="/dashboard"
          className="text-primary-600 hover:text-primary-500"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Policy Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Policy</h2>
                <span className="badge badge-success">
                  {policy.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Policy Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Policy Information</h3>
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
                      <p className="font-medium text-gray-900">₹{policy.dailyCoverage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Weekly Coverage</p>
                      <p className="font-medium text-gray-900">₹{policy.weeklyCoverage}</p>
                    </div>
                  </div>
                </div>

                {/* Coverage Progress */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Weekly Coverage Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Used this week</span>
                      <span className="font-medium">₹{Math.round(policy.weeklyCoverage * policy.coverageProgress / 100)}</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar"
                        style={{ width: `${policy.coverageProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {policy.coverageProgress}% of weekly coverage used
                    </p>
                  </div>
                </div>

                {/* Policy Period */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Coverage Period</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-medium text-gray-900">
                          {policy.startDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-medium text-gray-900">
                          {policy.endDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Summary */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Coverage Summary</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Status</span>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Weekly Premium</span>
                  </div>
                  <span className="font-medium">₹{policy.weeklyPremium}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Coverage Type</span>
                  </div>
                  <span className="font-medium">Parametric</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body space-y-3">
              <Link
                to="/claims"
                className="btn-primary w-full text-center"
              >
                View Claims
              </Link>
              <button className="btn-secondary w-full">
                Download Policy
              </button>
              <button className="btn-secondary w-full">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyCard;
