import { config } from '../config/config';

// Status normalization mapping for Tpapps
const normalizeStatus = (status) => {
  if (!status) return 'Unknown';
  
  const statusLower = status.toLowerCase();
  
  // Normalize to standard categories
  if (statusLower === 'running') return 'Running';
  if (statusLower === 'idle') return 'Idle';
  if (statusLower === 'stop') return 'Stop';
  if (statusLower === 'waiting') return 'Waiting';
  if (statusLower === 'inactive' || statusLower === 'in-active') return 'Inactive';
  
  // Return original status if no mapping found
  return status;
};

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
      .map(v => {
        const normalizedStatus = normalizeStatus(v.status);
        
        return {
          id: `tpapps-${v.imei}`,
          position: [parseFloat(v.lat), parseFloat(v.lng)],
          iconUrl: v.equipmentIcon,
          title: v.deviceId,
          status: normalizedStatus, // Add normalized status to main object
          details: { 
            Status: normalizedStatus, // Also keep in details for popup
            Equipment: v.equipmentTypeL, 
            Speed: `${v.speed} km/h`, 
            Ignition: v.ignitionStatus, 
            Battery: `${v.batteryPercent}%`, 
            Address: v.address || 'N/A', 
            'Last Update': new Date(parseInt(v.validPacketTimeStamp) * 1000).toLocaleString(),
            Direction: v.heading || 0 // Add direction for consistency
          },
        };
      });
    
    console.log("Normalized vehicles with status:", normalized);
    return normalized;
    
  } catch (err) {
    console.error("Error in fetchTpappsData:", err);
    // Re-throw the error to be handled by the component
    throw err;
  }
};