import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Vehicle, Student, RouteStop, Language, Coordinates, Driver } from '../types';
import MapEngine from './MapEngine';
import DriverProfile from './DriverProfile';
import { Navigation, CheckCircle, MapPin, Users, Plus, Phone, CreditCard, X, Route as RouteIcon, Bus, Clock, ArrowRight, User, ChevronRight, School, ArrowLeft, ArrowUp, Bell, Globe, LogOut, UserCircle } from 'lucide-react';
import { t } from '../services/i18n';
import { optimizeRoute, getDistance, calculateETA, sortStudentsByDistance } from '../services/mockData';
import { getNextInstruction, NavigationInstruction } from '../services/navigationService';
import { notificationService } from '../services/notificationService';
import { updateVanLocation } from '../services/firestoreService';
import { 
  isOffRoute, 
  recalculateRoute, 
  getRouteETA,
  distanceFromRoute 
} from '../services/uberNavigationService';
import { getMapboxRoute, MapboxRoute } from '../services/mapboxDirectionsService';

interface DriverInterfaceProps {
  vehicle: Vehicle;
  passengers: Student[];
  unassignedStudents: Student[];
  onAssignStudent: (studentId: string, vehicleId: string) => void;
  onOptimizeRoute: (vehicleId: string, passengers: Student[]) => void;
  lang: Language;
  userLocation?: Coordinates | null;
  onLanguageChange?: (lang: Language) => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  currentDriver?: Driver;
  onUpdateDriver?: (updates: Partial<Driver>) => void;
}

const DriverInterface: React.FC<DriverInterfaceProps> = ({ 
  vehicle, passengers, unassignedStudents, onAssignStudent, onOptimizeRoute, lang, userLocation, onLanguageChange, onLogout, onProfileClick, currentDriver, onUpdateDriver
}) => {
  const [activeStopId, setActiveStopId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dynamicRoute, setDynamicRoute] = useState<RouteStop[]>([]);
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());
  const [navigationInstruction, setNavigationInstruction] = useState<NavigationInstruction | null>(null);
  const [navigationMode, setNavigationMode] = useState(true);
  const [currentRoutePoints, setCurrentRoutePoints] = useState<Coordinates[]>([]);
  const [panelHeight, setPanelHeight] = useState(35); // Percentage of viewport height (default 35%)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(35);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [sortedPassengers, setSortedPassengers] = useState<Student[]>([]);
  const [mapboxRoute, setMapboxRoute] = useState<MapboxRoute | null>(null);
  const [routeETA, setRouteETA] = useState<number>(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastRouteCheck, setLastRouteCheck] = useState<Coordinates | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Measure header height
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.offsetHeight);
    }
  }, []);

  // Send GPS location to Firestore every 2-5 seconds
  useEffect(() => {
    if (!vehicle?.id) return;

    if (!navigator.geolocation) {
      setGpsStatus('error');
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    let watchId: number | null = null;
    let lastSentTime = 0;
    const SEND_INTERVAL = 3000; // Send to Firestore every 3 seconds
    const GPS_TIMEOUT = 10000; // 10 seconds timeout for GPS

    const sendLocationToFirestore = async (position: GeolocationPosition) => {
      const now = Date.now();
      // Throttle: only send to Firestore every 3 seconds
      if (now - lastSentTime < SEND_INTERVAL) {
        return;
      }

      try {
        await updateVanLocation(
          vehicle.id,
          position.coords.latitude,
          position.coords.longitude
        );
        setGpsStatus('idle');
        lastSentTime = now;
      } catch (error) {
        console.error('Error updating van location in Firestore:', error);
        setGpsStatus('error');
      }
    };

    // Use watchPosition for continuous updates (more efficient than getCurrentPosition in a loop)
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsStatus('idle');
          sendLocationToFirestore(position);
        },
        (error) => {
          // Only log error if it's not a timeout (timeouts are common and not critical)
          if (error.code !== error.TIMEOUT) {
            console.warn('GPS error:', error.message);
          }
          
          // Set error status only for critical errors
          if (error.code === error.PERMISSION_DENIED) {
            setGpsStatus('error');
            console.error('GPS permission denied. Please enable location access.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsStatus('error');
            console.error('GPS position unavailable.');
          } else {
            // For timeout, keep trying but don't show as error
            setGpsStatus('idle');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: GPS_TIMEOUT,
          maximumAge: 5000 // Accept cached position up to 5 seconds old
        }
      );
    } catch (error) {
      console.error('Error setting up GPS watch:', error);
      setGpsStatus('error');
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [vehicle.id]);

  // Check for notifications
  useEffect(() => {
    const checkNotifications = () => {
      const vehicleNotifications = notificationService.getVehicleNotifications(vehicle.id);
      setNotifications(vehicleNotifications.length);
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [vehicle.id]);

  // Sort students by distance from van (Uber style) - Updates whenever van moves
  useEffect(() => {
    if (passengers.length > 0 && vehicle.location) {
      // Sort students: nearest to farthest
      const sorted = sortStudentsByDistance(vehicle.location, passengers);
      setSortedPassengers(sorted);
    } else {
      setSortedPassengers(passengers);
    }
  }, [vehicle.location, passengers]);

  // Initial route calculation with Mapbox
  useEffect(() => {
    if (!vehicle.location || !navigationMode) return;
    
    const calculateInitialRoute = async () => {
      setIsRecalculating(true);
      try {
        const waitingStudents = sortedPassengers.filter(s => s.status === 'WAITING');
        const waitingLocations = waitingStudents.map(s => s.location);
        
        if (waitingLocations.length === 0) {
          setMapboxRoute(null);
          setIsRecalculating(false);
          return;
        }
        
        const schoolLocation = { lat: -23.5505, lng: -46.6333 }; // TODO: Get from vehicle.destinationSchool
        
        const route = await getMapboxRoute(
          vehicle.location,
          waitingLocations,
          schoolLocation
        );
        
        if (route) {
          setMapboxRoute(route);
          setRouteETA(getRouteETA(route));
        }
      } catch (error) {
        console.error('Error calculating initial route:', error);
      } finally {
        setIsRecalculating(false);
      }
    };

    calculateInitialRoute();
  }, [vehicle.location, sortedPassengers, navigationMode]);

  // Check if driver is off route and recalculate (Uber style)
  useEffect(() => {
    if (!mapboxRoute || !vehicle.location || !navigationMode || isRecalculating) return;
    
    // Check every 5 seconds if driver is off route
    const checkInterval = setInterval(() => {
      if (!mapboxRoute.geometry || isRecalculating) return;
      
      // Check if driver is more than 30 meters away from route
      const isOff = isOffRoute(vehicle.location, mapboxRoute.geometry, 30);
      
      if (isOff) {
        console.log('Driver is off route! Recalculating...');
        setIsRecalculating(true);
        
        // Recalculate route
        const waitingStudents = sortedPassengers.filter(s => s.status === 'WAITING');
        const waitingLocations = waitingStudents.map(s => s.location);
        
        if (waitingLocations.length === 0) {
          setMapboxRoute(null);
          setIsRecalculating(false);
          return;
        }
        
        const schoolLocation = { lat: -23.5505, lng: -46.6333 };
        
        recalculateRoute(vehicle.location, waitingLocations, schoolLocation)
          .then(newRoute => {
            if (newRoute) {
              setMapboxRoute(newRoute);
              setRouteETA(getRouteETA(newRoute));
            }
            setIsRecalculating(false);
          })
          .catch(error => {
            console.error('Error recalculating route:', error);
            setIsRecalculating(false);
          });
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [mapboxRoute, vehicle.location, navigationMode, isRecalculating, sortedPassengers]);

  // Update ETA in real-time
  useEffect(() => {
    if (!mapboxRoute) {
      setRouteETA(0);
      return;
    }
    
    // Update ETA every 10 seconds
    const etaInterval = setInterval(() => {
      const eta = getRouteETA(mapboxRoute);
      setRouteETA(eta);
    }, 10000);
    
    return () => clearInterval(etaInterval);
  }, [mapboxRoute]);

  // Optimize route using sorted passengers (Uber style)
  useEffect(() => {
    // Use sorted passengers for route optimization
    const passengersToUse = sortedPassengers.length > 0 ? sortedPassengers : passengers;
    const { routeManifest, routePoints } = optimizeRoute(vehicle.location, passengersToUse, vehicle.destinationSchool);
    setDynamicRoute(routeManifest);
    setCurrentRoutePoints(routePoints);
    const nextUncompleted = routeManifest.find(r => !r.completed && !completedStops.has(r.id));
    setActiveStopId(nextUncompleted?.id || '');
    
    // Generate navigation instruction
    if (nextUncompleted && routePoints.length > 1) {
      const destinationName = nextUncompleted.type === 'SCHOOL' 
        ? vehicle.destinationSchool 
        : passengersToUse.find(p => p.id === nextUncompleted.studentId)?.name || 'Destino';
      const instruction = getNextInstruction(vehicle.location, routePoints, destinationName);
      setNavigationInstruction(instruction);
    }
  }, [sortedPassengers, passengers, vehicle.location, vehicle.destinationSchool, completedStops]);

  const nextStop = dynamicRoute.find(r => r.id === activeStopId);
  const isFull = passengers.length >= vehicle.capacity;
  
  const handleCompleteStop = (stopId: string) => {
    setCompletedStops(prev => new Set([...prev, stopId]));
    
    // When student is picked up, remove from route and recalculate
    const stop = dynamicRoute.find(r => r.id === stopId);
    if (stop && stop.studentId) {
      // Student was picked up - recalculate route without this student
      recalculateRouteForWaitingStudents();
    }
  };

  // Recalculate route for waiting students only
  const recalculateRouteForWaitingStudents = async () => {
    if (!vehicle.location || isRecalculating) return;
    
    setIsRecalculating(true);
    try {
      // Get only waiting students (not picked up)
      const waitingStudents = sortedPassengers.filter(s => s.status === 'WAITING');
      const waitingLocations = waitingStudents.map(s => s.location);
      
      const schoolLocation = { lat: -23.5505, lng: -46.6333 }; // TODO: Get from vehicle.destinationSchool
      
      const newRoute = await recalculateRoute(
        vehicle.location,
        waitingLocations,
        schoolLocation
      );
      
      if (newRoute) {
        setMapboxRoute(newRoute);
        setRouteETA(getRouteETA(newRoute));
      }
    } catch (error) {
      console.error('Error recalculating route:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleCallStudent = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Drag handlers for mobile/tablet
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartHeight(panelHeight);
  }, [panelHeight]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY - clientY; // Negative when dragging up
    const windowHeight = window.innerHeight;
    const deltaVh = (deltaY / windowHeight) * 100; // Convert to vh units
    const newHeight = Math.max(10, Math.min(50, dragStartHeight + deltaVh)); // Min 10vh, Max 50vh (half screen)
    
    setPanelHeight(newHeight);
  }, [dragStartY, dragStartHeight]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside menu and not on the bus icon button
      if (menuRef.current && !menuRef.current.contains(target)) {
        const busButton = target.closest('.w-12.h-12');
        if (!busButton) {
          setShowMenu(false);
        }
      }
    };

    if (showMenu) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="flex flex-col h-full bg-hextech-black overflow-hidden">
      {/* Hextech Header */}
      <header className="bg-hextech-dark border-b border-hextech-gold/30 p-4 z-[9998] flex justify-between items-center shadow-2xl flex-shrink-0 relative">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 border border-hextech-gold/50 flex items-center justify-center bg-hextech-black cursor-pointer hover:bg-hextech-gold/10 transition-all relative z-[10000]"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Bus className="text-hextech-gold" />
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                ref={menuRef}
                className="absolute top-full left-0 mt-2 bg-hextech-dark border border-hextech-gold/50 shadow-[0_0_20px_rgba(195,167,88,0.3)] min-w-[150px] z-[9999]"
              >
                <div className="p-2 space-y-1">
                  {/* Profile */}
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setShowMenu(false);
                      if (onProfileClick) {
                        onProfileClick();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-hextech-black/40 border border-hextech-gold/20 text-hextech-gold hover:bg-hextech-blue/20 hover:border-hextech-blue transition-all text-xs font-beaufort tracking-widest"
                  >
                    <UserCircle size={14} />
                    <span>{t('profile', lang) || 'Perfil'}</span>
                  </button>
                  
                  {/* Language Toggle */}
                  <button
                    onClick={() => {
                      if (onLanguageChange) {
                        onLanguageChange(lang === 'en' ? 'pt' : 'en');
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-hextech-black/40 border border-hextech-gold/20 text-hextech-gold hover:bg-hextech-gold/10 hover:border-hextech-gold transition-all text-xs font-beaufort tracking-widest"
                  >
                    <Globe size={14} />
                    <span>{lang === 'en' ? 'PT' : 'EN'}</span>
                  </button>
                  
                  {/* Logout */}
                  <button
                    onClick={() => {
                      if (onLogout) {
                        onLogout();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-hextech-black/40 border border-hextech-gold/20 text-hextech-gold hover:bg-red-500/20 hover:border-red-500 transition-all text-xs font-beaufort tracking-widest"
                  >
                    <LogOut size={14} />
                    <span>SAIR</span>
                  </button>
                </div>
              </div>
            )}
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
          {/* GPS Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              gpsStatus === 'idle' ? 'bg-green-500 animate-pulse' :
              gpsStatus === 'sending' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} title={
              gpsStatus === 'idle' ? 'GPS Enviando' :
              gpsStatus === 'sending' ? 'Enviando GPS...' :
              'Erro no GPS'
            }></div>
            <span className="text-[10px] text-hextech-gold/60 uppercase hidden sm:inline">
              {gpsStatus === 'idle' ? 'GPS' : gpsStatus === 'sending' ? 'Enviando...' : 'Erro'}
            </span>
          </div>
          {/* Route ETA Indicator */}
          {navigationMode && routeETA > 0 && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-hextech-blue" />
              <span className="text-xs font-beaufort font-bold text-hextech-blue">
                {routeETA} min
              </span>
              {isRecalculating && (
                <span className="text-[10px] text-yellow-500 animate-pulse">Recalculando...</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            {notifications > 0 && (
              <div className="relative">
                <button className="px-3 py-2 text-xs flex items-center gap-2 border bg-hextech-gold/20 border-hextech-gold text-hextech-gold">
                  <Bell size={16} />
                  <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {notifications}
                  </span>
                </button>
              </div>
            )}
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

      {/* Main Map Content - Adjusts based on panel height */}
      <div 
        className="relative border-x border-hextech-gold/10 transition-all duration-200 flex-shrink-0"
        style={{ height: `calc(100vh - ${panelHeight}vh - ${headerHeight}px)` }}
      >
        <MapEngine 
          vehicles={[vehicle]} 
          students={passengers} 
          showRoutes={true}
          highlightVehicleId={vehicle.id}
          navigationMode={navigationMode}
          currentRoute={currentRoutePoints}
          userLocation={userLocation || vehicle.location}
          followDriver={navigationMode && !!userLocation}
          useMapboxDirections={true}
          schoolLocation={{ lat: -23.5505, lng: -46.6333 }} // TODO: Get from vehicle.destinationSchool
          mapboxRoute={mapboxRoute}
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

      {/* Bottom Manifest Panel - Draggable */}
      <div 
        className={`bg-hextech-dark border-t border-hextech-gold/40 relative z-20 overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transition-all duration-200 flex-shrink-0 ${
          isDragging ? 'shadow-[0_-15px_60px_rgba(195,167,88,0.4)]' : ''
        }`}
        style={{ height: `${panelHeight}vh` }}
      >
        {/* Drag Handle */}
        <div 
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`w-full h-10 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none border-b transition-all ${
            isDragging 
              ? 'bg-hextech-gold/20 border-hextech-gold/50' 
              : 'bg-hextech-black/60 border-hextech-gold/20 hover:bg-hextech-black/80'
          }`}
        >
          <div className={`w-16 h-1.5 rounded-full transition-all ${
            isDragging 
              ? 'bg-hextech-gold w-20 h-2' 
              : 'bg-hextech-gold/50'
          }`}></div>
        </div>

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
            // Calculate distance from current van position
            const distance = stop.type === 'SCHOOL' 
              ? getDistance(vehicle.location, stop.location)
              : student 
                ? getDistance(vehicle.location, student.location)
                : 0;
            const eta = calculateETA(distance);
            
            // Get position in sorted queue (Uber style)
            const queuePosition = !isDone && stop.type !== 'SCHOOL' && student
              ? sortedPassengers.findIndex(p => p.id === student.id) + 1
              : null;
            
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
                        {distance.toFixed(2)} km
                      </span>
                      {queuePosition && (
                        <>
                          <span className="text-hextech-gold/30">•</span>
                          <span className="text-[10px] text-hextech-blue/80 font-bold">
                            #{queuePosition} na fila
                          </span>
                        </>
                      )}
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

      {/* Hextech Modal - Add Student */}
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

      {/* Driver Profile Modal */}
      {showProfile && currentDriver && (
        <DriverProfile
          driver={currentDriver}
          vehicle={vehicle}
          onClose={() => setShowProfile(false)}
          lang={lang}
          onUpdate={(updates) => {
            if (onUpdateDriver) {
              onUpdateDriver(updates);
            }
            // Update local state to reflect changes immediately
            if (updates.photo) {
              // Photo is already handled by DriverProfile's internal state
            }
          }}
        />
      )}
    </div>
  );
};

export default DriverInterface;