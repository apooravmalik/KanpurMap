import { config } from '../config/config';

export const fetchDikshankData = async () => {
  try {
    // Use the backend proxy URL for Dikshank API
    const response = await fetch(config.dikshankApiUrl);

    if (!response.ok) {
      throw new Error(`Backend API failed: HTTP status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Dikshank data from backend:", data);
    
    // Data is already normalized by the backend proxy
    return data.vehicles || [];
    
  } catch (err) {
    console.error("Error in fetchDikshankData:", err);
    throw err;
  }
};
