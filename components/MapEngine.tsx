import React, { useEffect, useRef, useState } from 'react';
import { Coordinates, Vehicle, Student } from '../types';
import mapboxgl from 'mapbox-gl';
import { createRoot } from 'react-dom/client';
import { Bus, MapPin, School } from 'lucide-react';
import { GeolocationData } from '../hooks/useGeolocation';
import { getMapboxRoute, MapboxRoute } from '../services/mapboxDirectionsService';

interface MapEngineProps {
  vehicles: Vehicle[];
  students?: Student[];
  userLocation?: Coordinates | GeolocationData;
  showRoutes?: boolean;
  highlightVehicleId?: string;
  onVehicleClick?: (vehicle: Vehicle) => void;
  className?: string;
  navigationMode?: boolean; // Waze-style navigation mode
  currentRoute?: Coordinates[]; // Current route for navigation (fallback)
  followDriver?: boolean; // Follow driver GPS in real-time
  useMapboxDirections?: boolean; // Use Mapbox Directions API for real routes
  schoolLocation?: Coordinates; // School destination for route calculation
  mapboxRoute?: MapboxRoute | null; // Pre-calculated Mapbox route (Uber style)
}

// Custom Marker Component helpers
const VehicleMarker = ({ type, color }: { type: string, color: string }) => (
  <div className={`p-2 rounded-full shadow-lg border-2 border-white transform transition-transform hover:scale-110 ${color}`}>
    <Bus size={16} className="text-white" fill="currentColor" />
  </div>
);

const StudentMarker = ({ status }: { status: string }) => (
  <div className={`flex justify-center transition-opacity ${status !== 'WAITING' ? 'opacity-40' : 'opacity-100'}`}>
    <MapPin size={24} className="text-orange-500 fill-orange-100 drop-shadow-md" />
  </div>
);

const SchoolMarker = () => (
  <div className="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white">
    <School size={20} className="text-white" />
  </div>
);

const MapEngine: React.FC<MapEngineProps> = ({
  vehicles = [],
  students = [],
  userLocation,
  showRoutes = false,
  highlightVehicleId,
  onVehicleClick,
  className = "",
  navigationMode = false,
  currentRoute = [],
  followDriver = false,
  useMapboxDirections = false,
  schoolLocation,
  mapboxRoute: externalMapboxRoute
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const rootsRef = useRef<Map<string, any>>(new Map());
  const [mapboxRoute, setMapboxRoute] = useState<MapboxRoute | null>(null);
  const routeSourceId = 'mapbox-route';
  
  // Use external route if provided, otherwise use internal state
  const activeRoute = externalMapboxRoute !== undefined ? externalMapboxRoute : mapboxRoute;

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl || !mapboxgl.Map) {
      console.error("Mapbox GL JS is not loaded correctly.");
      return;
    }

    try {
      mapboxgl.accessToken = 'pk.eyJ1IjoiamVzc2VmcmVpIiwiYSI6ImNtZ3B3ZWx6NzJjNmYyanExY2t3emk4M2IifQ.fbnPMTAQOmTK2-5XqOn-RA';

      // Explicitly disable telemetry and set config to avoid frame access issues
      try {
        const mbx = mapboxgl as any;
        if (mbx.config) {
          mbx.config.TELEMETRY = false;
        }
      } catch (e) {}

      // Use userLocation if available, otherwise default to São Paulo
      const initialCenter = userLocation 
        ? [userLocation.lng, userLocation.lat] 
        : [-46.6565, -23.5614];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter as [number, number],
        zoom: navigationMode ? 16 : (userLocation ? 15 : 13),
        pitch: navigationMode ? 60 : 45,
        bearing: 0,
        attributionControl: false,
        collectResourceTiming: false, // CRITICAL: Fix for Location.href error
        crossSourceCollisions: false,  // CRITICAL: Fix for cross-origin frame access
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true,
        transformRequest: (url) => {
          // Ensure no checks against window.location.href are performed for internal requests
          return { url };
        }
      });

      // If userLocation becomes available after map initialization, center on it
      if (userLocation && map.current) {
        map.current.once('load', () => {
          map.current?.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 15,
            duration: 1500
          });
        });
      }

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // Add School Marker
      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(<SchoolMarker />);
      new mapboxgl.Marker(el)
        .setLngLat([-46.6333, -23.5505])
        .addTo(map.current);
        
      map.current.on('error', (e) => {
        // Suppress frame-access errors in console
        if (e.error?.message?.includes('Location') || e.error?.message?.includes('href') || e.error?.message?.includes('blocked')) {
          return;
        }
        console.warn('Mapbox non-critical error:', e);
      });

    } catch (e) {
      console.error("Critical error initializing Mapbox:", e);
    }

    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (e) {}
        map.current = null;
      }
    };
  }, []);

  // Update Markers & Routes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      // 1. Vehicle Markers
      vehicles.forEach(vehicle => {
        if (!vehicle || !vehicle.location || typeof vehicle.location.lat !== 'number' || typeof vehicle.location.lng !== 'number') {
            return;
        }

        let marker = markersRef.current.get(vehicle.id);
        if (!marker) {
          const el = document.createElement('div');
          el.className = 'vehicle-marker';
          el.onclick = () => onVehicleClick && onVehicleClick(vehicle);
          
          const root = createRoot(el);
          const isHighlighted = highlightVehicleId === vehicle.id;
          const color = isHighlighted ? 'bg-black' : vehicle.status === 'DELAYED' ? 'bg-red-500' : 'bg-green-500';
          
          root.render(<VehicleMarker type={vehicle.type} color={color} />);
          rootsRef.current.set(vehicle.id, root);

          marker = new mapboxgl.Marker(el)
            .setLngLat([vehicle.location.lng, vehicle.location.lat])
            .addTo(map.current!);
          markersRef.current.set(vehicle.id, marker);
        } else {
          marker.setLngLat([vehicle.location.lng, vehicle.location.lat]);
          const root = rootsRef.current.get(vehicle.id);
          if (root) {
              const isHighlighted = highlightVehicleId === vehicle.id;
              const color = isHighlighted ? 'bg-black' : vehicle.status === 'DELAYED' ? 'bg-red-500' : 'bg-green-500';
              root.render(<VehicleMarker type={vehicle.type} color={color} />);
          }
        }
      });

      // 2. Student Markers
      students.forEach(student => {
        if (!student || !student.location || typeof student.location.lat !== 'number' || typeof student.location.lng !== 'number') return;

        if (!markersRef.current.has(student.id)) {
          const el = document.createElement('div');
          const root = createRoot(el);
          root.render(<StudentMarker status={student.status} />);
          rootsRef.current.set(student.id, root);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([student.location.lng, student.location.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`${student.name} - ${student.address}`))
            .addTo(map.current!);
          
          markersRef.current.set(student.id, marker);
        } else {
          const marker = markersRef.current.get(student.id);
          if (marker) {
              marker.setLngLat([student.location.lng, student.location.lat]);
              const root = rootsRef.current.get(student.id);
              if (root) {
                  root.render(<StudentMarker status={student.status} />);
              }
          }
        }
      });

      // 3. Routes - Use Mapbox Directions API if enabled, otherwise use fallback
      if (showRoutes && !useMapboxDirections) {
         vehicles.forEach(vehicle => {
            // Use currentRoute if provided, otherwise use vehicle.route
            const routeToUse = highlightVehicleId === vehicle.id && currentRoute.length > 0 ? currentRoute : vehicle.route;
            if (!routeToUse || !Array.isArray(routeToUse) || routeToUse.length < 2) return;
            const sourceId = `route-${vehicle.id}`;
            const coordinates = routeToUse
                .filter(pt => pt && typeof pt.lat === 'number' && typeof pt.lng === 'number')
                .map(pt => [pt.lng, pt.lat]);

            if (map.current?.getSource(sourceId)) {
               (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString', coordinates }
               });
            } else if (map.current?.isStyleLoaded()) {
               map.current.addSource(sourceId, {
                  type: 'geojson',
                  data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
               });
               map.current.addLayer({
                  id: sourceId,
                  type: 'line',
                  source: sourceId,
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: {
                    'line-color': highlightVehicleId === vehicle.id ? (navigationMode ? '#C3A758' : '#1F4E8C') : '#3A3A3A',
                    'line-width': highlightVehicleId === vehicle.id ? (navigationMode ? 6 : 4) : 2,
                    'line-dasharray': highlightVehicleId === vehicle.id ? [] : [2, 1],
                    'line-opacity': highlightVehicleId === vehicle.id ? 0.9 : 0.5
                  }
               });
               
               // Add route outline for better visibility (Waze style)
               if (highlightVehicleId === vehicle.id && navigationMode) {
                 map.current.addLayer({
                   id: `${sourceId}-outline`,
                   type: 'line',
                   source: sourceId,
                   layout: { 'line-join': 'round', 'line-cap': 'round' },
                   paint: {
                     'line-color': '#010A13',
                     'line-width': 8,
                     'line-opacity': 0.3
                   }
                 }, sourceId);
               }
            }
         });
      }
    } catch (e) {}
  }, [vehicles, students, highlightVehicleId, showRoutes, navigationMode, currentRoute, useMapboxDirections]);

  // Fetch Mapbox Directions API route (only if external route not provided)
  useEffect(() => {
    if (externalMapboxRoute !== undefined) return; // Use external route
    
    if (!useMapboxDirections || !showRoutes || !map.current || !map.current.isStyleLoaded()) return;
    
    const mainVehicle = vehicles.find(v => v.id === highlightVehicleId);
    if (!mainVehicle || !schoolLocation) return;

    // Get waiting students locations
    const waitingStudents = students?.filter(s => s.status === 'WAITING') || [];
    
    // Only fetch if we have students or a fallback route
    if (waitingStudents.length === 0) {
      // If no waiting students, clear the route
      setMapboxRoute(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        // Use sorted students locations (already sorted by distance)
        const studentLocations = waitingStudents.map(s => s.location);
        
        const route = await getMapboxRoute(
          mainVehicle.location,
          studentLocations,
          schoolLocation
        );

        if (route) {
          setMapboxRoute(route);
        } else {
          // Fallback to currentRoute if Mapbox fails
          setMapboxRoute(null);
        }
      } catch (error) {
        console.error('Error fetching Mapbox route:', error);
        // Fallback to currentRoute on error
        setMapboxRoute(null);
      }
    };

    // Debounce route fetching to avoid too many API calls
    const timeoutId = setTimeout(fetchRoute, 500);
    return () => clearTimeout(timeoutId);
  }, [useMapboxDirections, showRoutes, vehicles, students, highlightVehicleId, schoolLocation, externalMapboxRoute]);

  // Draw Mapbox route on map
  useEffect(() => {
    if (!activeRoute || !map.current || !map.current.isStyleLoaded()) return;

    try {
      const routeData = {
        type: 'Feature' as const,
        geometry: activeRoute.geometry
      };

      // Remove existing route if present
      if (map.current.getLayer(routeSourceId)) {
        map.current.removeLayer(routeSourceId);
      }
      if (map.current.getLayer(`${routeSourceId}-outline`)) {
        map.current.removeLayer(`${routeSourceId}-outline`);
      }
      if (map.current.getSource(routeSourceId)) {
        map.current.removeSource(routeSourceId);
      }

      // Add route source
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: routeData
      });

      // Add route outline (for better visibility)
      if (navigationMode) {
        map.current.addLayer({
          id: `${routeSourceId}-outline`,
          type: 'line',
          source: routeSourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#010A13',
            'line-width': 8,
            'line-opacity': 0.3
          }
        });
      }

      // Add route layer
      map.current.addLayer({
        id: routeSourceId,
        type: 'line',
        source: routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-width': navigationMode ? 6 : 4,
          'line-color': navigationMode ? '#C3A758' : '#1F4E8C',
          'line-opacity': 0.9
        }
      });
    } catch (error) {
      console.error('Error drawing Mapbox route:', error);
    }
  }, [activeRoute, navigationMode]);

  // Real-time GPS following: Watch driver position and update camera dynamically
  useEffect(() => {
    if (followDriver && navigationMode && map.current && map.current.isStyleLoaded() && userLocation) {
      // Get heading from GPS data (if available)
      const heading = (userLocation as GeolocationData).heading;
      
      // Calculate bearing: use GPS heading if available, otherwise calculate from route
      let bearing = heading !== undefined && heading !== null ? heading : 0;
      
      if (bearing === 0 && currentRoute && currentRoute.length >= 2) {
        // Fallback: calculate bearing from route if GPS heading not available
        const currentIdx = currentRoute.findIndex(
          pt => Math.abs(pt.lat - userLocation.lat) < 0.0001 && Math.abs(pt.lng - userLocation.lng) < 0.0001
        );
        if (currentIdx >= 0 && currentIdx < currentRoute.length - 1) {
          const next = currentRoute[currentIdx + 1];
          const dx = next.lng - userLocation.lng;
          const dy = next.lat - userLocation.lat;
          bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
        }
      }

      // Dynamic camera follow with smooth transitions (Waze-style)
      try {
        map.current.easeTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 16, // Fixed zoom for navigation
          bearing: bearing || 0,
          pitch: 60,
          duration: 1000,
          essential: true
        });
      } catch(e) {
        console.error('Error updating camera:', e);
      }
    }
  }, [userLocation, navigationMode, followDriver, currentRoute]);

  // Navigation mode: Follow vehicle and update camera (fallback for non-GPS mode)
  useEffect(() => {
    if (!followDriver && navigationMode && highlightVehicleId && map.current) {
      const v = vehicles?.find(v => v.id === highlightVehicleId);
      if (v?.location && typeof v.location.lat === 'number') {
        try {
          // Calculate bearing (direction) if we have a route
          let bearing = 0;
          if (currentRoute && currentRoute.length >= 2) {
            const currentIdx = currentRoute.findIndex(
              pt => Math.abs(pt.lat - v.location.lat) < 0.0001 && Math.abs(pt.lng - v.location.lng) < 0.0001
            );
            if (currentIdx >= 0 && currentIdx < currentRoute.length - 1) {
              const next = currentRoute[currentIdx + 1];
              const dx = next.lng - v.location.lng;
              const dy = next.lat - v.location.lat;
              bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
            }
          }

          // Smooth camera follow in navigation mode
          map.current.easeTo({
            center: [v.location.lng, v.location.lat],
            zoom: 17,
            pitch: 60,
            bearing: bearing,
            duration: 1000,
            essential: true
          });
        } catch(e) {}
      }
    } else if (!followDriver && highlightVehicleId && map.current) {
      // Normal mode: just center on vehicle
      const v = vehicles?.find(v => v.id === highlightVehicleId);
      if (v?.location && typeof v.location.lat === 'number') {
        try {
          map.current.flyTo({ center: [v.location.lng, v.location.lat], zoom: 15 });
        } catch(e) {}
      }
    }
  }, [highlightVehicleId, vehicles, navigationMode, currentRoute, followDriver]);

  // Center map on user location when available
  useEffect(() => {
    if (userLocation && map.current && map.current.isStyleLoaded()) {
      try {
        map.current.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 15,
          duration: 1500
        });
      } catch(e) {}
    }
  }, [userLocation]);

  return (
    <div className={`relative bg-[#010A13] overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapEngine;