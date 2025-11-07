import { config } from '../config/config.js';

const API_BASE_URL = config.API_BASE_URL || 'http://localhost:3000';

export const mapServerAPI = {
  /**
   * Get ArcGIS service information
   */
  async getServiceInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/arcgis?f=json`);
      if (!response.ok) {
        throw new Error(`Service info request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get service info:', error);
      throw error;
    }
  },

  /**
   * Get layer information
   */
  async getLayerInfo(layerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/arcgis/${layerId}?f=json`);
      if (!response.ok) {
        throw new Error(`Layer info request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Failed to get layer ${layerId} info:`, error);
      throw error;
    }
  },

  /**
   * Get map export/image
   */
  async getMapExport(params = {}) {
    try {
      const defaultParams = {
        f: 'image',
        format: 'png32',
        transparent: true,
        bboxSR: 3857,
        imageSR: 3857,
        size: '512,512'
      };

      const queryParams = { ...defaultParams, ...params };
      const searchParams = new URLSearchParams(queryParams).toString();
      
      const response = await fetch(`${API_BASE_URL}/api/arcgis/export?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Map export request failed: ${response.status}`);
      }
      return response; // Return response object for image handling
    } catch (error) {
      console.error('❌ Failed to export map:', error);
      throw error;
    }
  },

  /**
   * Identify features at a point
   */
  async identify(params = {}) {
    try {
      const defaultParams = {
        f: 'json',
        tolerance: 3,
        returnGeometry: true,
        imageDisplay: '512,512,96',
        mapExtent: '-180,-90,180,90',
        sr: 4326
      };

      const queryParams = { ...defaultParams, ...params };
      const searchParams = new URLSearchParams(queryParams).toString();
      
      const response = await fetch(`${API_BASE_URL}/api/arcgis/identify?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Identify request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to identify features:', error);
      throw error;
    }
  },

  /**
   * Get legend information
   */
  async getLegend() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/arcgis/legend?f=json`);
      if (!response.ok) {
        throw new Error(`Legend request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get legend:', error);
      throw error;
    }
  },

  /**
   * Generic proxy request to any ArcGIS endpoint
   */
  async proxyRequest(endpoint, params = {}) {
    try {
      const searchParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/api/arcgis/${endpoint}${searchParams ? `?${searchParams}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return response; // Return response for binary data
      }
    } catch (error) {
      console.error(`❌ Proxy request to ${endpoint} failed:`, error);
      throw error;
    }
  }
};
