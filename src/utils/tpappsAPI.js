import { config } from '../config/config';

// The normalizeStatus function is no longer needed here.
// The backend will handle all normalization.

export const fetchTpappsData = async () => {
  try {
    // Use the proxy URL from the config file
    const response = await fetch(config.tpappsApiUrl);
    
    if (!response.ok) {
      throw new Error(`tpapps API (Proxy) failed: HTTP status ${response.status}`);
    }
    
    const tpappsData = await response.json();

    console.log("Tpapps data from backend:", tpappsData);
    
    // The data is already normalized by the backend
    const vehiclesArray = tpappsData.vehicles || [];
    
    console.log("Normalized tpapps vehicles from proxy:", vehiclesArray);
    return vehiclesArray;
    
  } catch (err) {
    console.error("Error in fetchTpappsData:", err);
    // Re-throw the error to be handled by the component
    throw err;
  }
};