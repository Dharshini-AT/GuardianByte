const axios = require('axios');
const TriggerEvent = require('../models/TriggerEvent');

// Mumbai coordinates for weather API
const MUMBAI_COORDS = {
  lat: 19.0760,
  lon: 72.8777
};

// Zone coordinates (approximate)
const ZONE_COORDS = {
  'Zone A (Bandra)': { lat: 19.0596, lon: 72.8295 },
  'Zone B (Andheri)': { lat: 19.1199, lon: 72.8465 },
  'Zone C (Navi Mumbai)': { lat: 19.0330, lon: 73.0297 }
};

// Get current weather data for a zone
const getWeatherForZone = async (zone) => {
  try {
    const coords = ZONE_COORDS[zone] || MUMBAI_COORDS;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenWeather API key not configured, using mock data');
      return getMockWeatherData(zone);
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat: coords.lat,
          lon: coords.lon,
          appid: apiKey,
          units: 'metric'
        }
      }
    );

    const data = response.data;
    
    return {
      zone,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0,
      windSpeed: data.wind.speed,
      visibility: data.visibility / 1000, // Convert to km
      weather: data.weather[0].main,
      description: data.weather[0].description,
      timestamp: new Date(),
      location: data.name
    };

  } catch (error) {
    console.error(`Weather API error for ${zone}:`, error.message);
    return getMockWeatherData(zone);
  }
};

// Get mock weather data for demo/testing
const getMockWeatherData = (zone) => {
  const mockData = {
    'Zone A (Bandra)': {
      temperature: 28 + Math.random() * 10,
      rainfall: Math.random() * 30,
      humidity: 70 + Math.random() * 20,
      aqi: 150 + Math.random() * 200
    },
    'Zone B (Andheri)': {
      temperature: 27 + Math.random() * 10,
      rainfall: Math.random() * 25,
      humidity: 65 + Math.random() * 25,
      aqi: 120 + Math.random() * 180
    },
    'Zone C (Navi Mumbai)': {
      temperature: 26 + Math.random() * 10,
      rainfall: Math.random() * 20,
      humidity: 60 + Math.random() * 30,
      aqi: 100 + Math.random() * 150
    }
  };

  const baseData = mockData[zone] || mockData['Zone B (Andheri)'];
  
  return {
    zone,
    temperature: Math.round(baseData.temperature * 10) / 10,
    humidity: Math.round(baseData.humidity),
    rainfall: Math.round(baseData.rainfall * 10) / 10,
    windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
    visibility: Math.round((3 + Math.random() * 7) * 10) / 10,
    weather: 'Rain',
    description: 'moderate rain',
    aqi: Math.round(baseData.aqi),
    timestamp: new Date(),
    location: zone,
    isMock: true
  };
};

// Get AQI data for a zone
const getAQIForZone = async (zone) => {
  try {
    // For demo, use mock AQI data
    const mockAQI = {
      'Zone A (Bandra)': 180 + Math.round(Math.random() * 120),
      'Zone B (Andheri)': 150 + Math.round(Math.random() * 100),
      'Zone C (Navi Mumbai)': 120 + Math.round(Math.random() * 80)
    };

    return {
      zone,
      aqi: mockAQI[zone] || 150,
      category: getAQICategory(mockAQI[zone] || 150),
      timestamp: new Date(),
      isMock: true
    };

  } catch (error) {
    console.error(`AQI data error for ${zone}:`, error.message);
    return null;
  }
};

// Get AQI category based on value
const getAQICategory = (aqi) => {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy';
  if (aqi <= 200) return 'very_unhealthy';
  return 'hazardous';
};

// Check for heavy rain trigger
const checkHeavyRainTrigger = async (zone) => {
  try {
    const weatherData = await getWeatherForZone(zone);
    const threshold = 20; // 20mm in 1 hour
    
    if (weatherData.rainfall >= threshold) {
      // Check if there's already an active event for this zone
      const existingEvent = await TriggerEvent.findOne({
        eventType: 'heavy_rain',
        affectedZones: zone,
        isActive: true,
        eventEnd: { $gte: new Date() }
      });

      if (!existingEvent) {
        // Create new trigger event
        const event = new TriggerEvent({
          eventType: 'heavy_rain',
          title: `Heavy Rain Alert in ${zone}`,
          description: `Heavy rainfall detected: ${weatherData.rainfall}mm/h in ${zone}`,
          affectedZones: [zone],
          eventStart: new Date(),
          eventEnd: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours duration
          severity: weatherData.rainfall > 40 ? 'high' : 'medium',
          source: weatherData.isMock ? 'mock' : 'weather_api',
          measurements: {
            weather: {
              temperature: weatherData.temperature,
              rainfall: {
                amount: weatherData.rainfall,
                duration: 1,
                intensity: weatherData.rainfall > 40 ? 'heavy' : 'moderate',
                unit: 'mm'
              },
              humidity: weatherData.humidity,
              windSpeed: weatherData.windSpeed,
              visibility: weatherData.visibility
            }
          },
          thresholds: {
            triggered: [{
              metric: 'rainfall',
              value: weatherData.rainfall,
              threshold,
              unit: 'mm',
              exceededAt: new Date()
            }],
            minimum: { rainfall_mm: threshold, duration_hours: 1 }
          }
        });

        await event.save();
        console.log(`🌧️ Heavy rain trigger created for ${zone}: ${weatherData.rainfall}mm/h`);
        return event;
      }
    }

    return null;

  } catch (error) {
    console.error(`Heavy rain trigger check error for ${zone}:`, error);
    return null;
  }
};

// Check for extreme heat trigger
const checkExtremeHeatTrigger = async (zone) => {
  try {
    const weatherData = await getWeatherForZone(zone);
    const threshold = 40; // 40°C
    
    if (weatherData.temperature >= threshold) {
      const existingEvent = await TriggerEvent.findOne({
        eventType: 'extreme_heat',
        affectedZones: zone,
        isActive: true,
        eventEnd: { $gte: new Date() }
      });

      if (!existingEvent) {
        const event = new TriggerEvent({
          eventType: 'extreme_heat',
          title: `Extreme Heat Alert in ${zone}`,
          description: `Extreme temperature detected: ${weatherData.temperature}°C in ${zone}`,
          affectedZones: [zone],
          eventStart: new Date(),
          eventEnd: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours duration
          severity: weatherData.temperature > 42 ? 'critical' : 'high',
          source: weatherData.isMock ? 'mock' : 'weather_api',
          measurements: {
            weather: {
              temperature: {
                current: weatherData.temperature,
                max: weatherData.temperature + 2,
                min: weatherData.temperature - 1,
                unit: 'celsius'
              },
              humidity: weatherData.humidity
            }
          },
          thresholds: {
            triggered: [{
              metric: 'temperature',
              value: weatherData.temperature,
              threshold,
              unit: 'celsius',
              exceededAt: new Date()
            }],
            minimum: { temperature_celsius: threshold, duration_hours: 3 }
          }
        });

        await event.save();
        console.log(`🌡️ Extreme heat trigger created for ${zone}: ${weatherData.temperature}°C`);
        return event;
      }
    }

    return null;

  } catch (error) {
    console.error(`Extreme heat trigger check error for ${zone}:`, error);
    return null;
  }
};

// Check for air pollution trigger
const checkAirPollutionTrigger = async (zone) => {
  try {
    const aqiData = await getAQIForZone(zone);
    if (!aqiData) return null;

    const threshold = 300; // Hazardous AQI level
    
    if (aqiData.aqi >= threshold) {
      const existingEvent = await TriggerEvent.findOne({
        eventType: 'air_pollution',
        affectedZones: zone,
        isActive: true,
        eventEnd: { $gte: new Date() }
      });

      if (!existingEvent) {
        const event = new TriggerEvent({
          eventType: 'air_pollution',
          title: `Hazardous Air Quality Alert in ${zone}`,
          description: `AQI level detected: ${aqiData.aqi} (${aqiData.category}) in ${zone}`,
          affectedZones: [zone],
          eventStart: new Date(),
          eventEnd: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours duration
          severity: aqiData.aqi > 400 ? 'critical' : 'high',
          source: 'mock',
          measurements: {
            weather: {
              aqi: {
                value: aqiData.aqi,
                category: aqiData.category
              }
            }
          },
          thresholds: {
            triggered: [{
              metric: 'aqi',
              value: aqiData.aqi,
              threshold,
              unit: 'AQI',
              exceededAt: new Date()
            }],
            minimum: { aqi: threshold }
          }
        });

        await event.save();
        console.log(`💨 Air pollution trigger created for ${zone}: AQI ${aqiData.aqi}`);
        return event;
      }
    }

    return null;

  } catch (error) {
    console.error(`Air pollution trigger check error for ${zone}:`, error);
    return null;
  }
};

// Create manual curfew trigger (admin function)
const createCurfewTrigger = async (zones, authority, restrictions, duration = 4) => {
  try {
    const event = new TriggerEvent({
      eventType: 'curfew',
      title: `Curfew Imposed in ${zones.join(', ')}`,
      description: `Curfew imposed by ${authority} in ${zones.join(', ')}`,
      affectedZones: zones,
      eventStart: new Date(),
      eventEnd: new Date(Date.now() + duration * 60 * 60 * 1000),
      severity: 'high',
      source: 'admin_manual',
      measurements: {
        curfew: {
          authority,
          type: 'section_144',
          restrictions,
          exemptionAllowed: true
        }
      },
      thresholds: {
        triggered: [{
          metric: 'curfew',
          value: true,
          threshold: true,
          unit: 'boolean',
          exceededAt: new Date()
        }],
        minimum: { is_active: true }
      }
    });

    await event.save();
    console.log(`🚫 Curfew trigger created for ${zones.join(', ')}`);
    return event;

  } catch (error) {
    console.error('Curfew trigger creation error:', error);
    throw error;
  }
};

// Create platform outage trigger (mock)
const createPlatformOutageTrigger = async (platformName, affectedZones, duration = 1) => {
  try {
    const event = new TriggerEvent({
      eventType: 'platform_outage',
      title: `${platformName} Outage in ${affectedZones.join(', ')}`,
      description: `${platformName} platform experiencing technical issues in ${affectedZones.join(', ')}`,
      affectedZones,
      eventStart: new Date(),
      eventEnd: new Date(Date.now() + duration * 60 * 60 * 1000),
      severity: 'medium',
      source: 'mock',
      measurements: {
        platform: {
          platformName,
          outageType: 'regional',
          affectedServices: ['delivery', 'app'],
          estimatedUsersAffected: 5000,
          technicalDetails: 'Server connectivity issues'
        }
      },
      thresholds: {
        triggered: [{
          metric: 'outage_duration',
          value: duration,
          threshold: 0.5,
          unit: 'hours',
          exceededAt: new Date()
        }],
        minimum: { duration_minutes: 30 }
      }
    });

    await event.save();
    console.log(`📱 Platform outage trigger created: ${platformName} in ${affectedZones.join(', ')}`);
    return event;

  } catch (error) {
    console.error('Platform outage trigger creation error:', error);
    throw error;
  }
};

// Get all active trigger events
const getActiveTriggers = async () => {
  try {
    const events = await TriggerEvent.findActive()
      .sort({ severity: -1, eventStart: -1 });
    
    return events;
  } catch (error) {
    console.error('Get active triggers error:', error);
    return [];
  }
};

// Deactivate expired events
const deactivateExpiredEvents = async () => {
  try {
    const result = await TriggerEvent.updateMany(
      {
        isActive: true,
        eventEnd: { $lt: new Date() }
      },
      { isActive: false }
    );

    if (result.modifiedCount > 0) {
      console.log(`🔄 Deactivated ${result.modifiedCount} expired trigger events`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('Deactivate expired events error:', error);
    return 0;
  }
};

module.exports = {
  getWeatherForZone,
  getAQIForZone,
  checkHeavyRainTrigger,
  checkExtremeHeatTrigger,
  checkAirPollutionTrigger,
  createCurfewTrigger,
  createPlatformOutageTrigger,
  getActiveTriggers,
  deactivateExpiredEvents,
  getAQICategory
};
