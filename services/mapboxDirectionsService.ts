import { Coordinates } from '../types';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiamVzc2VmcmVpIiwiYSI6ImNtZ3B3ZWx6NzJjNmYyanExY2t3emk4M2IifQ.fbnPMTAQOmTK2-5XqOn-RA';

export interface MapboxRoute {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  distance: number; // in meters
  duration: number; // in seconds
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    distance: number;
    duration: number;
    legs: Array<{
      distance: number;
      duration: number;
      steps: any[];
    }>;
  }>;
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

/**
 * Get optimized route from Mapbox Directions API
 * Creates a single route passing through van, all students, and school
 * 
 * @param vanLocation - Current van location
 * @param students - Array of students to pick up
 * @param schoolLocation - Final destination (school)
 * @returns Promise with route geometry and metadata
 */
export const getMapboxRoute = async (
  vanLocation: Coordinates,
  students: Coordinates[],
  schoolLocation: Coordinates
): Promise<MapboxRoute | null> => {
  try {
    // Build coordinates string: van -> students -> school
    const coordinates = [
      `${vanLocation.lng},${vanLocation.lat}`,
      ...students.map(s => `${s.lng},${s.lat}`),
      `${schoolLocation.lng},${schoolLocation.lat}`
    ].join(';');

    // Call Mapbox Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data: MapboxDirectionsResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('No routes found from Mapbox');
      return null;
    }

    const route = data.routes[0];

    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration
    };
  } catch (error) {
    console.error('Error fetching Mapbox route:', error);
    return null;
  }
};

/**
 * Get route with waypoints (for detailed navigation)
 */
export const getMapboxRouteWithWaypoints = async (
  vanLocation: Coordinates,
  students: Coordinates[],
  schoolLocation: Coordinates
): Promise<MapboxDirectionsResponse | null> => {
  try {
    const coordinates = [
      `${vanLocation.lng},${vanLocation.lat}`,
      ...students.map(s => `${s.lng},${s.lat}`),
      `${schoolLocation.lng},${schoolLocation.lat}`
    ].join(';');

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data: MapboxDirectionsResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching Mapbox route with waypoints:', error);
    return null;
  }
};

