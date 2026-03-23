const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const triggerMonitor = require('../services/triggerMonitor');
const weatherService = require('../services/weatherService');
const { authenticateToken, requireAdmin } = require('../config/auth');

// Protected routes
router.get('/user', authenticateToken, dashboardController.getUserDashboard);

// Admin routes
router.get('/admin', authenticateToken, requireAdmin, dashboardController.getAdminDashboard);
router.get('/analytics', authenticateToken, requireAdmin, dashboardController.getAnalytics);
router.get('/fraud-alerts', authenticateToken, requireAdmin, dashboardController.getFraudAlerts);

// Admin trigger management
router.post('/triggers/check', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await triggerMonitor.runManualTriggerCheck();
    
    res.json({
      success: true,
      message: 'Manual trigger check completed'
    });

  } catch (error) {
    console.error('Manual trigger check error:', error);
    res.status(500).json({
      success: false,
      message: 'Manual trigger check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/triggers/demo', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await triggerMonitor.createDemoTriggers();
    
    res.json({
      success: true,
      message: 'Demo triggers created successfully'
    });

  } catch (error) {
    console.error('Create demo triggers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create demo triggers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/triggers/curfew', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { zones, authority, restrictions, duration = 4 } = req.body;
    
    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Zones are required'
      });
    }

    const event = await weatherService.createCurfewTrigger(zones, authority, restrictions, duration);
    
    res.json({
      success: true,
      message: 'Curfew trigger created successfully',
      data: { event }
    });

  } catch (error) {
    console.error('Create curfew trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create curfew trigger',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/triggers/outage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { platformName, affectedZones, duration = 1 } = req.body;
    
    if (!platformName || !affectedZones || !Array.isArray(affectedZones) || affectedZones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Platform name and affected zones are required'
      });
    }

    const event = await weatherService.createPlatformOutageTrigger(platformName, affectedZones, duration);
    
    res.json({
      success: true,
      message: 'Platform outage trigger created successfully',
      data: { event }
    });

  } catch (error) {
    console.error('Create platform outage trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create platform outage trigger',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/triggers/active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const activeTriggers = await weatherService.getActiveTriggers();
    
    res.json({
      success: true,
      data: { activeTriggers }
    });

  } catch (error) {
    console.error('Get active triggers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active triggers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/monitoring/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = triggerMonitor.getMonitoringStatus();
    
    res.json({
      success: true,
      data: { status }
    });

  } catch (error) {
    console.error('Get monitoring status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
