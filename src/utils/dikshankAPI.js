import { config } from '../config/config';

const TATA_VEHICLE_ICONS = {
  Running: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_R.png',
  Waiting: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_W.png',
  Idle: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_S.png',
  'In-Active': 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_I.png',
  Default: 'http://gps.ecocosmogps.in/gpslite/icons/yes_magic_I.png'
};
const TRICYCLE_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';

export const fetchDikshankData = async () => {
  try {
    // Use the URL from the config file
    const response = await fetch(config.dikshankApiUrl);

    if (!response.ok) {
      throw new Error(`dikshank API failed: HTTP status ${response.status}`);
    }
    
    const dikshankData = await response.json();

    // Normalize the data
    const normalized = (dikshankData.data || []).filter(v => v.Lattitude && v.Longitude).map(v => {
      const isTricycle = v.vehicleType?.toLowerCase().includes('trycycle');
      const iconUrl = isTricycle ? TRICYCLE_ICON_URL : (TATA_VEHICLE_ICONS[v.vehicle_status] || TATA_VEHICLE_ICONS.Default);
      return {
        id: `dikshank-${v.vehicleId}`,
        position: [parseFloat(v.Lattitude), parseFloat(v.Longitude)],
        iconUrl: iconUrl,
        title: v.vehicleNumber,
        details: { 
          'Vehicle Type': v.vehicleType, 
          'Last Update': v.LocationTime, 
          Speed: `${v.Speed} km/h`, 
          Direction: v.Direction, 
          Ignition: v.ignition === "00" ? "Off" : "On" 
        }
      };
    });

    return normalized;
  } catch (err) {
    console.error("Error in fetchDikshankData:", err);
    // Re-throw the error
    throw err;
  }
};
