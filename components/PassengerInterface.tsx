import React, { useState } from 'react';
import { Vehicle, Student, Language } from '../types';
import MapEngine from './MapEngine';
import { Clock, Phone, Shield, ChevronRight, Bus } from 'lucide-react';
import { t } from '../services/i18n';

interface PassengerInterfaceProps {
  currentUser: Student;
  vehicles: Vehicle[];
  lang: Language;
}

const PassengerInterface: React.FC<PassengerInterfaceProps> = ({ currentUser, vehicles, lang }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(
    vehicles.find(v => v.id === currentUser.vehicleId) || null
  );

  const assignedVehicle = vehicles.find(v => v.id === currentUser.vehicleId);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Header */}
      <div className="p-4 bg-white shadow-sm z-10">
        <div className="bg-slate-100 p-3 rounded-full flex items-center gap-3 text-slate-500">
          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          <span className="text-sm font-medium">{t('to', lang)} {assignedVehicle?.destinationSchool || 'School'}</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapEngine
          vehicles={vehicles}
          userLocation={currentUser.location}
          showRoutes={false}
          highlightVehicleId={selectedVehicle?.id}
          onVehicleClick={setSelectedVehicle}
          className="h-full w-full"
        />
        
        {/* Floating ETA Card for assigned vehicle */}
        {assignedVehicle && assignedVehicle.status === 'EN_ROUTE' && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 flex flex-col items-center animate-fade-in-up">
            <span className="text-xs text-slate-500 font-medium uppercase">{t('eta', lang)}</span>
            <span className="text-2xl font-bold text-slate-900">{assignedVehicle.nextStopEta}<span className="text-sm align-top">min</span></span>
          </div>
        )}
      </div>

      {/* Bottom Information Panel */}
      <div className="bg-white rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.1)] z-20 -mt-4 p-5 min-h-[250px]">
        {selectedVehicle ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedVehicle.plateNumber}</h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-600">{selectedVehicle.type}</span>
                  <span>•</span>
                  <span>{selectedVehicle.driverName}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                 <Bus className="text-slate-700" size={24} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1">
                <Clock size={18} className="text-blue-500" />
                <span className="text-xs text-slate-500">{t('arrival', lang)}</span>
                <span className="font-bold text-sm text-slate-800">{selectedVehicle.nextStopEta} min</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer hover:bg-slate-100">
                <Phone size={18} className="text-green-500" />
                <span className="text-xs text-slate-500">{t('contact', lang)}</span>
                <span className="font-bold text-sm text-slate-800">{t('call', lang)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1">
                <Shield size={18} className="text-slate-400" />
                <span className="text-xs text-slate-500">{t('safety', lang)}</span>
                <span className="font-bold text-sm text-slate-800">{t('verified', lang)}</span>
              </div>
            </div>

            <button className="w-full bg-black text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              {t('share_trip', lang)}
            </button>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            {t('tap_vehicle', lang)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerInterface;