
import { Vehicle, Student, VehicleStatus, Coordinates, RouteStop } from '../types';

// Center around São Paulo, Brazil (Av. Paulista area)
const CENTER_LAT = -23.5614;
const CENTER_LNG = -46.6565;

export const AVAILABLE_DRIVERS = [
  "John Doe", "Sarah Smith", "Mike Ross", "Emily Blunt", 
  "David Kim", "Jessica Chen", "Robert Ford", "Lisa Wong"
];

export const PRESET_DESTINATIONS = [
  "Lincoln High", 
  "Washington Elementary", 
  "Roosevelt Middle School", 
  "Jefferson Academy"
];

// Helper to generate coordinates near the center
const nearbyCoord = (latOffset = 0, lngOffset = 0): Coordinates => ({
  lat: CENTER_LAT + latOffset + (Math.random() * 0.01 - 0.005),
  lng: CENTER_LNG + lngOffset + (Math.random() * 0.01 - 0.005),
});

// Helper to calculate distance
const getDistance = (c1: Coordinates, c2: Coordinates) => {
  return Math.sqrt(Math.pow(c2.lat - c1.lat, 2) + Math.pow(c2.lng - c1.lng, 2));
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    driverName: 'John Doe',
    plateNumber: 'SCH-2024',
    type: 'VAN',
    capacity: 5, // Small capacity for testing
    currentPassengers: 3,
    location: nearbyCoord(0.002, -0.002),
    status: VehicleStatus.EN_ROUTE,
    route: [
      nearbyCoord(0.002, -0.002), 
      { lat: -23.5505, lng: -46.6333 }
    ],
    nextStopEta: 5,
    destinationSchool: 'Lincoln High',
  },
  {
    id: 'v2',
    driverName: 'Sarah Smith',
    plateNumber: 'BUS-99',
    type: 'BUS',
    capacity: 40,
    currentPassengers: 32,
    location: nearbyCoord(-0.005, 0.005),
    status: VehicleStatus.DELAYED,
    route: [
      nearbyCoord(-0.005, 0.005), 
      nearbyCoord(0, 0), 
      { lat: -23.5505, lng: -46.6333 }
    ],
    nextStopEta: 12,
    destinationSchool: 'Lincoln High',
  },
  {
    id: 'v3',
    driverName: 'Mike Ross',
    plateNumber: 'VAN-X1',
    type: 'VAN',
    capacity: 10,
    currentPassengers: 0,
    location: nearbyCoord(-0.01, -0.01),
    status: VehicleStatus.IDLE,
    route: [],
    nextStopEta: 0,
    destinationSchool: 'Washington Elementary',
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Alice Johnson',
    address: 'R. Augusta, 1500',
    phone: '(11) 99999-1234',
    cpf: '123.456.789-00',
    location: nearbyCoord(0.004, 0.004),
    status: 'WAITING',
    vehicleId: 'v1',
  },
  {
    id: 's2',
    name: 'Bob Williams',
    address: 'Av. Paulista, 900',
    phone: '(11) 98888-5678',
    cpf: '234.567.890-11',
    location: nearbyCoord(0.006, 0.006),
    status: 'WAITING',
    vehicleId: 'v1',
  },
  {
    id: 's3',
    name: 'Charlie Brown',
    address: 'R. da Consolação, 500',
    phone: '(11) 97777-9012',
    cpf: '345.678.901-22',
    location: nearbyCoord(0.001, -0.001),
    status: 'PICKED_UP',
    vehicleId: 'v1',
  },
  // Unassigned Students
  {
    id: 's4',
    name: 'Diana Prince',
    address: 'R. Haddock Lobo, 300',
    phone: '(11) 96666-3456',
    cpf: '456.789.012-33',
    location: nearbyCoord(-0.003, 0.003),
    status: 'WAITING',
  },
  {
    id: 's5',
    name: 'Evan Wright',
    address: 'Al. Santos, 1200',
    phone: '(11) 95555-7890',
    cpf: '567.890.123-44',
    location: nearbyCoord(0.002, 0.005),
    status: 'WAITING',
  }
];

export const DRIVER_ROUTE: RouteStop[] = []; // Not used directly anymore, generated dynamically

// Driver's specific route (Mocked for v1)
export const moveVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  if (!vehicles) return [];
  
  return vehicles.map(v => {
    if (!v || !v.route) return v;
    if (v.status === VehicleStatus.IDLE || v.route.length < 2) return v;

    const target = v.route[1]; // Current target is the next point in route
    const dx = target.lng - v.location.lng;
    const dy = target.lat - v.location.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.0001) return v; // Close enough (approx 10m)

    const speed = 0.0003; // degrees per tick (approx 30m)
    const ratio = Math.min(speed / distance, 1);

    return {
      ...v,
      location: {
        lng: v.location.lng + dx * ratio,
        lat: v.location.lat + dy * ratio,
      }
    };
  });
};

// --- Route Optimization Algorithm ---
// Uses a Nearest Neighbor greedy algorithm to sort stops
export const optimizeRoute = (
  startLocation: Coordinates,
  passengers: Student[],
  destinationSchool: string
): { routePoints: Coordinates[], routeManifest: RouteStop[] } => {
  
  const schoolLocation = { lat: -23.5505, lng: -46.6333 }; // Sé Square (Mock School)
  
  let currentLocation = startLocation;
  const unvisitedStudents = [...passengers.filter(p => p.status === 'WAITING')];
  const pickedUpStudents = [...passengers.filter(p => p.status === 'PICKED_UP')];
  
  const orderedStops: RouteStop[] = [];
  const routePoints: Coordinates[] = [startLocation];

  // 1. Add already picked up students (they are on board) to manifest as completed
  pickedUpStudents.forEach(s => {
    orderedStops.push({
      id: `stop-${s.id}`,
      studentId: s.id,
      location: s.location,
      completed: true,
      type: 'PICKUP',
      eta: 'Completed'
    });
  });

  // 2. Sort waiting students by nearest neighbor
  while (unvisitedStudents.length > 0) {
    let nearestIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < unvisitedStudents.length; i++) {
      const dist = getDistance(currentLocation, unvisitedStudents[i].location);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex !== -1) {
      const nextStudent = unvisitedStudents.splice(nearestIndex, 1)[0];
      
      routePoints.push(nextStudent.location);
      orderedStops.push({
        id: `stop-${nextStudent.id}`,
        studentId: nextStudent.id,
        location: nextStudent.location,
        completed: false,
        type: 'PICKUP',
        eta: `${Math.ceil(minDist * 1000)} min` // Mock ETA based on distance
      });
      
      currentLocation = nextStudent.location;
    }
  }

  // 3. Add School as final destination
  routePoints.push(schoolLocation);
  orderedStops.push({
    id: 'school-dropoff',
    location: schoolLocation,
    completed: false,
    type: 'SCHOOL',
    eta: 'Final'
  });

  return { routePoints, routeManifest: orderedStops };
};
