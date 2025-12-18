import React, { useState, useEffect } from 'react';
import { UserRole, Vehicle, Student, Language, Coordinates, User, VehicleStatus } from './types';
import { INITIAL_VEHICLES, INITIAL_STUDENTS, moveVehicles, optimizeRoute } from './services/mockData';
import DriverInterface from './components/DriverInterface';
import PassengerInterface from './components/PassengerInterface';
import AdminInterface from './components/AdminInterface';
import Login from './components/Login';
import Register from './components/Register';
import { ShieldCheck, User as UserIcon, Bus, Globe } from 'lucide-react';
import { t } from './services/i18n';
import { useGeolocation } from './hooks/useGeolocation';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.NONE);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES || []);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS || []);
  const [lang, setLang] = useState<Language>('pt');
  const [useRealGPS, setUseRealGPS] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentRole(user.role);
      setIsAuthenticated(true);
    }
  }, []);

  // Get real GPS location
  const { location: userGPSLocation, loading: gpsLoading, error: gpsError } = useGeolocation(
    useRealGPS && currentRole !== UserRole.NONE
  );

  // Update vehicle location with real GPS (for driver) - updates continuously
  useEffect(() => {
    if (currentRole === UserRole.DRIVER && userGPSLocation && vehicles.length > 0 && useRealGPS) {
      setVehicles(prevVehicles => 
        (prevVehicles || []).map((v, idx) => 
          idx === 0 // Update first vehicle (main vehicle) with real GPS
            ? { ...v, location: userGPSLocation }
            : v
        )
      );
    }
  }, [userGPSLocation, currentRole, useRealGPS]);

  // Update student location with real GPS (for passenger) - updates continuously
  useEffect(() => {
    if (currentRole === UserRole.PASSENGER && userGPSLocation && students.length > 0 && useRealGPS) {
      setStudents(prevStudents => 
        (prevStudents || []).map((s, idx) => 
          idx === 0 // Update first student (current user) with real GPS
            ? { ...s, location: userGPSLocation }
            : s
        )
      );
    }
  }, [userGPSLocation, currentRole, useRealGPS]);

  // Simulate vehicle movement only if NOT using real GPS
  useEffect(() => {
    if (!useRealGPS && vehicles && vehicles.length > 0) {
      const interval = setInterval(() => {
        setVehicles(prevVehicles => moveVehicles(prevVehicles || []));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [useRealGPS, vehicles]);

  const handleUpdateVehicle = (vehicleId: string, updates: Partial<Vehicle>) => {
    setVehicles(prevVehicles => 
      (prevVehicles || []).map(v => v.id === vehicleId ? { ...v, ...updates } : v)
    );
  };

  const handleAssignStudent = (studentId: string, vehicleId: string) => {
    const updatedStudents = (students || []).map(s => 
      s.id === studentId ? { ...s, vehicleId, status: 'WAITING' as const } : s
    );
    setStudents(updatedStudents);
    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    if (targetVehicle) {
        const newCount = targetVehicle.currentPassengers + 1;
        setVehicles(prev => (prev || []).map(v => v.id === vehicleId ? { ...v, currentPassengers: newCount } : v));
        handleOptimizeRoute(vehicleId, updatedStudents.filter(s => s.vehicleId === vehicleId));
    }
  };

  const handleOptimizeRoute = (vehicleId: string, currentPassengers: Student[]) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if(!vehicle) return;
      const { routePoints } = optimizeRoute(vehicle.location, currentPassengers, vehicle.destinationSchool);
      setVehicles(prev => (prev || []).map(v => v.id === vehicleId ? { ...v, route: routePoints } : v));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setShowRegister(false);
    
    // Associate user with vehicle/student if needed
    if (user.role === UserRole.DRIVER && vehicles.length > 0) {
      // Update first vehicle with driver's name if it matches
      const vehicle = vehicles.find(v => v.driverName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()));
      if (!vehicle && vehicles[0]) {
        // Update first vehicle with user info
        setVehicles(prev => prev.map((v, idx) => 
          idx === 0 ? { ...v, driverName: user.name } : v
        ));
      }
    }
    
    if (user.role === UserRole.PASSENGER && students.length > 0) {
      // Update first student with user info if it matches
      const student = students.find(s => s.name.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()));
      if (!student && students[0]) {
        // Update first student with user info
        setStudents(prev => prev.map((s, idx) => 
          idx === 0 ? { 
            ...s, 
            name: user.name,
            phone: (user as any).phone || s.phone,
            address: (user as any).address || s.address,
            location: (user as any).location || s.location
          } : s
        ));
      }
    }
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setShowRegister(false);
    
    // For new drivers, create a vehicle for them
    if (user.role === UserRole.DRIVER) {
      const newVehicle: Vehicle = {
        id: `v-${user.id}`,
        driverName: user.name,
        plateNumber: 'NEW-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        type: 'VAN',
        capacity: 10,
        currentPassengers: 0,
        location: userGPSLocation || { lat: -23.5614, lng: -46.6565 },
        status: VehicleStatus.IDLE,
        route: [],
        nextStopEta: 0,
        destinationSchool: 'Lincoln High'
      };
      setVehicles(prev => [...prev, newVehicle]);
    }
    
    // For new students, create a student entry
    if (user.role === UserRole.PASSENGER) {
      const studentUser = user as any;
      const newStudent: Student = {
        id: `s-${user.id}`,
        name: user.name,
        address: studentUser.address || 'Endereço não informado',
        location: studentUser.location || userGPSLocation || { lat: -23.5614, lng: -46.6565 },
        phone: studentUser.phone || '',
        cpf: studentUser.cpf || '',
        status: 'WAITING'
      };
      setStudents(prev => [...prev, newStudent]);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentRole(UserRole.NONE);
    setIsAuthenticated(false);
  };

  // Safe element access to prevent reading '0' of undefined
  const mainVehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;
  const currentStudent = students && students.length > 0 ? students[0] : null;

  // Show Login/Register if not authenticated
  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setShowRegister(false)} lang={lang} />;
    }
    return <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setShowRegister(true)} lang={lang} />;
  }

  // Show role selection if authenticated but no role set (shouldn't happen, but safety check)
  if (currentRole === UserRole.NONE) {
    return (
      <div className="min-h-screen bg-hextech-radial flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30"></div>

        <button 
          onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
          className="absolute top-6 right-6 z-50 bg-hextech-dark border border-hextech-gold/30 px-4 py-2 text-hextech-gold font-beaufort tracking-hextech hover:bg-hextech-gold hover:text-hextech-black transition-all">
          <Globe size={16} className="inline mr-2" />
          {lang.toUpperCase()}
        </button>

        <div className="text-center mb-16 relative z-10">
          <div className="inline-block p-1 border border-hextech-gold mb-6 shadow-[0_0_20px_rgba(195,167,88,0.2)]">
            <div className="bg-hextech-dark p-6 border border-hextech-gold/40">
              <Bus size={64} className="text-hextech-gold" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-beaufort font-bold tracking-[0.2em] text-hextech-gold title-glow uppercase">
            SchoolPool
          </h1>
          <div className="h-px w-32 bg-hextech-gold mx-auto mt-4 mb-4"></div>
          <p className="text-hextech-gray max-w-lg mx-auto font-spiegel text-lg italic opacity-80 uppercase tracking-widest">
            {t('app_subtitle', lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative z-10">
          {[
            { role: UserRole.DRIVER, icon: Bus, title: 'role_driver', desc: 'role_driver_desc', color: 'blue' },
            { role: UserRole.PASSENGER, icon: UserIcon, title: 'role_student', desc: 'role_student_desc', color: 'gold' },
            { role: UserRole.ADMIN, icon: ShieldCheck, title: 'role_director', desc: 'role_director_desc', color: 'blue' }
          ].map((item) => (
            <button 
              key={item.role}
              onClick={() => setCurrentRole(item.role)}
              className="group relative bg-hextech-dark/80 border border-hextech-gold/20 p-1 hover:border-hextech-gold transition-all duration-300">
              <div className="border border-hextech-gold/10 p-8 flex flex-col items-center text-center h-full group-hover:bg-hextech-gold/5">
                <div className="mb-6 p-4 rounded-full border border-hextech-gold/30 group-hover:border-hextech-gold transition-all">
                  <item.icon className="text-hextech-gold" size={40} />
                </div>
                <h3 className="text-2xl font-beaufort font-bold text-hextech-gold mb-3 uppercase tracking-hextech">
                  {t(item.title as any, lang)}
                </h3>
                <p className="text-sm text-hextech-gray font-spiegel uppercase tracking-wider opacity-60">
                  {t(item.desc as any, lang)}
                </p>
                <div className="mt-8 w-full">
                  <div className={`h-10 flex items-center justify-center font-beaufort text-sm uppercase tracking-hextech border ${item.color === 'blue' ? 'bg-hextech-blue border-hextech-buttonBlue' : 'bg-hextech-gold text-hextech-black border-hextech-gold'}`}>
                    {lang === 'pt' ? 'SELECIONAR' : 'SELECT'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-20 text-hextech-gold/40 font-beaufort text-xs tracking-[0.3em] uppercase">
          {t('powered_by', lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-hextech-black relative font-spiegel">
      {currentRole === UserRole.DRIVER && mainVehicle && (
        <DriverInterface 
          vehicle={mainVehicle}
          passengers={(students || []).filter(s => s.vehicleId === mainVehicle.id)}
          unassignedStudents={(students || []).filter(s => !s.vehicleId)}
          onAssignStudent={handleAssignStudent}
          onOptimizeRoute={handleOptimizeRoute}
          lang={lang}
          userLocation={userGPSLocation}
        />
      )}
      {currentRole === UserRole.PASSENGER && currentStudent && (
        <PassengerInterface 
          currentUser={currentStudent} 
          vehicles={vehicles || []} 
          lang={lang}
          userLocation={userGPSLocation}
          onUpdateStudent={(updates) => {
            setStudents(prev => prev.map(s => s.id === currentStudent.id ? { ...s, ...updates } : s));
          }}
          onAssignVehicle={handleAssignStudent}
        />
      )}
      {currentRole === UserRole.ADMIN && (
        <AdminInterface vehicles={vehicles || []} students={students || []} onUpdateVehicle={handleUpdateVehicle} lang={lang} />
      )}

      {/* Persistent UI Controls */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'pt' : 'en')} className="bg-hextech-dark/90 border border-hextech-gold/30 text-hextech-gold px-3 py-1 font-beaufort text-xs tracking-widest hover:border-hextech-gold transition-all">
            {lang.toUpperCase()}
          </button>
         <button onClick={handleLogout} className="bg-hextech-dark/90 border border-hextech-gold/30 text-hextech-gold px-3 py-1 font-beaufort text-xs tracking-widest hover:border-hextech-gold transition-all">
           SAIR
         </button>
        </div>
        {/* GPS Status Indicator */}
        {currentRole !== UserRole.NONE && (
          <button
            onClick={() => setUseRealGPS(!useRealGPS)}
            className={`px-3 py-1.5 text-xs font-beaufort tracking-widest border transition-all ${
              gpsLoading 
                ? 'bg-hextech-gold/20 border-hextech-gold/50 text-hextech-gold cursor-wait' 
                : gpsError 
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                  : userGPSLocation && useRealGPS
                    ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' 
                    : 'bg-hextech-gray/20 border-hextech-gray/50 text-hextech-gray hover:bg-hextech-gray/30'
            }`}
            title={useRealGPS ? 'Clique para desativar GPS real' : 'Clique para ativar GPS real'}
          >
            {gpsLoading 
              ? 'GPS: Carregando...' 
              : gpsError 
                ? 'GPS: Erro (Clique para tentar)' 
                : userGPSLocation && useRealGPS
                  ? 'GPS: Ativo ✓' 
                  : 'GPS: Simulado'}
          </button>
        )}
      </div>
    </div>
  );
};

export default App;