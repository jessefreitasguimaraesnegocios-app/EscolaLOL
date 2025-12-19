import { Coordinates } from '../types';
import { distance } from './mockData';
import { getMapboxRoute, MapboxRoute } from './mapboxDirectionsService';

/**
 * Calculate distance from a point to a route (line)
 * Returns the minimum distance in meters
 */
export const distanceFromRoute = (
  point: Coordinates,
  routeGeometry: { type: 'LineString'; coordinates: [number, number][] }
): number => {
  if (!routeGeometry.coordinates || routeGeometry.coordinates.length === 0) {
    return Infinity;
  }

  let minDistance = Infinity;

  // Check distance to each segment of the route
  for (let i = 0; i < routeGeometry.coordinates.length - 1; i++) {
    const [lng1, lat1] = routeGeometry.coordinates[i];
    const [lng2, lat2] = routeGeometry.coordinates[i + 1];
    
    // Calculate distance from point to line segment
    const dist = pointToLineDistance(
      point.lat,
      point.lng,
      lat1,
      lng1,
      lat2,
      lng2
    );
    
    minDistance = Math.min(minDistance, dist);
  }

  return minDistance * 1000; // Convert to meters
};

/**
 * Calculate distance from a point to a line segment
 * Returns distance in kilometers
 */
const pointToLineDistance = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  
  // Use Haversine for accurate distance
  return distance(px, py, yy, xx);
};

/**
 * Check if driver is off route (more than threshold meters away)
 */
export const isOffRoute = (
  driverLocation: Coordinates,
  routeGeometry: { type: 'LineString'; coordinates: [number, number][] },
  thresholdMeters: number = 30
): boolean => {
  const dist = distanceFromRoute(driverLocation, routeGeometry);
  return dist > thresholdMeters;
};

/**
 * Recalculate route when driver is off route or student is picked up
 */
export const recalculateRoute = async (
  vanLocation: Coordinates,
  waitingStudents: Coordinates[],
  schoolLocation: Coordinates
): Promise<MapboxRoute | null> => {
  try {
    // Filter out picked up students (they're already in the van)
    const route = await getMapboxRoute(vanLocation, waitingStudents, schoolLocation);
    return route;
  } catch (error) {
    console.error('Error recalculating route:', error);
    return null;
  }
};

/**
 * Calculate ETA to next stop in minutes
 */
export const calculateETA = (distanceMeters: number, speedKmh: number = 40): number => {
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / speedKmh;
  return Math.ceil(timeHours * 60); // Convert to minutes
};

/**
 * Get current ETA from route
 */
export const getRouteETA = (route: MapboxRoute | null): number => {
  if (!route) return 0;
  return Math.ceil(route.duration / 60); // Convert seconds to minutes
};

