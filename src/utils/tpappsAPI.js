import { config } from '../config/config';

export const fetchTpappsData = async () => {
  try {
    // Use the URL from the config file
    const response = await fetch(config.tpappsApiUrl);
    
    if (!response.ok) {
      throw new Error(`tpapps API failed: HTTP status ${response.status}`);
    }
    
    const tpappsData = await response.json();

    console.log("Raw tpappsData:", tpappsData);
    
    // Check the actual structure of the response
    const vehiclesArray = tpappsData.vehicles || tpappsData.data || [];
    console.log("Vehicles array:", vehiclesArray);
    
    // Normalize the data into a consistent format
    const normalized = vehiclesArray
      .filter(v => {
        const hasCoords = v.lat && v.lng;
        const hasIcon = v.equipmentIcon;
        if (!hasCoords) console.log("Missing coordinates for vehicle:", v.deviceId || v.imei);
        if (!hasIcon) console.log("Missing icon for vehicle:", v.deviceId || v.imei);
        return hasCoords && hasIcon;
      })
      .map(v => ({
        id: `tpapps-${v.imei}`,
        position: [parseFloat(v.lat), parseFloat(v.lng)],
        iconUrl: v.equipmentIcon,
        title: v.deviceId,
        details: { 
          Status: v.status, 
          Equipment: v.equipmentTypeL, 
          Speed: `${v.speed} km/h`, 
          Ignition: v.ignitionStatus, 
          Battery: `${v.batteryPercent}%`, 
          Address: v.address || 'N/A', 
          'Last Update': new Date(parseInt(v.validPacketTimeStamp) * 1000).toLocaleString() 
        },
      }));
    
    console.log("Normalized vehicles:", normalized);
    return normalized;
    
  } catch (err) {
    console.error("Error in fetchTpappsData:", err);
    // Re-throw the error to be handled by the component
    throw err;
  }
};
