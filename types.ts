
export enum UserRole {
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
  ADMIN = 'ADMIN',
  NONE = 'NONE'
}

export type Language = 'en' | 'pt';

export enum VehicleStatus {
  IDLE = 'IDLE',
  EN_ROUTE = 'EN_ROUTE',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Student {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  phone: string;
  cpf: string;
  status: 'WAITING' | 'PICKED_UP' | 'DROPPED_OFF' | 'ABSENT';
  vehicleId?: string;
}

export interface Vehicle {
  id: string;
  driverName: string;
  plateNumber: string;
  type: 'VAN' | 'BUS';
  capacity: number;
  currentPassengers: number;
  location: Coordinates;
  status: VehicleStatus;
  route: Coordinates[]; // Array of waypoints
  nextStopEta: number; // minutes
  destinationSchool: string;
}

export interface RouteStop {
  id: string;
  studentId?: string;
  location: Coordinates;
  completed: boolean;
  type: 'PICKUP' | 'DROP_OFF' | 'SCHOOL';
  eta: string;
}

export interface AppState {
  userRole: UserRole;
  currentUserId: string;
  vehicles: Vehicle[];
  students: Student[];
  notifications: string[];
}
