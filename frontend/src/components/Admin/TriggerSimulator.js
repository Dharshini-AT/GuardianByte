import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { 
  Cloud, 
  Sun, 
  Wind, 
  AlertTriangle, 
  Settings, 
  Play, 
  RefreshCw,
  Activity,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const TriggerSimulator = () => {
  const [activeTriggers, setActiveTriggers] = useState([]);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    curfewZones: [],
    curfewAuthority: '',
    curfewRestrictions: '',
    curfewDuration: 4,
    outagePlatform: '',
    outageZones: [],
    outageDuration: 1
  });

  const zones = ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)'];

  useEffect(() => {
    fetchActiveTriggers();
    fetchMonitoringStatus();
  }, []);

  const fetchActiveTriggers = async () => {
    try {
      const response = await dashboardAPI.getActiveTriggers();
      setActiveTriggers(response.data.activeTriggers);
    } catch (error) {
      console.error('Fetch triggers error:', error);
      toast.error('Failed to fetch active triggers');
    }
  };

  const fetchMonitoringStatus = async () => {
    try {
      const response = await dashboardAPI.getMonitoringStatus();
      setMonitoringStatus(response.data.status);
    } catch (error) {
      console.error('Fetch monitoring status error:', error);
    }
  };

  const handleManualCheck = async () => {
    setIsLoading(true);
    try {
      await dashboardAPI.checkTriggers();
      toast.success('Manual trigger check completed');
      await fetchActiveTriggers();
    } catch (error) {
      console.error('Manual check error:', error);
      toast.error('Failed to run manual trigger check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemoTriggers = async () => {
    setIsLoading(true);
    try {
      await dashboardAPI.createDemoTriggers();
      toast.success('Demo triggers created successfully');
      await fetchActiveTriggers();
    } catch (error) {
      console.error('Create demo triggers error:', error);
      toast.error('Failed to create demo triggers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCurfew = async (e) => {
    e.preventDefault();
    
    if (formData.curfewZones.length === 0 || !formData.curfewAuthority) {
      toast.error('Please select zones and enter authority');
      return;
    }

    setIsLoading(true);
    try {
      const restrictions = formData.curfewRestrictions.split(',').map(r => r.trim()).filter(r => r);
      await dashboardAPI.createCurfewTrigger({
        zones: formData.curfewZones,
        authority: formData.curfewAuthority,
        restrictions: restrictions.length > 0 ? restrictions : ['no_delivery_after_8pm'],
        duration: formData.curfewDuration
      });
      
      toast.success('Curfew trigger created successfully');
      setFormData({
        ...formData,
        curfewZones: [],
        curfewAuthority: '',
        curfewRestrictions: '',
        curfewDuration: 4
      });
      await fetchActiveTriggers();
    } catch (error) {
      console.error('Create curfew error:', error);
      toast.error('Failed to create curfew trigger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOutage = async (e) => {
    e.preventDefault();
    
    if (!formData.outagePlatform || formData.outageZones.length === 0) {
      toast.error('Please enter platform name and select zones');
      return;
    }

    setIsLoading(true);
    try {
      await dashboardAPI.createOutageTrigger({
        platformName: formData.outagePlatform,
        affectedZones: formData.outageZones,
        duration: formData.outageDuration
      });
      
      toast.success('Platform outage trigger created successfully');
      setFormData({
        ...formData,
        outagePlatform: '',
        outageZones: [],
        outageDuration: 1
      });
      await fetchActiveTriggers();
    } catch (error) {
      console.error('Create outage error:', error);
      toast.error('Failed to create outage trigger');
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
      'platform_outage': Settings
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

  const handleZoneToggle = (type, zone) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(zone)
        ? prev[type].filter(z => z !== zone)
        : [...prev[type], zone]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trigger Simulator</h1>
          <p className="text-gray-600 mt-1">
            Monitor and simulate parametric trigger events
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleManualCheck}
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Check Triggers</span>
          </button>
          <button
            onClick={handleCreateDemoTriggers}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Create Demo</span>
          </button>
        </div>
      </div>

      {/* Monitoring Status */}
      {monitoringStatus && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Monitoring Status</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  monitoringStatus.isMonitoring ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">Status</p>
                  <p className="text-sm text-gray-600">
                    {monitoringStatus.isMonitoring ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Schedule</p>
                  <p className="text-sm text-gray-600">{monitoringStatus.schedule}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Last Check</p>
                  <p className="text-sm text-gray-600">
                    {new Date(monitoringStatus.lastCheck).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Triggers */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Active Triggers</h2>
        </div>
        <div className="card-body">
          {activeTriggers.length > 0 ? (
            <div className="space-y-4">
              {activeTriggers.map((trigger) => {
                const Icon = getTriggerIcon(trigger.eventType);
                return (
                  <div key={trigger._id} className="border-l-4 border-orange-400 bg-orange-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Icon className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{trigger.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{trigger.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getTriggerColor(trigger.severity)}`}>
                              {trigger.severity}
                            </span>
                            <span className="text-xs text-gray-500">
                              Zones: {trigger.affectedZones.join(', ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              Duration: {Math.round((new Date(trigger.eventEnd) - new Date(trigger.eventStart)) / (1000 * 60 * 60))}h
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Started</p>
                        <p className="text-sm text-gray-900">
                          {new Date(trigger.eventStart).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Triggers</h3>
              <p className="text-gray-600 mb-4">
                There are currently no active trigger events
              </p>
              <button
                onClick={handleCreateDemoTriggers}
                disabled={isLoading}
                className="btn-primary"
              >
                Create Demo Triggers
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curfew Trigger */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Create Curfew Trigger</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateCurfew} className="space-y-4">
              <div>
                <label className="form-label">Affected Zones</label>
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <label key={zone} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.curfewZones.includes(zone)}
                        onChange={() => handleZoneToggle('curfewZones', zone)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{zone}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="form-label">Authority</label>
                <input
                  type="text"
                  value={formData.curfewAuthority}
                  onChange={(e) => setFormData({...formData, curfewAuthority: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Municipal Corporation"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Restrictions (comma-separated)</label>
                <input
                  type="text"
                  value={formData.curfewRestrictions}
                  onChange={(e) => setFormData({...formData, curfewRestrictions: e.target.value})}
                  className="form-input"
                  placeholder="e.g., no_delivery_after_8pm, limited_hours"
                />
              </div>
              
              <div>
                <label className="form-label">Duration (hours)</label>
                <select
                  value={formData.curfewDuration}
                  onChange={(e) => setFormData({...formData, curfewDuration: parseInt(e.target.value)})}
                  className="form-select"
                >
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Creating...' : 'Create Curfew Trigger'}
              </button>
            </form>
          </div>
        </div>

        {/* Platform Outage Trigger */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Create Platform Outage</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateOutage} className="space-y-4">
              <div>
                <label className="form-label">Platform Name</label>
                <input
                  type="text"
                  value={formData.outagePlatform}
                  onChange={(e) => setFormData({...formData, outagePlatform: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Zomato, Swiggy"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Affected Zones</label>
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <label key={zone} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.outageZones.includes(zone)}
                        onChange={() => handleZoneToggle('outageZones', zone)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{zone}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="form-label">Duration (hours)</label>
                <select
                  value={formData.outageDuration}
                  onChange={(e) => setFormData({...formData, outageDuration: parseInt(e.target.value)})}
                  className="form-select"
                >
                  <option value={0.5}>30 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Creating...' : 'Create Outage Trigger'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriggerSimulator;
