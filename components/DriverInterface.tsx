import React, { useState, useEffect } from 'react';
import { Vehicle, Student, RouteStop, Language, Coordinates } from '../types';
import MapEngine from './MapEngine';
import { Navigation, CheckCircle, MapPin, Users, Plus, Phone, CreditCard, X, Route as RouteIcon, Bus, Clock, ArrowRight, User, ChevronRight, School, ArrowLeft, ArrowUp } from 'lucide-react';
import { t } from '../services/i18n';
import { optimizeRoute, getDistance, calculateETA } from '../services/mockData';
import { getNextInstruction, NavigationInstruction } from '../services/navigationService';

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
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [navigationMode, setNavigationMode] = useState(true);
  const [currentRoutePoints, setCurrentRoutePoints] = useState<Coordinates[]>([]);

  useEffect(() => {
    const { routeManifest, routePoints } = optimizeRoute(vehicle.location, passengers, vehicle.destinationSchool);
    setDynamicRoute(routeManifest);
    setCurrentRoutePoints(routePoints);
    const nextUncompleted = routeManifest.find(r => !r.completed && !completedStops.has(r.id));
    setActiveStopId(nextUncompleted?.id || '');
    
    // Generate navigation instruction
    if (nextUncompleted && routePoints.length > 1) {
      const destinationName = nextUncompleted.type === 'SCHOOL' 
        ? vehicle.destinationSchool 
        : passengers.find(p => p.id === nextUncompleted.studentId)?.name || 'Destino';
      const instruction = getNextInstruction(vehicle.location, routePoints, destinationName);
      setNavigationInstruction(instruction);
    }
  }, [passengers, vehicle.location, vehicle.destinationSchool, completedStops]);

  const nextStop = dynamicRoute.find(r => r.id === activeStopId);
  const isFull = passengers.length >= vehicle.capacity;
  
  const handleCompleteStop = (stopId: string) => {
    setCompletedStops(prev => new Set([...prev, stopId]));
  };

  const handleCallStudent = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNavigationMode(!navigationMode)}
              className={`px-3 py-2 text-xs flex items-center gap-2 border transition-all ${
                navigationMode 
                  ? 'bg-hextech-blue/30 border-hextech-blue text-hextech-blue' 
                  : 'bg-hextech-dark border-hextech-gold/30 text-hextech-gold hover:border-hextech-gold'
              }`}
              title={navigationMode ? 'Desativar Navegação' : 'Ativar Navegação'}
            >
              <Navigation size={16} />
            </button>
            <button 
              onClick={() => onOptimizeRoute(vehicle.id, passengers)}
              className="hextech-button-primary px-4 py-2 text-xs flex items-center gap-2">
              <RouteIcon size={16} /> <span className="hidden sm:inline">{t('optimize_route', lang)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Map Content */}
      <div className="flex-1 relative border-x border-hextech-gold/10">
        <MapEngine 
          vehicles={[vehicle]} 
          students={passengers} 
          showRoutes={true}
          highlightVehicleId={vehicle.id}
          navigationMode={navigationMode}
          currentRoute={currentRoutePoints}
          className="h-full w-full"
        />
        
        {/* Navigation Card - Waze Style with Hextech Theme */}
        {nextStop && navigationInstruction && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-30">
            <div className="bg-hextech-dark/98 border-2 border-hextech-gold/50 p-1 shadow-[0_0_40px_rgba(195,167,88,0.3)]">
              <div className="bg-hextech-black/95 border border-hextech-gold/30 p-6">
                {/* Navigation Instruction - Waze Style */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 border-2 rounded-lg ${
                    navigationInstruction.type === 'turn-left' 
                      ? 'bg-orange-500/20 border-orange-500' 
                      : navigationInstruction.type === 'turn-right'
                        ? 'bg-green-500/20 border-green-500'
                        : 'bg-hextech-blue/30 border-hextech-blue'
                  }`}>
                    {navigationInstruction.type === 'turn-left' ? (
                      <ArrowLeft size={32} className="text-orange-400" />
                    ) : navigationInstruction.type === 'turn-right' ? (
                      <ArrowRight size={32} className="text-green-400" />
                    ) : (
                      <ArrowUp size={32} className="text-hextech-blue" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-beaufort font-bold text-white mb-1">
                      {navigationInstruction.instruction}
                    </div>
                    {navigationInstruction.distance > 0 && (
                      <div className="text-sm text-hextech-gold/80 font-beaufort uppercase tracking-wider">
                        {navigationInstruction.distance}m restantes
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination Info */}
                <div className="border-t border-hextech-gold/20 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-beaufort text-hextech-gold/80 tracking-widest uppercase mb-1">
                        {nextStop.type === 'SCHOOL' ? t('drop_off_school', lang) : t('next_stop', lang)}
                      </div>
                      <h3 className="text-lg font-beaufort font-bold text-white tracking-wider truncate">
                        {nextStop.type === 'SCHOOL' 
                          ? vehicle.destinationSchool 
                          : passengers.find(p => p.id === nextStop.studentId)?.name || '...'}
                      </h3>
                      {nextStop.type !== 'SCHOOL' && (
                        <p className="text-xs text-hextech-gray/60 uppercase tracking-widest flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {passengers.find(p => p.id === nextStop.studentId)?.address || '...'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-hextech-blue ml-4">
                      <Clock size={16} />
                      <span className="text-lg font-bold">{nextStop.eta}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {nextStop.type !== 'SCHOOL' && (() => {
                    const student = passengers.find(p => p.id === nextStop.studentId);
                    return student && (
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => handleCallStudent(student.phone)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-hextech-blue/20 border border-hextech-blue text-hextech-blue hover:bg-hextech-blue/30 transition-all text-xs font-beaufort uppercase tracking-wider"
                        >
                          <Phone size={14} /> {t('call', lang)}
                        </button>
                        {!completedStops.has(nextStop.id) && (
                          <button
                            onClick={() => handleCompleteStop(nextStop.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-hextech-gold/20 border border-hextech-gold text-hextech-gold hover:bg-hextech-gold/30 transition-all text-xs font-beaufort uppercase tracking-wider"
                          >
                            <CheckCircle size={14} /> Confirmar
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dynamicRoute.map((stop, idx) => {
            const isNext = stop.id === activeStopId;
            const isDone = stop.completed || completedStops.has(stop.id);
            const student = passengers.find(p => p.id === stop.studentId);
            const distance = stop.type === 'SCHOOL' 
              ? getDistance(vehicle.location, stop.location)
              : student 
                ? getDistance(vehicle.location, student.location)
                : 0;
            const eta = calculateETA(distance);
            
            return (
              <div 
                key={stop.id} 
                className={`relative flex items-center gap-4 p-4 border-2 rounded transition-all ${
                  isDone 
                    ? 'bg-hextech-black/30 border-green-500/30 opacity-60' 
                    : isNext 
                      ? 'bg-hextech-blue/20 border-hextech-blue shadow-[0_0_20px_rgba(31,78,140,0.4)] scale-[1.02]' 
                      : 'bg-hextech-black/40 border-hextech-gold/20 hover:border-hextech-gold/40'
                }`}
              >
                {/* Status Indicator */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 flex items-center justify-center font-beaufort font-bold border-2 rounded-full ${
                    isDone 
                      ? 'border-green-500 bg-green-500/20 text-green-500' 
                      : isNext 
                        ? 'border-hextech-blue bg-hextech-blue/30 text-hextech-blue animate-pulse' 
                        : 'border-hextech-gold/40 bg-hextech-gold/10 text-hextech-gold/60'
                  }`}>
                    {isDone ? <CheckCircle size={20} /> : idx + 1}
                  </div>
                  {isNext && (
                    <div className="w-1 h-8 bg-hextech-blue animate-pulse"></div>
                  )}
                </div>
                
                {/* Student/School Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-beaufort tracking-wider text-sm uppercase ${
                      isDone ? 'text-hextech-gray/40 line-through' : isNext ? 'text-white font-bold' : 'text-hextech-gray'
                    }`}>
                      {stop.type === 'SCHOOL' ? (
                        <div className="flex items-center gap-2">
                          <School size={16} className="text-hextech-blue" />
                          {vehicle.destinationSchool}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-hextech-gold" />
                          {student?.name || '...'}
                        </div>
                      )}
                    </div>
                    {!isDone && (
                      <div className="flex items-center gap-1 text-hextech-blue text-xs font-beaufort">
                        <Clock size={12} />
                        <span className="font-bold">{eta} min</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-hextech-gold/60 uppercase tracking-widest flex items-center gap-1 mb-2">
                    <MapPin size={12} /> 
                    <span className="truncate">
                      {stop.type === 'SCHOOL' ? vehicle.destinationSchool : student?.address || '...'}
                    </span>
                  </div>
                  {student && !isDone && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-hextech-gray/50 uppercase">
                        {distance.toFixed(1)} km
                      </span>
                      <span className="text-hextech-gold/30">•</span>
                      <span className="text-[10px] text-hextech-gray/50">
                        {student.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isDone && student && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCallStudent(student.phone)}
                      className="p-2 border border-hextech-blue/50 text-hextech-blue hover:bg-hextech-blue/20 transition-all rounded"
                      title={t('call', lang)}
                    >
                      <Phone size={16} />
                    </button>
                    {isNext && (
                      <button
                        onClick={() => handleCompleteStop(stop.id)}
                        className="p-2 border border-hextech-gold/50 text-hextech-gold hover:bg-hextech-gold/20 transition-all rounded"
                        title="Confirmar chegada"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                )}
                
                {isDone && (
                  <div className="text-green-500">
                    <CheckCircle size={24} />
                  </div>
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