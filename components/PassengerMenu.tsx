import React, { useState } from 'react';
import { Student, Vehicle, Language } from '../types';
import { User, Bus, Menu, X, LogOut } from 'lucide-react';
import StudentProfile from './StudentProfile';
import VanList from './VanList';
import { t } from '../services/i18n';

interface PassengerMenuProps {
  student: Student;
  vehicles: Vehicle[];
  onUpdateStudent: (updates: Partial<Student>) => void;
  onSelectVehicle: (vehicleId: string) => void;
  lang: Language;
  showButton?: boolean; // Control whether to show the floating button
  isOpen?: boolean; // Control menu open state externally
  onClose?: () => void; // Callback when menu closes
  onLogout?: () => void; // Callback for logout
}

type MenuView = 'menu' | 'profile' | 'vans';

const PassengerMenu: React.FC<PassengerMenuProps> = ({
  student,
  vehicles,
  onUpdateStudent,
  onSelectVehicle,
  lang,
  showButton = true,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onLogout
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('menu');
  const [showProfileFullscreen, setShowProfileFullscreen] = useState(false);
  const [showVansFullscreen, setShowVansFullscreen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleViewChange = (view: MenuView) => {
    setCurrentView(view);
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setCurrentView('menu');
    setShowProfileFullscreen(false);
    setShowVansFullscreen(false);
  };

  const handleOpenProfile = () => {
    handleClose();
    setShowProfileFullscreen(true);
  };

  const handleOpenVans = () => {
    handleClose();
    setShowVansFullscreen(true);
  };

  return (
    <>
      {/* Menu Button - Only show if showButton is true */}
      {showButton && (
        <button
          onClick={() => {
            if (externalIsOpen === undefined) {
              setInternalIsOpen(true);
            } else if (externalOnClose) {
              // If externally controlled, we can't open it from here
              // This button shouldn't be shown when externally controlled
            }
          }}
          className="fixed top-6 right-6 z-50 w-16 h-16 bg-hextech-gold rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(195,167,88,0.5)] hover:bg-hextech-lightGold transition-all"
        >
          <Menu size={24} className="text-hextech-black" />
        </button>
      )}

      {/* Profile Fullscreen */}
      {showProfileFullscreen && (
        <div className="fixed inset-0 z-[10001] bg-hextech-black backdrop-blur-sm">
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                <button
                  onClick={() => setShowProfileFullscreen(false)}
                  className="absolute top-4 right-4 z-10 text-hextech-gold hover:text-white transition-colors bg-hextech-dark/90 border border-hextech-gold/30 p-2 rounded"
                >
                  <X size={24} />
                </button>
                <StudentProfile
                  student={student}
                  onUpdate={onUpdateStudent}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vans Fullscreen */}
      {showVansFullscreen && (
        <div className="fixed inset-0 z-[10001] bg-hextech-black backdrop-blur-sm">
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                <button
                  onClick={() => setShowVansFullscreen(false)}
                  className="absolute top-4 right-4 z-10 text-hextech-gold hover:text-white transition-colors bg-hextech-dark/90 border border-hextech-gold/30 p-2 rounded"
                >
                  <X size={24} />
                </button>
                <VanList
                  vehicles={vehicles}
                  currentStudent={student}
                  onSelectVehicle={(vehicleId) => {
                    onSelectVehicle(vehicleId);
                    setShowVansFullscreen(false);
                  }}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Overlay - Only show if no fullscreen views are open */}
      {isOpen && !showProfileFullscreen && !showVansFullscreen && (
        <div className="fixed inset-0 z-[10000] bg-hextech-black/90 backdrop-blur-sm">
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
                    onClick={handleOpenProfile}
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
                    onClick={handleOpenVans}
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

                  {/* Logout Button */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        handleClose();
                        onLogout();
                      }}
                      className="w-full max-w-md bg-hextech-dark border-2 border-red-500/30 p-6 hover:border-red-500 transition-all group mt-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-all">
                          <LogOut size={32} className="text-red-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-beaufort font-bold text-red-500 tracking-wider uppercase mb-1">
                            {t('logout', lang) || 'Sair'}
                          </h3>
                          <p className="text-sm text-hextech-gray/60">
                            {lang === 'pt' ? 'Sair da sua conta' : 'Log out of your account'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
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



