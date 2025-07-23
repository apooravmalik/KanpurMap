/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as EsriLeaflet from 'esri-leaflet';
import { fetchTpappsData } from '../utils/tpappsAPI';
// import { fetchDikshankData } from '../utils/dikshankAPI';
import { config } from '../config/config.js';


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
      const customIcon = L.icon({ iconUrl: vehicle.iconUrl, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });
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
const TpappsVehicleLayer = ({ onDataLoad, onError }) => {
  const [vehicles, setVehicles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
  }, []); // Remove dependencies to prevent re-initialization

  // Always render the component once initialized, but only show markers if no error
  return isInitialized ? (
    !hasError ? <VehicleMarkers vehicles={vehicles} /> : null
  ) : null;
};

// --- UPDATED: Enhanced error handling for Dikshank component ---
// const DikshankVehicleLayer = ({ onDataLoad, onError }) => {
//   const [vehicles, setVehicles] = useState([]);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [hasError, setHasError] = useState(false);

//   useEffect(() => {
//     let intervalId;
//     let isMounted = true;

//     const fetchData = async () => {
//       try {
//         const normalizedData = await fetchDikshankData();
        
//         if (isMounted) {
//           setVehicles(normalizedData);
//           setHasError(false);
//           setIsInitialized(true);
//           onDataLoad({ source: 'dikshank', count: normalizedData.length, status: 'success' });
//         }
//       } catch (err) {
//         console.error('Dikshank API Error:', err);
        
//         if (isMounted) {
//           setHasError(true);
//           setIsInitialized(true);
          
//           // Check if it's a CORS error and provide specific message
//           const errorMessage = err.message.toLowerCase().includes('cors') || 
//                              err.message.toLowerCase().includes('network') ||
//                              err.name === 'TypeError' 
//                              ? 'CORS/Network error - Backend team fixing this'
//                              : err.message;
          
//           onError(`Dikshank API: ${errorMessage}`);
//           onDataLoad({ source: 'dikshank', count: 0, status: 'error' });
//         }
//       }
//     };

//     // Initial fetch
//     fetchData();

//     // Set up interval only if component is still mounted
//     if (isMounted) {
//       intervalId = setInterval(() => {
//         if (isMounted) {
//           fetchData();
//         }
//       }, 30000);
//     }

//     return () => {
//       isMounted = false;
//       if (intervalId) {
//         clearInterval(intervalId);
//       }
//     };
//   }, []); // Remove dependencies to prevent re-initialization

//   // Always render the component once initialized, but only show markers if no error
//   return isInitialized ? (
//     !hasError ? <VehicleMarkers vehicles={vehicles} /> : null
//   ) : null;
// };


// --- UPDATED: Main Kanpur Map component with better error display ---
export default function KanpurMap() {
  const { layers: layersFromParams } = useParams();
  const kanpurPosition = [26.4499, 80.3319];
  
  const kanpurServiceUrl = config.arcGisServiceUrl;

  const [layers, setLayers] = useState([]);
  const [apiStatus, setApiStatus] = useState({}); // Track status of each API
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    console.log('Configuration loaded:', config);

    const layersToShow = layersFromParams ? layersFromParams.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];
    setLayers(layersToShow.length > 0 ? layersToShow : [55, 57]);
  }, [layersFromParams]);

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

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-700 text-white p-4 shadow-md z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Kanpur City Map - Vehicle Tracking</h1>
            <p className="text-sm">Displaying layers: {layers.join(', ')}</p>
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
          </div>
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
          
          {/* These components will now handle their own errors gracefully */}
          <TpappsVehicleLayer onDataLoad={handleDataLoad} onError={handleError} />
          {/* <DikshankVehicleLayer onDataLoad={handleDataLoad} onError={handleError} /> */}

        </MapContainer>
      </div>
    </div>
  );
}