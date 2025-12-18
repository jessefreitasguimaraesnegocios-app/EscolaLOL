import { Coordinates } from '../types';
import { getDistance } from './mockData';

export interface NavigationInstruction {
  type: 'straight' | 'turn-left' | 'turn-right' | 'arrive' | 'continue';
  distance: number; // in meters
  instruction: string;
  street?: string;
}

// Calculate bearing between two points
const calculateBearing = (from: Coordinates, to: Coordinates): number => {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (Math.atan2(y, x) * 180) / Math.PI;
};

// Calculate turn direction based on bearing change
const getTurnDirection = (currentBearing: number, nextBearing: number): 'straight' | 'turn-left' | 'turn-right' => {
  let angle = nextBearing - currentBearing;
  
  // Normalize angle to -180 to 180
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;

  if (Math.abs(angle) < 30) return 'straight';
  return angle > 0 ? 'turn-right' : 'turn-left';
};

// Generate navigation instructions for a route
export const generateNavigationInstructions = (
  currentLocation: Coordinates,
  route: Coordinates[],
  destinationName: string
): NavigationInstruction[] => {
  if (route.length < 2) return [];

  const instructions: NavigationInstruction[] = [];
  let currentBearing = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const from = i === 0 ? currentLocation : route[i];
    const to = route[i + 1];
    const nextBearing = calculateBearing(from, to);
    const distance = getDistance(from, to) * 1000; // Convert to meters

    if (i === 0) {
      currentBearing = nextBearing;
      instructions.push({
        type: 'straight',
        distance: Math.round(distance),
        instruction: `Siga em frente por ${Math.round(distance)}m`
      });
    } else {
      const turnType = getTurnDirection(currentBearing, nextBearing);
      let instruction = '';

      if (turnType === 'straight') {
        instruction = `Continue por ${Math.round(distance)}m`;
      } else if (turnType === 'turn-left') {
        instruction = `Vire à esquerda em ${Math.round(distance)}m`;
      } else {
        instruction = `Vire à direita em ${Math.round(distance)}m`;
      }

      instructions.push({
        type: turnType,
        distance: Math.round(distance),
        instruction
      });

      currentBearing = nextBearing;
    }
  }

  // Add arrival instruction
  instructions.push({
    type: 'arrive',
    distance: 0,
    instruction: `Você chegou ao destino: ${destinationName}`
  });

  return instructions;
};

// Get next instruction based on current location
export const getNextInstruction = (
  currentLocation: Coordinates,
  route: Coordinates[],
  destinationName: string,
  thresholdMeters: number = 50
): NavigationInstruction | null => {
  if (route.length < 2) return null;

  // Find closest point on route
  let closestIdx = 0;
  let minDist = Infinity;

  for (let i = 0; i < route.length; i++) {
    const dist = getDistance(currentLocation, route[i]) * 1000;
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  // If we're close to a waypoint, move to next
  if (minDist < thresholdMeters && closestIdx < route.length - 1) {
    closestIdx++;
  }

  if (closestIdx >= route.length - 1) {
    return {
      type: 'arrive',
      distance: 0,
      instruction: `Você chegou: ${destinationName}`
    };
  }

  const from = closestIdx === 0 ? currentLocation : route[closestIdx];
  const to = route[closestIdx + 1];
  const distance = getDistance(from, to) * 1000;
  const currentBearing = closestIdx > 0 ? calculateBearing(route[closestIdx - 1], from) : calculateBearing(currentLocation, from);
  const nextBearing = calculateBearing(from, to);
  const turnType = getTurnDirection(currentBearing, nextBearing);

  let instruction = '';
  if (turnType === 'straight') {
    instruction = `Siga em frente por ${Math.round(distance)}m`;
  } else if (turnType === 'turn-left') {
    instruction = `Vire à esquerda em ${Math.round(distance)}m`;
  } else {
    instruction = `Vire à direita em ${Math.round(distance)}m`;
  }

  return {
    type: turnType,
    distance: Math.round(distance),
    instruction
  };
};

