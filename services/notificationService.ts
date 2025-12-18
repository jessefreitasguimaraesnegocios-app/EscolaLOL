import { Student, Vehicle } from '../types';

export interface Notification {
  id: string;
  type: 'TRANSPORT_REQUEST' | 'PAYMENT_CONFIRMED' | 'VEHICLE_ASSIGNED';
  vehicleId?: string;
  studentId: string;
  studentName: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Mock notification storage
let notifications: Notification[] = [];

export const notificationService = {
  // Create notification for vehicle when student requests transport
  notifyVehicleRequest: (student: Student, vehicle: Vehicle): Notification => {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'TRANSPORT_REQUEST',
      vehicleId: vehicle.id,
      studentId: student.id,
      studentName: student.name,
      message: `${student.name} solicitou transporte. Pagamento confirmado.`,
      timestamp: new Date(),
      read: false
    };
    
    notifications.push(notification);
    console.log('📬 Notificação enviada para a van:', vehicle.plateNumber);
    console.log('📋 Nova solicitação de transporte:', notification);
    
    return notification;
  },

  // Get notifications for a vehicle
  getVehicleNotifications: (vehicleId: string): Notification[] => {
    return notifications.filter(n => n.vehicleId === vehicleId && !n.read);
  },

  // Mark notification as read
  markAsRead: (notificationId: string): void => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  },

  // Get all notifications
  getAllNotifications: (): Notification[] => {
    return notifications;
  },

  // Clear all notifications
  clearAll: (): void => {
    notifications = [];
  }
};

