import { User, UserRole, Driver, StudentUser, AdminUser, Coordinates } from '../types';

// Mock database (in production, this would be a real database)
let users: User[] = [];
let currentUser: User | null = null;

// Initialize with some default users for testing
const initializeDefaultUsers = () => {
  if (users.length === 0) {
    users = [
      {
        id: 'driver1',
        email: 'motorista@escolapool.com',
        password: '123456',
        name: 'John Doe',
        role: UserRole.DRIVER,
        phone: '(11) 99999-1234',
        cpf: '123.456.789-00',
        createdAt: new Date()
      } as Driver,
      {
        id: 'student1',
        email: 'estudante@escolapool.com',
        password: '123456',
        name: 'Alice Johnson',
        role: UserRole.PASSENGER,
        phone: '(11) 99999-1234',
        cpf: '123.456.789-00',
        address: 'R. Augusta, 1500',
        location: { lat: -23.5614, lng: -46.6565 },
        createdAt: new Date()
      } as StudentUser,
      {
        id: 'admin1',
        email: 'diretor@escolapool.com',
        password: '123456',
        name: 'Director Smith',
        role: UserRole.ADMIN,
        phone: '(11) 99999-1234',
        schoolName: 'Lincoln High',
        createdAt: new Date()
      } as AdminUser
    ];
  }
};

// Initialize on first import
initializeDefaultUsers();

export const authService = {
  // Register new user
  register: async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    additionalData?: {
      phone?: string;
      cpf?: string;
      address?: string;
      location?: Coordinates;
      licenseNumber?: string;
      schoolName?: string;
      parentPhone?: string;
    }
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email já cadastrado' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Email inválido' };
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
    }

    // Create user based on role
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      password, // In production, hash this!
      name,
      role,
      phone: additionalData?.phone,
      cpf: additionalData?.cpf,
      createdAt: new Date(),
      ...(role === UserRole.DRIVER && {
        licenseNumber: additionalData?.licenseNumber
      } as Partial<Driver>),
      ...(role === UserRole.PASSENGER && {
        address: additionalData?.address || '',
        location: additionalData?.location || { lat: -23.5614, lng: -46.6565 },
        parentPhone: additionalData?.parentPhone
      } as Partial<StudentUser>),
      ...(role === UserRole.ADMIN && {
        schoolName: additionalData?.schoolName
      } as Partial<AdminUser>)
    };

    users.push(newUser);
    return { success: true, user: newUser };
  },

  // Login
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { success: false, error: 'Email ou senha incorretos' };
    }

    currentUser = user;
    // In production, store token in localStorage or httpOnly cookie
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return { success: true, user };
  },

  // Logout
  logout: (): void => {
    currentUser = null;
    localStorage.removeItem('currentUser');
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (currentUser) return currentUser;
    
    // Try to restore from localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null;
  },

  // Get all users (for admin)
  getAllUsers: (): User[] => {
    return users;
  }
};



