import express from 'express';
import fetch from 'node-fetch';
import https from 'https';
import config from '../config/config.js';

const router = express.Router();

// HTTPS agent for handling certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Icon configurations for Dikshank
const TATA_VEHICLE_ICONS = {
  Running: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_R.png',
  Waiting: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_W.png',
  Idle: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_S.png',
  'In-Active': 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_I.png',
  Default: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_I.png'
};
const TRICYCLE_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';

// Dikshank API endpoint (keep this)
router.get('/dikshank/vehicles', async (req, res) => {
  try {
    if (!config.DIKSHANK_API_URL) {
      return res.status(500).json({
        error: 'Dikshank API URL not configured',
        message: 'DIKSHANK_API_URL environment variable is missing',
        source: 'dikshank'
      });
    }

    console.log('📡 Fetching Dikshank data from:', config.DIKSHANK_API_URL);
    
    const response = await fetch(config.DIKSHANK_API_URL, {
      method: 'GET',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Dikshank API failed: HTTP status ${response.status}`);
    }

    const dikshankData = await response.json();
    console.log('✅ Dikshank raw data received:', dikshankData.data?.length || 0, 'vehicles');

    // Transform data on backend
    const normalized = (dikshankData.data || [])
      .filter(v => v.Lattitude && v.Longitude)
      .map(v => {
        const isTricycle = v.vehicleType?.toLowerCase().includes('trycycle');
        const iconUrl = isTricycle ? TRICYCLE_ICON_URL : (TATA_VEHICLE_ICONS[v.vehicle_status] || TATA_VEHICLE_ICONS.Default);
        
        return {
          id: `${v.vehicleId}`,
          position: [parseFloat(v.Lattitude), parseFloat(v.Longitude)],
          iconUrl: iconUrl,
          title: v.vehicleNumber,
          status: v.vehicle_status,
          details: { 
            'Vehicle Type': v.vehicleType, 
            'Last Update': v.LocationTime, 
            Speed: `${v.Speed} km/h`, 
            Direction: v.Direction, 
            Ignition: v.ignition === "00" ? "Off" : "On" 
          }
        };
      });

    console.log('🚛 Dikshank normalized vehicles:', normalized.length);
    res.json({ 
      vehicles: normalized,
      source: 'dikshank',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dikshank API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Dikshank vehicles data',
      message: error.message,
      source: 'dikshank'
    });
  }
});

export default router;
