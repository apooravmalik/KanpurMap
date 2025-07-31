/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as EsriLeaflet from 'esri-leaflet';
import { fetchTpappsData } from '../utils/tpappsAPI';
import { fetchDikshankData } from '../utils/dikshankAPI';
import { config } from '../config/config.js';

// Layer definitions
const LAYER_DEFINITIONS = [
  { id: 0, name: 'ATCS' },
  { id: 1, name: 'CCTV' },
  { id: 2, name: 'EMS' },
  { id: 3, name: 'ITMS' },
  { id: 4, name: 'PA_ECB' },
  { id: 5, name: 'SMART_PARKING' },
  { id: 6, name: 'VMSB' },
  { id: 7, name: 'WIFI' },
  { id: 8, name: 'Airports' },
  { id: 9, name: 'Ambulance Services' },
  { id: 10, name: 'Apartments' },
  { id: 11, name: 'ATMs' },
  { id: 12, name: 'Auditoriums' },
  { id: 13, name: 'Banks' },
  { id: 14, name: 'Blood Banks' },
  { id: 15, name: 'Burial Grounds' },
  { id: 16, name: 'Bus Depots' },
  { id: 17, name: 'Bus Stops' },
  { id: 18, name: 'Commercial Complexes' },
  { id: 19, name: 'Community Centres' },
  { id: 20, name: 'Diagnostics Centre' },
  { id: 21, name: 'Educational Facilities' },
  { id: 22, name: 'Fire Stations' },
  { id: 23, name: 'Govt Buildings' },
  { id: 24, name: 'High School' },
  { id: 25, name: 'Hospitals' },
  { id: 26, name: 'Housing Societies' },
  { id: 27, name: 'Landmark' },
  { id: 28, name: 'Other Medical Services' },
  { id: 29, name: 'Parking Areas' },
  { id: 30, name: 'Permanent Commercial Markets' },
  { id: 31, name: 'Petrol Pumps' },
  { id: 32, name: 'Police Stations' },
  { id: 33, name: 'Post Offices' },
  { id: 34, name: 'Primary School' },
  { id: 35, name: 'Railway Stations' },
  { id: 36, name: 'Religious Places' },
  { id: 37, name: 'Restaurant' },
  { id: 38, name: 'Road Junction' },
  { id: 39, name: 'Secondary School' },
  { id: 40, name: 'Shopping Malls' },
  { id: 41, name: 'Solid Waste Locations' },
  { id: 42, name: 'Theaters' },
  { id: 43, name: 'Travel And Tourism Facilities' },
  { id: 44, name: 'Water' },
  { id: 45, name: 'PublicToilets' },
  { id: 46, name: 'Drain' },
  { id: 47, name: 'Railway Network' },
  { id: 48, name: 'Road Network' },
  { id: 49, name: 'Locality' },
  { id: 50, name: 'Building Footprint' },
  { id: 51, name: 'Green Areas' },
  { id: 52, name: 'Open Areas' },
  { id: 53, name: 'Water Bodies' },
  { id: 54, name: 'Ward Boundary' },
  { id: 55, name: 'Zone Boundary' },
  { id: 56, name: 'Pincode' },
  { id: 57, name: 'Kanpur City Boundary' },
  { id: 58, name: 'COVID 19' },
  { id: 59, name: 'PWD Roads' },
  { id: 60, name: 'Shelter Home' },
  { id: 61, name: 'PlotBoundary' },
  { id: 62, name: 'Trinetra_CCTV' }
];

// --- CHILD COMPONENTS (No changes here) ---
const ArcGISLayerGroup = ({ url, layersToShow, options }) => {
  const map = useMap();
  useEffect(() => {
    let esriLayer;
    if (map && layersToShow && layersToShow.length > 0) {
      esriLayer = EsriLeaflet.dynamicMapLayer({ url, layers: layersToShow, ...options }).addTo(map);
      const handleMapClick = (e) => {
        esriLayer.identify().at(e.latlng).layers('visible:' + layersToShow.join(',')).run((error, featureCollection) => {
          if (error || !featureCollection.features.length) return;
          const feature = featureCollection.features[0];
          const popupContent = `<strong>${feature.properties.Layer}:</strong> ${feature.properties[feature.layer.displayField] || 'N/A'}`;
          L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
        });
      };
      map.on('click', handleMapClick);
      return () => { map.off('click', handleMapClick); if (map.hasLayer(esriLayer)) { map.removeLayer(esriLayer); } };
    }
  }, [map, url, layersToShow, options]);
  return null;
};

const VehicleMarkers = ({ vehicles }) => (
  <>
    {vehicles.map((vehicle) => {
      const rotation = vehicle.details.Direction || 0;
      const customIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            transform: rotate(${rotation}deg);
            transform-origin: center;
            background-image: url('${vehicle.iconUrl}');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
          "></div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
      return (
        <Marker key={vehicle.id} position={vehicle.position} icon={customIcon}>
          <Popup className="vehicle-popup">
            <div className="p-2 min-w-64">
              <h3 className="font-bold text-lg mb-2">{vehicle.title}</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(vehicle.details).map(([key, value]) => <p key={key}><strong>{key}:</strong> {value}</p>)}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    })}
  </>
);

// --- UPDATED: Enhanced error handling for Tpapps component ---
const TpappsVehicleLayer = ({ onDataLoad, onError, isEnabled }) => {
  const [vehicles, setVehicles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setVehicles([]);
      setIsInitialized(true);
      setHasError(false);
      onDataLoad({ source: 'tpapps', count: 0, status: 'disabled' });
      return;
    }

    let intervalId;
    let isMounted = true;

    const fetchData = async () => {
      try {
        const normalizedData = await fetchTpappsData();
        
        if (isMounted) {
          setVehicles(normalizedData);
          setHasError(false);
          setIsInitialized(true);
          onDataLoad({ source: 'tpapps', count: normalizedData.length, status: 'success' });
        }
      } catch (err) {
        console.error('Tpapps API Error:', err);
        
        if (isMounted) {
          setHasError(true);
          setIsInitialized(true);
          onError(`Tpapps API: ${err.message}`);
          onDataLoad({ source: 'tpapps', count: 0, status: 'error' });
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval only if component is still mounted
    if (isMounted) {
      intervalId = setInterval(() => {
        if (isMounted) {
          fetchData();
        }
      }, 30000);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isEnabled]); // Add isEnabled to dependencies

  // Always render the component once initialized, but only show markers if enabled and no error
  return isInitialized ? (
    (isEnabled && !hasError) ? <VehicleMarkers vehicles={vehicles} /> : null
  ) : null;
};

// --- Dikshank component (Proxy server call) ---
const DikshankVehicleLayer = ({ onDataLoad, onError, isEnabled }) => {
  const [vehicles, setVehicles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setVehicles([]);
      setIsInitialized(true);
      setHasError(false);
      onDataLoad({ source: 'dikshank', count: 0, status: 'disabled' });
      return;
    }

    let intervalId;
    let isMounted = true;

    const fetchData = async () => {
      try {
        console.log('🚛 Fetching Dikshank data (via proxy)...');
        const normalizedData = await fetchDikshankData();
        
        if (isMounted) {
          console.log('✅ Dikshank data received:', normalizedData.length, 'vehicles');
          setVehicles(normalizedData);
          setHasError(false);
          setIsInitialized(true);
          onDataLoad({ source: 'dikshank', count: normalizedData.length, status: 'success' });
        }
      } catch (err) {
        console.error('❌ Dikshank API Error:', err);
        
        if (isMounted) {
          setHasError(true);
          setIsInitialized(true);
          
          // Handle different types of errors
          let errorMessage = err.message;
          if (err.message.toLowerCase().includes('backend api failed')) {
            errorMessage = 'Backend proxy server error - Check if backend is running';
          } else if (err.message.toLowerCase().includes('network')) {
            errorMessage = 'Network error - Backend server unreachable';
          } else if (err.message.toLowerCase().includes('fetch')) {
            errorMessage = 'Fetch error - Check backend server status';
          }
          
          onError(`Dikshank API (Proxy): ${errorMessage}`);
          onDataLoad({ source: 'dikshank', count: 0, status: 'error' });
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval for periodic updates
    if (isMounted) {
      intervalId = setInterval(() => {
        if (isMounted) {
          fetchData();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onDataLoad, onError, isEnabled]); // Add isEnabled to dependencies

  return isInitialized ? (
    (isEnabled && !hasError) ? <VehicleMarkers vehicles={vehicles} /> : null
  ) : null;
};

// Layer Control Component
const LayerControl = ({ selectedLayers, onLayerChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLayerToggle = (layerId) => {
    const newLayers = selectedLayers.includes(layerId)
      ? selectedLayers.filter(id => id !== layerId)
      : [...selectedLayers, layerId];
    onLayerChange(newLayers);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border text-black border-gray-300 rounded px-3 py-2 text-sm shadow-sm hover:bg-gray-50 flex items-center gap-2"
        style={{ zIndex: 390 }}
      >
        <span>Layers ({selectedLayers.length})</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-80 overflow-y-auto min-w-64"
          style={{ zIndex: 401 }}
        >
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={() => onLayerChange([])}
              className="text-xs text-red-600 hover:text-red-800 mr-4"
            >
              Clear All
            </button>
            <button
              onClick={() => onLayerChange([55, 57])}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Default (Zone + City Boundary)
            </button>
          </div>
          
          {LAYER_DEFINITIONS.map((layer) => (
            <label
              key={layer.id}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => handleLayerToggle(layer.id)}
                className="mr-2"
              />
              <span className="text-xs text-gray-500 mr-2 w-8">{layer.id}</span>
              <span className="flex-1 text-gray-500">{layer.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// API Control Component
const ApiControl = ({ apiStates, onApiToggle }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onApiToggle('tpapps')}
        className={`px-3 py-2 text-sm rounded border ${
          apiStates.tpapps 
            ? 'bg-green-100 border-green-300 text-green-700' 
            : 'bg-red-100 border-red-300 text-red-700'
        }`}
        style={{ zIndex: 390 }}
      >
        Tpapps API {apiStates.tpapps ? 'ON' : 'OFF'}
      </button>
      
      <button
        onClick={() => onApiToggle('dikshank')}
        className={`px-3 py-2 text-sm rounded border ${
          apiStates.dikshank 
            ? 'bg-green-100 border-green-300 text-green-700' 
            : 'bg-red-100 border-red-300 text-red-700'
        }`}
        style={{ zIndex: 390 }}
      >
        Dikshank API {apiStates.dikshank ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};

// --- UPDATED: Main Kanpur Map component with layer controls and API toggles ---
export default function KanpurMap() {
  const { layers: layersFromParams } = useParams();
  const navigate = useNavigate();
  const kanpurPosition = [26.4499, 80.3319];
  
  const kanpurServiceUrl = config.arcGisServiceUrl;

  const [layers, setLayers] = useState([]);
  const [apiStatus, setApiStatus] = useState({}); // Track status of each API
  const [errors, setErrors] = useState([]);
  const [apiStates, setApiStates] = useState({
    tpapps: true,
    dikshank: true
  });

  useEffect(() => {
    console.log('Configuration loaded:', config);

    const layersToShow = layersFromParams ? layersFromParams.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];
    setLayers(layersToShow.length > 0 ? layersToShow : [55, 57]);
  }, [layersFromParams]);

  const handleLayerChange = (newLayers) => {
    setLayers(newLayers);
    const layersParam = newLayers.length > 0 ? newLayers.join(',') : '55,57';
    navigate(`/${layersParam}`, { replace: true });
  };

  const handleApiToggle = (apiName) => {
    setApiStates(prev => ({
      ...prev,
      [apiName]: !prev[apiName]
    }));
  };

  const handleDataLoad = useCallback((data) => {
    setApiStatus(prev => ({
      ...prev,
      [data.source]: {
        count: data.count,
        status: data.status,
        lastUpdated: new Date().toLocaleTimeString()
      }
    }));
  }, []);

  const handleError = useCallback((errorMsg) => {
    // Keep only the latest error for each API to avoid spam
    setErrors(prev => {
      const apiName = errorMsg.split(':')[0];
      const filteredErrors = prev.filter(e => !e.startsWith(apiName));
      return [...filteredErrors, errorMsg];
    });
  }, []);
  
  // Calculate total vehicles only from successful APIs
  const totalVehicles = Object.values(apiStatus)
    .filter(status => status.status === 'success')
    .reduce((sum, status) => sum + status.count, 0);

  const successfulApis = Object.entries(apiStatus)
    .filter(([_, status]) => status.status === 'success')
    .map(([source, _]) => source);

  const failedApis = Object.entries(apiStatus)
    .filter(([_, status]) => status.status === 'error')
    .map(([source, _]) => source);

  const disabledApis = Object.entries(apiStatus)
    .filter(([_, status]) => status.status === 'disabled')
    .map(([source, _]) => source);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-700 text-white p-4 shadow-md" style={{ zIndex: 4000 }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold">Kanpur City Map - Vehicle Tracking</h1>
            <p className="text-sm">
              Displaying layers: {layers.length > 0 ? layers.map(id => {
                const layer = LAYER_DEFINITIONS.find(l => l.id === id);
                return layer ? `${layer.name} (${id})` : id;
              }).join(', ') : 'None'}
            </p>
            {successfulApis.length > 0 && (
              <p className="text-xs text-green-200">
                Active APIs: {successfulApis.join(', ')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm">{totalVehicles} total vehicles</p>
            {failedApis.length > 0 && (
              <p className="text-xs text-yellow-200">
                {failedApis.length} API(s) unavailable
              </p>
            )}
            {disabledApis.length > 0 && (
              <p className="text-xs text-gray-300">
                {disabledApis.length} API(s) disabled
              </p>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex gap-4 items-center">
          <LayerControl selectedLayers={layers} onLayerChange={handleLayerChange} />
          <ApiControl apiStates={apiStates} onApiToggle={handleApiToggle} />
        </div>
        
        {errors.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-400 text-black rounded text-sm">
            <div className="font-medium mb-1">API Status:</div>
            {errors.map((error, i) => (
              <p key={i} className="text-xs">
                ⚠️ {error}
              </p>
            ))}
            <p className="text-xs mt-1 font-medium">
              ✅ Map continues to show data from working APIs
            </p>
          </div>
        )}
      </div>
      
      <div className="flex-1 relative">
        <MapContainer center={kanpurPosition} zoom={12} className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors & Esri' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {layers.length > 0 && <ArcGISLayerGroup url={kanpurServiceUrl} layersToShow={layers} options={{ opacity: 0.8 }} />}
          
          {/* These components will now handle their own errors gracefully and can be toggled */}
          <TpappsVehicleLayer onDataLoad={handleDataLoad} onError={handleError} isEnabled={apiStates.tpapps} />
          <DikshankVehicleLayer onDataLoad={handleDataLoad} onError={handleError} isEnabled={apiStates.dikshank} />

        </MapContainer>
      </div>
    </div>
  );
}