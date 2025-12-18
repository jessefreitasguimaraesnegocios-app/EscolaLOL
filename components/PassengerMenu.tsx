import React, { useState } from 'react';
import { Student, Vehicle, Language } from '../types';
import { User, Bus, Menu, X } from 'lucide-react';
import StudentProfile from './StudentProfile';
import VanList from './VanList';

interface PassengerMenuProps {
  student: Student;
  vehicles: Vehicle[];
  onUpdateStudent: (updates: Partial<Student>) => void;
  onSelectVehicle: (vehicleId: string) => void;
  lang: Language;
}

type MenuView = 'menu' | 'profile' | 'vans';

const PassengerMenu: React.FC<PassengerMenuProps> = ({
  student,
  vehicles,
  onUpdateStudent,
  onSelectVehicle,
  lang
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('menu');

  const handleViewChange = (view: MenuView) => {
    setCurrentView(view);
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentView('menu');
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-hextech-gold rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(195,167,88,0.5)] hover:bg-hextech-lightGold transition-all"
      >
        <Menu size={24} className="text-hextech-black" />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-hextech-black/90 backdrop-blur-sm">
          <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="bg-hextech-dark border-b border-hextech-gold/30 p-4 flex justify-between items-center">
              <h2 className="text-xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase">
                {currentView === 'menu' && 'Menu'}
                {currentView === 'profile' && (t('profile', lang) || 'Meu Perfil')}
                {currentView === 'vans' && (t('available_vehicles', lang) || 'Vans Disponíveis')}
              </h2>
              <button
                onClick={handleClose}
                className="text-hextech-gold hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {currentView === 'menu' && (
                <div className="h-full flex flex-col items-center justify-center p-6 space-y-4">
                  <button
                    onClick={() => handleViewChange('profile')}
                    className="w-full max-w-md bg-hextech-dark border-2 border-hextech-gold/30 p-6 hover:border-hextech-gold transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-hextech-gold/20 border-2 border-hextech-gold rounded-full flex items-center justify-center group-hover:bg-hextech-gold/30 transition-all">
                        <User size={32} className="text-hextech-gold" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl font-beaufort font-bold text-hextech-gold tracking-wider uppercase mb-1">
                          {t('profile', lang) || 'Meu Perfil'}
                        </h3>
                        <p className="text-sm text-hextech-gray/60">
                          Ver e editar suas informações
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleViewChange('vans')}
                    className="w-full max-w-md bg-hextech-dark border-2 border-hextech-gold/30 p-6 hover:border-hextech-gold transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-hextech-gold/20 border-2 border-hextech-gold rounded-full flex items-center justify-center group-hover:bg-hextech-gold/30 transition-all">
                        <Bus size={32} className="text-hextech-gold" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl font-beaufort font-bold text-hextech-gold tracking-wider uppercase mb-1">
                          {t('available_vehicles', lang) || 'Vans Disponíveis'}
                        </h3>
                        <p className="text-sm text-hextech-gray/60">
                          Escolher transporte e efetuar pagamento
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {currentView === 'profile' && (
                <div className="h-full">
                  <div className="p-4 border-b border-hextech-gold/10">
                    <button
                      onClick={() => setCurrentView('menu')}
                      className="text-hextech-gold hover:text-hextech-lightGold transition-colors text-sm font-beaufort uppercase tracking-wider"
                    >
                      ← Voltar
                    </button>
                  </div>
                  <StudentProfile
                    student={student}
                    onUpdate={onUpdateStudent}
                    lang={lang}
                  />
                </div>
              )}

              {currentView === 'vans' && (
                <div className="h-full">
                  <div className="p-4 border-b border-hextech-gold/10">
                    <button
                      onClick={() => setCurrentView('menu')}
                      className="text-hextech-gold hover:text-hextech-lightGold transition-colors text-sm font-beaufort uppercase tracking-wider"
                    >
                      ← Voltar
                    </button>
                  </div>
                  <VanList
                    vehicles={vehicles}
                    currentStudent={student}
                    onSelectVehicle={(vehicleId) => {
                      onSelectVehicle(vehicleId);
                      handleClose();
                    }}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PassengerMenu;

