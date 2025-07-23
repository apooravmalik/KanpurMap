console.log('Vite Environment Variables:', import.meta.env);

export const config = {
  // URL for the ArcGIS Map Service
  arcGisServiceUrl: import.meta.env.VITE_ARCGIS_SERVICE_URL,

  // URL for the tpapps API
  tpappsApiUrl: import.meta.env.VITE_TPAPPS_API_URL,

  // URL for the dikshank API
  dikshankApiUrl: import.meta.env.VITE_DIKSHANK_API_URL,
};