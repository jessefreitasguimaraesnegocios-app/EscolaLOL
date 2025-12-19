import React, { useState, useRef, useEffect } from 'react';
import { Driver, Vehicle, Language } from '../types';
import { User, Camera, Phone, CreditCard, FileText, Save, X, MapPin, Bus, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { t } from '../services/i18n';

interface DriverProfileProps {
  driver: Driver;
  vehicle?: Vehicle;
  onUpdate?: (updates: Partial<Driver>) => void;
  onClose: () => void;
  lang: Language;
}

const DriverProfile: React.FC<DriverProfileProps> = ({ driver, vehicle, onUpdate, onClose, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(driver.name);
  const [email, setEmail] = useState(driver.email);
  const [phone, setPhone] = useState(driver.phone || '');
  const [licenseNumber, setLicenseNumber] = useState(driver.licenseNumber || '');
  const [photo, setPhoto] = useState((driver as any).photo || '');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);

  // Update local state when driver prop changes
  useEffect(() => {
    setName(driver.name);
    setEmail(driver.email);
    setPhone(driver.phone || '');
    setLicenseNumber(driver.licenseNumber || '');
    setPhoto((driver as any).photo || '');
  }, [driver]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({ name, email, phone, licenseNumber, photo });
    }
    setIsEditing(false);
    setShowPhotoMenu(false);
  };

  const handleCancel = () => {
    setName(driver.name);
    setEmail(driver.email);
    setPhone(driver.phone || '');
    setLicenseNumber(driver.licenseNumber || '');
    setPhoto((driver as any).photo || '');
    setIsEditing(false);
    setShowPhotoMenu(false);
  };

  const handlePhotoSelect = (source: 'gallery' | 'camera') => {
    setShowPhotoMenu(false);
    const input = source === 'gallery' ? fileInputRef.current : cameraInputRef.current;
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setPhoto(photoData); // Atualiza o estado local imediatamente
        if (onUpdate) {
          onUpdate({ photo: photoData });
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  // Close photo menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPhotoMenu && photoMenuRef.current && !photoMenuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        const photoCircle = target.closest('.photo-circle');
        if (!photoCircle) {
          setShowPhotoMenu(false);
        }
      }
    };

    if (showPhotoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhotoMenu]);

  return (
    <div className="fixed inset-0 z-[10000] bg-hextech-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-hextech-dark border border-hextech-gold w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(195,167,88,0.3)]">
        {/* Header */}
        <div className="p-6 border-b border-hextech-gold/20 flex justify-between items-center bg-hextech-black sticky top-0 z-10">
          <h2 className="text-2xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase">
            {t('profile', lang) || 'Meu Perfil'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-hextech-gold hover:text-white transition-colors p-2 hover:bg-hextech-gold/10 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div 
                className="photo-circle w-32 h-32 border-2 border-hextech-gold rounded-full flex items-center justify-center bg-hextech-black overflow-hidden cursor-pointer hover:border-hextech-gold/60 transition-all"
                onClick={() => {
                  if (isEditing) {
                    setShowPhotoMenu(!showPhotoMenu);
                  }
                }}
              >
                {photo ? (
                  <img src={photo} alt={driver.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User size={64} className="text-hextech-gold" />
                )}
              </div>
              
              {/* Photo Menu Dropdown */}
              {showPhotoMenu && isEditing && (
                <div 
                  ref={photoMenuRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-hextech-dark border border-hextech-gold/50 shadow-[0_0_20px_rgba(195,167,88,0.3)] min-w-[150px] z-[10001] rounded"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhotoSelect('gallery');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-hextech-black/40 border border-hextech-gold/20 text-hextech-gold hover:bg-hextech-gold/10 hover:border-hextech-gold transition-all text-xs font-beaufort tracking-widest rounded"
                    >
                      <ImageIcon size={14} />
                      <span>{lang === 'pt' ? 'Galeria' : 'Gallery'}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhotoSelect('camera');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-hextech-black/40 border border-hextech-gold/20 text-hextech-gold hover:bg-hextech-gold/10 hover:border-hextech-gold transition-all text-xs font-beaufort tracking-widest rounded"
                    >
                      <Camera size={14} />
                      <span>{lang === 'pt' ? 'Câmera' : 'Camera'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-beaufort font-bold text-hextech-gold tracking-widest uppercase">
                {driver.name}
              </h3>
              <p className="text-sm text-hextech-gray/60 uppercase tracking-wider mt-1">
                {t('driver', lang) || 'Motorista'}
              </p>
            </div>
          </div>

          {/* Driver Information */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-hextech-gold/80 font-beaufort tracking-widest uppercase mb-2 block">
                {t('name', lang) || 'Nome'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-hextech-black border border-hextech-gold/30 text-white px-4 py-2 focus:border-hextech-gold focus:outline-none"
                />
              ) : (
                <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2 text-white">
                  {driver.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-hextech-gold/80 font-beaufort tracking-widest uppercase mb-2 block">
                {t('email', lang) || 'Email'}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-hextech-black border border-hextech-gold/30 text-white px-4 py-2 focus:border-hextech-gold focus:outline-none"
                />
              ) : (
                <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2 text-white">
                  {driver.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs text-hextech-gold/80 font-beaufort tracking-widest uppercase mb-2 block">
                {t('phone', lang) || 'Telefone'}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-hextech-black border border-hextech-gold/30 text-white px-4 py-2 focus:border-hextech-gold focus:outline-none"
                />
              ) : (
                <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2 text-white flex items-center gap-2">
                  <Phone size={16} className="text-hextech-gold" />
                  {driver.phone || t('not_informed', lang) || 'Não informado'}
                </div>
              )}
            </div>

            {/* License Number */}
            <div>
              <label className="text-xs text-hextech-gold/80 font-beaufort tracking-widest uppercase mb-2 block">
                CNH
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-hextech-black border border-hextech-gold/30 text-white px-4 py-2 focus:border-hextech-gold focus:outline-none"
                />
              ) : (
                <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2 text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-hextech-gold" />
                  {driver.licenseNumber || t('not_informed', lang) || 'Não informado'}
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            {vehicle && (
              <div className="border-t border-hextech-gold/20 pt-4 mt-4">
                <h4 className="text-sm text-hextech-gold font-beaufort tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Bus size={16} />
                  {t('vehicle_id', lang) || 'Veículo'}
                </h4>
                <div className="space-y-2">
                  <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2">
                    <div className="text-xs text-hextech-gold/60 uppercase tracking-wider">
                      {t('vehicle_plate', lang) || 'Placa'}
                    </div>
                    <div className="text-white font-beaufort font-bold tracking-widest">
                      {vehicle.plateNumber}
                    </div>
                  </div>
                  <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2">
                    <div className="text-xs text-hextech-gold/60 uppercase tracking-wider">
                      {t('capacity', lang) || 'Capacidade'}
                    </div>
                    <div className="text-white font-beaufort">
                      {vehicle.currentPassengers} / {vehicle.capacity}
                    </div>
                  </div>
                  <div className="bg-hextech-black/40 border border-hextech-gold/20 px-4 py-2">
                    <div className="text-xs text-hextech-gold/60 uppercase tracking-wider">
                      {t('destination', lang) || 'Destino'}
                    </div>
                    <div className="text-white font-beaufort flex items-center gap-2">
                      <MapPin size={14} className="text-hextech-gold" />
                      {vehicle.destinationSchool}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-hextech-gold/20">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-hextech-black/40 border border-hextech-gold/20 text-hextech-gold hover:bg-hextech-gold/10 transition-all text-xs font-beaufort tracking-widest uppercase"
                >
                  {t('cancel', lang) || 'Cancelar'}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-hextech-gold text-hextech-black hover:bg-hextech-gold/80 transition-all text-xs font-beaufort tracking-widest uppercase font-bold flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  {t('save_changes', lang) || 'Salvar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-hextech-gold text-hextech-black hover:bg-hextech-gold/80 transition-all text-xs font-beaufort tracking-widest uppercase font-bold flex items-center justify-center gap-2"
              >
                <FileText size={14} />
                {t('edit', lang) || 'Editar Perfil'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;

