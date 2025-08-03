import { config } from '../config/config';

// Status normalization mapping for Dikshank
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

export const fetchDikshankData = async () => {
  try {
    // Use the backend proxy URL for Dikshank API
    const response = await fetch(config.dikshankApiUrl);

    if (!response.ok) {
      throw new Error(`Backend API failed: HTTP status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Dikshank data from backend:", data);
    
    // Get vehicles array and normalize status
    const vehiclesArray = data.vehicles || [];
    
    const normalizedVehicles = vehiclesArray.map(v => {
      const normalizedStatus = normalizeStatus(v.status);
      
      return {
        ...v,
        status: normalizedStatus, // Update main status field
        details: {
          ...v.details,
          Status: normalizedStatus, // Also update in details for consistency
        }
      };
    });
    
    console.log("Dikshank vehicles with normalized status:", normalizedVehicles);
    return normalizedVehicles;
    
  } catch (err) {
    console.error("Error in fetchDikshankData:", err);
    throw err;
  }
};