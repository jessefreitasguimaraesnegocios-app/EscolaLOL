import React, { useState, useEffect } from 'react';
import { Vehicle, Student, RouteStop, Language } from '../types';
import MapEngine from './MapEngine';
// Added Bus to the imports from lucide-react to fix the 'Cannot find name Bus' error
import { Navigation, CheckCircle, MapPin, Users, Plus, Phone, CreditCard, X, Route as RouteIcon, Bus } from 'lucide-react';
import { t } from '../services/i18n';
import { optimizeRoute } from '../services/mockData';

interface DriverInterfaceProps {
  vehicle: Vehicle;
  passengers: Student[];
  unassignedStudents: Student[];
  onAssignStudent: (studentId: string, vehicleId: string) => void;
  onOptimizeRoute: (vehicleId: string, passengers: Student[]) => void;
  lang: Language;
}

const DriverInterface: React.FC<DriverInterfaceProps> = ({ 
  vehicle, passengers, unassignedStudents, onAssignStudent, onOptimizeRoute, lang 
}) => {
  const [activeStopId, setActiveStopId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dynamicRoute, setDynamicRoute] = useState<RouteStop[]>([]);

  useEffect(() => {
    const { routeManifest } = optimizeRoute(vehicle.location, passengers, vehicle.destinationSchool);
    setDynamicRoute(routeManifest);
    setActiveStopId(routeManifest.find(r => !r.completed)?.id || '');
  }, [passengers, vehicle.location, vehicle.destinationSchool]);

  const nextStop = dynamicRoute.find(r => r.id === activeStopId);
  const isFull = passengers.length >= vehicle.capacity;

  return (
    <div className="flex flex-col h-full bg-hextech-black">
      {/* Hextech Header */}
      <header className="bg-hextech-dark border-b border-hextech-gold/30 p-4 z-20 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-hextech-gold/50 flex items-center justify-center bg-hextech-black">
            <Bus className="text-hextech-gold" />
          </div>
          <div>
            <div className="text-[10px] text-hextech-gold font-beaufort tracking-[0.2em] opacity-60 uppercase">{t('vehicle_id', lang)}</div>
            <div className="font-beaufort font-bold text-hextech-gold text-lg tracking-widest">{vehicle.plateNumber}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-hextech-gold font-beaufort tracking-[0.2em] opacity-60 uppercase">{t('capacity', lang)}</div>
            <div className={`font-beaufort font-bold ${isFull ? 'text-red-500' : 'text-hextech-gold'}`}>
              {passengers.length} / {vehicle.capacity}
            </div>
          </div>
          <button 
            onClick={() => onOptimizeRoute(vehicle.id, passengers)}
            className="hextech-button-primary px-4 py-2 text-xs flex items-center gap-2">
            <RouteIcon size={16} /> <span className="hidden sm:inline">{t('optimize_route', lang)}</span>
          </button>
        </div>
      </header>

      {/* Main Map Content */}
      <div className="flex-1 relative border-x border-hextech-gold/10">
        <MapEngine 
          vehicles={[vehicle]} 
          students={passengers} 
          showRoutes={true}
          highlightVehicleId={vehicle.id}
          className="h-full w-full opacity-80"
        />
        
        {/* Navigation Overlay - LoL Style MATCH INFO */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-hextech-dark/95 border border-hextech-gold/40 p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="border border-hextech-gold/20 p-4 flex items-center gap-4">
            <div className="p-3 bg-hextech-blue/20 border border-hextech-blue text-hextech-blue animate-pulse">
              <Navigation size={28} />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[10px] text-hextech-gold font-beaufort tracking-[0.2em] uppercase mb-1">
                {t('next_stop', lang)} • {nextStop?.eta || '---'}
              </div>
              <div className="text-lg font-beaufort font-bold text-white tracking-widest truncate">
                {nextStop?.type === 'SCHOOL' ? vehicle.destinationSchool : passengers.find(p => p.id === nextStop?.studentId)?.address || '...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Manifest Panel */}
      <div className="h-[35%] bg-hextech-dark border-t border-hextech-gold/40 relative z-20 overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        <div className="p-4 border-b border-hextech-gold/10 flex justify-between items-center bg-hextech-black/40">
          <h3 className="font-beaufort font-bold text-hextech-gold tracking-hextech uppercase text-sm">
            {t('route_manifest', lang)}
          </h3>
          <button 
            onClick={() => setShowAddModal(true)}
            disabled={isFull}
            className="hextech-button-secondary px-6 py-2 text-[10px] font-bold">
            <Plus size={14} className="inline mr-1" /> {t('add', lang)}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {dynamicRoute.map((stop, idx) => {
            const isNext = stop.id === activeStopId;
            const isDone = stop.completed;
            const student = passengers.find(p => p.id === stop.studentId);
            
            return (
              <div key={stop.id} className={`flex items-center gap-4 p-3 border ${isNext ? 'bg-hextech-blue/10 border-hextech-blue shadow-[inset_0_0_15px_rgba(31,78,140,0.2)]' : 'bg-hextech-black/20 border-hextech-gold/10'} transition-all`}>
                <div className={`w-8 h-8 flex items-center justify-center font-beaufort font-bold border ${isDone ? 'border-green-500 text-green-500' : isNext ? 'border-hextech-blue text-hextech-blue' : 'border-hextech-gold/30 text-hextech-gold/40'}`}>
                  {idx + 1}
                </div>
                
                <div className="flex-1">
                  <div className={`font-beaufort tracking-wider text-xs uppercase ${isDone ? 'text-hextech-gray/40 line-through' : isNext ? 'text-white' : 'text-hextech-gray'}`}>
                    {stop.type === 'SCHOOL' ? t('drop_off_school', lang) : student?.name}
                  </div>
                  <div className="text-[10px] text-hextech-gold/40 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {stop.type === 'SCHOOL' ? vehicle.destinationSchool : student?.address}
                  </div>
                </div>

                {student && !isDone && (
                   <div className="flex gap-2">
                      <div className="p-2 border border-hextech-gold/20 text-hextech-gold/60"><Phone size={14} /></div>
                      <div className="p-2 border border-hextech-gold/20 text-hextech-gold/60"><CreditCard size={14} /></div>
                   </div>
                )}

                {isNext && (
                  <button className="bg-hextech-blue p-2 border border-hextech-buttonBlue text-white hover:brightness-125">
                    <CheckCircle size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hextech Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-hextech-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-hextech-dark border border-hextech-gold w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="p-4 border-b border-hextech-gold/20 flex justify-between items-center bg-hextech-black">
              <h3 className="font-beaufort text-hextech-gold tracking-hextech uppercase">{t('add_student', lang)}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-hextech-gold hover:text-white transition-colors"><X /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {unassignedStudents.length === 0 ? (
                <div className="text-center py-10 text-hextech-gray/60 italic font-beaufort">{t('no_unassigned', lang)}</div>
              ) : (
                unassignedStudents.map(student => (
                  <button 
                    key={student.id}
                    onClick={() => { onAssignStudent(student.id, vehicle.id); setShowAddModal(false); }}
                    className="w-full bg-hextech-black/40 border border-hextech-gold/20 p-4 flex justify-between items-center group hover:border-hextech-gold transition-all">
                    <div className="text-left">
                      <div className="font-beaufort text-white tracking-widest uppercase">{student.name}</div>
                      <div className="text-[10px] text-hextech-gold/60 uppercase">{student.address}</div>
                    </div>
                    <div className="hextech-button-primary px-3 py-1 text-[10px]">{t('add', lang)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverInterface;