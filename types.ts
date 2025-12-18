
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
  photo?: string;
  notes?: string; // Observações (autismo, problemas, etc.)
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
  photo?: string; // Foto da van
  price?: number; // Valor do transporte
  assistants?: string[]; // Auxiliares
  destinations?: string[]; // Destinos disponíveis
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

export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
  createdAt: Date;
}

export interface Driver extends User {
  role: UserRole.DRIVER;
  licenseNumber: string;
  vehicleId?: string;
}

export interface StudentUser extends User {
  role: UserRole.PASSENGER;
  address: string;
  location: Coordinates;
  parentPhone?: string;
}

export interface AdminUser extends User {
  role: UserRole.ADMIN;
  schoolName?: string;
}