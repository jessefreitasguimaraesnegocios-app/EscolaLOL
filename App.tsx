import React, { useState, useEffect } from 'react';
import { UserRole, Vehicle, Student, Language } from './types';
import { INITIAL_VEHICLES, INITIAL_STUDENTS, moveVehicles, optimizeRoute } from './services/mockData';
import DriverInterface from './components/DriverInterface';
import PassengerInterface from './components/PassengerInterface';
import AdminInterface from './components/AdminInterface';
import { ShieldCheck, User, Bus, Globe } from 'lucide-react';
import { t } from './services/i18n';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.NONE);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES || []);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS || []);
  const [lang, setLang] = useState<Language>('pt');

  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;
    const interval = setInterval(() => {
      setVehicles(prevVehicles => moveVehicles(prevVehicles || []));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Safe element access to prevent reading '0' of undefined
  const mainVehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;
  const currentUser = students && students.length > 0 ? students[0] : null;

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
            { role: UserRole.PASSENGER, icon: User, title: 'role_student', desc: 'role_student_desc', color: 'gold' },
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
        />
      )}
      {currentRole === UserRole.PASSENGER && currentUser && (
        <PassengerInterface currentUser={currentUser} vehicles={vehicles || []} lang={lang} />
      )}
      {currentRole === UserRole.ADMIN && (
        <AdminInterface vehicles={vehicles || []} students={students || []} onUpdateVehicle={handleUpdateVehicle} lang={lang} />
      )}

      {/* Persistent UI Controls */}
      <div className="fixed top-4 right-4 z-[100] flex gap-2">
         <button onClick={() => setLang(lang === 'en' ? 'pt' : 'en')} className="bg-hextech-dark/90 border border-hextech-gold/30 text-hextech-gold px-3 py-1 font-beaufort text-xs tracking-widest hover:border-hextech-gold transition-all">
           {lang.toUpperCase()}
         </button>
         <button onClick={() => setCurrentRole(UserRole.NONE)} className="bg-hextech-dark/90 border border-hextech-gold/30 text-hextech-gold px-3 py-1 font-beaufort text-xs tracking-widest hover:border-hextech-gold transition-all">
           LOGOUT
         </button>
      </div>
    </div>
  );
};

export default App;