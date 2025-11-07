console.log('Vite Environment Variables:', import.meta.env);

export const config = {
  // Base URL for your proxy server
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // Direct URL for the ArcGIS Map Service (bypasses proxy)
  arcGisServiceUrl: import.meta.env.VITE_ARCGIS_SERVICE_URL,
  
  // Toggle between direct and proxy mode for MapServer
  // Set to 'direct' to use arcGisServiceUrl directly
  // Set to 'proxy' to use the backend proxy
  mapServerMode: import.meta.env.VITE_MAPSERVER_MODE || 'direct',

  // URL for the tpapps API
  tpappsApiUrl: import.meta.env.VITE_TPAPPS_PROXY_API_URL,

  // URL for the dikshank API
  dikshankApiUrl: import.meta.env.VITE_DIKSHANK_PROXY_API_URL,
};