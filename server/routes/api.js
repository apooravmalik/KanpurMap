import express from "express";
import fetch from "node-fetch";
import https from "https";
import config from "../config/config.js";
import { sql, pool } from "../config/database.js";
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Define the path to your frontend's public/icons directory
// This path goes UP one level from /server, then into /public/device_icons
const iconsDir = path.resolve(process.cwd(), '../public/device_icons');
console.log(`Icons directory resolved to: ${iconsDir}`);

// Ensure the icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`Created icon directory at: ${iconsDir}`);
}

// HTTPS agent for handling certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Icon configurations for Dikshank
const TATA_VEHICLE_ICONS = {
  Running: "http://gps.ecocosmogps.in/gpslite/icons/yes_magic_R.png",
  Waiting: "http://gps.ecocosmogps.in/gpslite/icons/yes_magic_W.png",
  Idle: "http://gps.ecocosmogps.in/gpslite/icons/yes_magic_S.png",
  "In-Active": "http://gps.ecocosmogps.in/gpslite/icons/yes_magic_I.png",
  Default: "http://gps.ecocosmogps.in/gpslite/icons/yes_magic_I.png",
};
const TRICYCLE_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";

const normalizeStatus = (status) => {
  if (!status) return "Unknown";

  const statusLower = status.toLowerCase();

  if (statusLower === "running") return "Running";
  if (statusLower === "idle") return "Idle";
  if (statusLower === "stop") return "Stop";
  if (statusLower === "waiting") return "Waiting";
  if (statusLower === "inactive" || statusLower === "in-active")
    return "Inactive";

  return status;
};

router.get("/tpapps/vehicles", async (req, res) => {
  try {
    if (!config.TPAPPS_API_URL) {
      return res.status(500).json({
        error: "Tpapps API URL not configured",
        message: "TPAPPS_API_URL environment variable is missing",
        source: "tpapps",
      });
    }

    console.log("📡 Fetching Tpapps data from:", config.TPAPPS_API_URL);

    const response = await fetch(config.TPAPPS_API_URL, {
      method: "GET",
      agent: httpsAgent, // Use agent just in case
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Tpapps API failed: HTTP status ${response.status}`);
    }

    const tpappsData = await response.json();
    console.log("✅ Tpapps raw data received");

    // --- Normalization logic moved from frontend to backend ---
    const vehiclesArray = tpappsData.vehicles || tpappsData.data || [];

    const normalized = vehiclesArray
      .filter((v) => {
        const hasCoords = v.lat && v.lng;
        const hasIcon = v.equipmentIcon;
        if (!hasCoords)
          console.log(
            "Missing coords for tpapps vehicle:",
            v.deviceId || v.imei
          );
        if (!hasIcon)
          console.log("Missing icon for tpapps vehicle:", v.deviceId || v.imei);
        return hasCoords && hasIcon;
      })
      .map((v) => {
        const normalizedStatus = normalizeStatus(v.status);

        return {
          id: `tpapps-${v.imei}`,
          position: [parseFloat(v.lat), parseFloat(v.lng)],
          iconUrl: v.equipmentIcon,
          title: v.deviceId,
          status: normalizedStatus,
          details: {
            Status: normalizedStatus,
            Equipment: v.equipmentTypeL,
            Speed: `${v.speed} km/h`,
            Ignition: v.ignitionStatus,
            Battery: `${v.batteryPercent}%`,
            Address: v.address || "N/A",
            "Last Update": new Date(
              parseInt(v.validPacketTimeStamp) * 1000
            ).toLocaleString(),
            Direction: v.heading || 0,
          },
        };
      });

    console.log("🚛 Tpapps normalized vehicles:", normalized.length);
    res.json({
      vehicles: normalized,
      source: "tpapps",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Tpapps API Error:", error);
    res.status(500).json({
      error: "Failed to fetch Tpapps vehicles data",
      message: error.message,
      source: "tpapps",
    });
  }
});

// Dikshank API endpoint (keep this)
router.get("/dikshank/vehicles", async (req, res) => {
  try {
    if (!config.DIKSHANK_API_URL) {
      return res.status(500).json({
        error: "Dikshank API URL not configured",
        message: "DIKSHANK_API_URL environment variable is missing",
        source: "dikshank",
      });
    }

    console.log("📡 Fetching Dikshank data from:", config.DIKSHANK_API_URL);

    const response = await fetch(config.DIKSHANK_API_URL, {
      method: "GET",
      agent: httpsAgent,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Dikshank API failed: HTTP status ${response.status}`);
    }

    const dikshankData = await response.json();
    console.log(
      "✅ Dikshank raw data received:",
      dikshankData.data?.length || 0,
      "vehicles"
    );

    // Transform data on backend
    const normalized = (dikshankData.data || [])
      .filter((v) => v.Lattitude && v.Longitude)
      .map((v) => {
        const isTricycle = v.vehicleType?.toLowerCase().includes("trycycle");
        const iconUrl = isTricycle
          ? TRICYCLE_ICON_URL
          : TATA_VEHICLE_ICONS[v.vehicle_status] || TATA_VEHICLE_ICONS.Default;

        return {
          id: `${v.vehicleId}`,
          position: [parseFloat(v.Lattitude), parseFloat(v.Longitude)],
          iconUrl: iconUrl,
          title: v.vehicleNumber,
          status: v.vehicle_status,
          details: {
            "Vehicle Type": v.vehicleType,
            "Last Update": v.LocationTime,
            Speed: `${v.Speed} km/h`,
            Direction: v.Direction,
            Ignition: v.ignition === "00" ? "Off" : "On",
          },
        };
      });

    console.log("🚛 Dikshank normalized vehicles:", normalized.length);
    res.json({
      vehicles: normalized,
      source: "dikshank",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Dikshank API Error:", error);
    res.status(500).json({
      error: "Failed to fetch Dikshank vehicles data",
      message: error.message,
      source: "dikshank",
    });
  }
});

// --- NEW COMBINED DEVICE AND ICON ENDPOINT ---
// This route fetches all devices, joins the icons,
// saves icon files to /public/device_icons if they don't exist,
// and returns the device data with a URL to the static icon.
router.get('/devices', async (req, res) => {
  try {
    const { type } = req.query; // Only filter by type
    const dbName = config.DB_DATABASE;
    
    let conditions = [];
    // This query is now fast because of your new indexes
    let queryString = `
      SELECT 
          d.Device_PRK, 
          d.dvcDeviceType_FRK, 
          d.dvcLongitude_DEC, 
          d.dvcLatitude_DEC,
          d.dvcIcon_FRK,
          m.mpiImage_IMG  -- Get the image data
      FROM 
          [${dbName}].[dbo].Device_TBL d
      LEFT JOIN 
          [${dbName}].[dbo].MapIcon_TBL m ON d.dvcIcon_FRK = m.MapIcon_PRK
    `;

    const request = pool.request();

    // 1. Add Device Type filter (if provided)
    if (type) {
      conditions.push(`d.dvcDeviceType_FRK = @deviceType`);
      request.input('deviceType', sql.Int, type);
    }
    
    // Add all conditions
    if (conditions.length > 0) {
      queryString += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    console.log('Executing full device query with icon join...');
    const result = await request.query(queryString);
    
    // Normalize the data
    const normalizedDevices = result.recordset
      .filter(device => device.dvcLatitude_DEC && device.dvcLongitude_DEC)
      .map(device => {
        
        const iconKey = device.dvcIcon_FRK;
        const imageData = device.mpiImage_IMG;
        let iconUrl = null; // Default

        if (iconKey && imageData) {
          // e.g., "58.png"
          const iconFileName = `${iconKey}.png`; 
          // e.g., "C:\Work\...\public\device_icons\58.png"
          const iconFilePath = path.join(iconsDir, iconFileName);
          // e.g., "/device_icons/58.png" (This is what the frontend will use)
          iconUrl = `/device_icons/${iconFileName}`;

          // Check if the file already exists. If not, create it.
          if (!fs.existsSync(iconFilePath)) {
            try {
              const imageBuffer = Buffer.from(imageData);
              fs.writeFileSync(iconFilePath, imageBuffer);
              console.log(`✅ Created icon: ${iconFileName}`);
            } catch (writeErr) {
              console.error(`❌ Failed to write icon file ${iconFileName}:`, writeErr);
              iconUrl = null; // Don't use if write failed
            }
          }
        }

        return {
          id: `device-${device.Device_PRK}`,
          position: [parseFloat(device.dvcLatitude_DEC), parseFloat(device.dvcLongitude_DEC)],
          iconUrl: iconUrl, // Send the static URL
          deviceType: device.dvcDeviceType_FRK,
          title: `Device ${device.Device_PRK}`,
          details: {
            'Device ID': device.Device_PRK,
            'Device Type': device.dvcDeviceType_FRK,
            'Icon Key': iconKey
          }
        };
      });

    res.json({
      devices: normalizedDevices,
      source: 'mssql-db',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ MSSQL Device Query Error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch devices from database',
      message: err.message,
      source: 'mssql'
    });
  }
});

// ArcGIS Proxy Route - handles dynamic paths after /arcgis/
router.get("/arcgis/*", async (req, res) => {
  try {
    // Extract the dynamic path after '/arcgis/'
    const dynamicPath = req.params[0]; // This captures everything after '/arcgis/'
    const queryString = new URLSearchParams(req.query).toString();

    // Construct the full URL using your environment variable
    const baseUrl = config.MAPSERVER_URL || "";
    const fullUrl = `${baseUrl}${dynamicPath}${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("🗺️ Proxying ArcGIS request to:", fullUrl);

    const response = await fetch(fullUrl, {
      method: req.method,
      agent: httpsAgent, // Reuse your existing HTTPS agent
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Node.js Proxy Server",
      },
    });

    if (!response.ok) {
      throw new Error(`ArcGIS API failed: HTTP status ${response.status}`);
    }

    // Handle different response types (JSON or binary data like images)
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.json(data);
    } else {
      // For image responses or other binary data
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.set("Content-Type", contentType);
      res.send(buffer);
    }
  } catch (error) {
    console.error("❌ ArcGIS API Error:", error);
    res.status(500).json({
      error: "Failed to fetch ArcGIS data",
      message: error.message,
      source: "arcgis",
    });
  }
});

export default router;
