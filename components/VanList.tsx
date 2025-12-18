import React, { useState } from 'react';
import { Vehicle, Student, Language } from '../types';
import { Bus, MapPin, Users, DollarSign, User, CheckCircle, CreditCard, X } from 'lucide-react';
import { t } from '../services/i18n';
import { notificationService } from '../services/notificationService';

interface VanListProps {
  vehicles: Vehicle[];
  currentStudent: Student;
  onSelectVehicle: (vehicleId: string) => void;
  lang: Language;
}

interface VanDetailModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onRequestTransport: (vehicleId: string) => void;
  lang: Language;
}

const VanDetailModal: React.FC<VanDetailModalProps> = ({ vehicle, onClose, onRequestTransport, lang }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | null>(null);

  const handleRequest = () => {
    if (!paymentMethod) {
      setShowPayment(true);
      return;
    }
    onRequestTransport(vehicle.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-hextech-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-hextech-dark border-2 border-hextech-gold/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-1">
          <div className="bg-hextech-black/90 border border-hextech-gold/30 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase mb-2">
                  {vehicle.plateNumber}
                </h3>
                <div className="flex items-center gap-2 text-hextech-gray">
                  <span className="bg-hextech-blue/20 border border-hextech-blue px-2 py-1 text-xs font-beaufort uppercase">
                    {vehicle.type}
                  </span>
                  <span>•</span>
                  <span className="text-sm">{vehicle.driverName}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-hextech-gold hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Photo */}
            <div className="mb-6">
              <div className="w-full h-48 bg-hextech-black border border-hextech-gold/30 flex items-center justify-center overflow-hidden">
                {vehicle.photo ? (
                  <img src={vehicle.photo} alt={vehicle.plateNumber} className="w-full h-full object-cover" />
                ) : (
                  <Bus size={80} className="text-hextech-gold/30" />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-hextech-black/40 border border-hextech-gold/20 p-4">
                <div className="flex items-center gap-2 text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                  <MapPin size={14} />
                  Destinos
                </div>
                <div className="text-white font-spiegel">
                  {vehicle.destinations && vehicle.destinations.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {vehicle.destinations.map((dest, idx) => (
                        <li key={idx}>{dest}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>{vehicle.destinationSchool}</span>
                  )}
                </div>
              </div>

              <div className="bg-hextech-black/40 border border-hextech-gold/20 p-4">
                <div className="flex items-center gap-2 text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                  <Users size={14} />
                  Capacidade
                </div>
                <div className="text-white font-spiegel">
                  {vehicle.currentPassengers} / {vehicle.capacity} passageiros
                </div>
              </div>

              {vehicle.price && (
                <div className="bg-hextech-black/40 border border-hextech-gold/20 p-4">
                  <div className="flex items-center gap-2 text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    <DollarSign size={14} />
                    Valor Mensal
                  </div>
                  <div className="text-white font-beaufort text-2xl font-bold">
                    R$ {vehicle.price.toFixed(2)}
                  </div>
                </div>
              )}

              <div className="bg-hextech-black/40 border border-hextech-gold/20 p-4">
                <div className="flex items-center gap-2 text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                  <User size={14} />
                  Equipe
                </div>
                <div className="text-white font-spiegel space-y-1">
                  <div>Motorista: {vehicle.driverName}</div>
                  {vehicle.assistants && vehicle.assistants.length > 0 && (
                    <div>
                      Auxiliares:
                      <ul className="list-disc list-inside ml-4">
                        {vehicle.assistants.map((assistant, idx) => (
                          <li key={idx}>{assistant}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            {showPayment && (
              <div className="mb-6 bg-hextech-black/60 border border-hextech-gold/30 p-4">
                <h4 className="text-hextech-gold font-beaufort text-sm uppercase tracking-widest mb-4">
                  Método de Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded transition-all ${
                      paymentMethod === 'card'
                        ? 'border-hextech-gold bg-hextech-gold/20'
                        : 'border-hextech-gold/30 hover:border-hextech-gold/50'
                    }`}
                  >
                    <CreditCard size={24} className="text-hextech-gold mx-auto mb-2" />
                    <div className="text-white text-xs font-beaufort uppercase">Cartão</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 border-2 rounded transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-hextech-gold bg-hextech-gold/20'
                        : 'border-hextech-gold/30 hover:border-hextech-gold/50'
                    }`}
                  >
                    <div className="text-hextech-gold text-2xl font-bold mb-2">PIX</div>
                    <div className="text-white text-xs font-beaufort uppercase">Instantâneo</div>
                  </button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleRequest}
              className="w-full hextech-button-primary py-4 text-sm font-beaufort uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {showPayment && paymentMethod ? 'Confirmar Pagamento' : 'Ser Meu Transporte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VanList: React.FC<VanListProps> = ({ vehicles, currentStudent, onSelectVehicle, lang }) => {
  const [selectedVan, setSelectedVan] = useState<Vehicle | null>(null);

  const handleRequestTransport = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      // Simular pagamento processado
      console.log('✅ Pagamento processado para veículo:', vehicleId);
      
      // Enviar notificação para a van
      notificationService.notifyVehicleRequest(currentStudent, vehicle);
      
      // Atribuir veículo ao estudante
      onSelectVehicle(vehicleId);
    }
  };

  return (
    <div className="h-full bg-hextech-black overflow-y-auto">
      <div className="bg-hextech-dark border-b border-hextech-gold/30 p-6">
        <h2 className="text-2xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase">
          {t('available_vehicles', lang) || 'Vans Disponíveis'}
        </h2>
        <p className="text-hextech-gray/60 text-sm mt-2">
          Escolha seu transporte escolar
        </p>
      </div>

      <div className="p-4 space-y-4">
        {vehicles.length === 0 ? (
          <div className="text-center py-12 text-hextech-gray/60">
            <Bus size={48} className="mx-auto mb-4 text-hextech-gold/30" />
            <p>Nenhuma van disponível no momento</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-hextech-dark border border-hextech-gold/20 p-4 hover:border-hextech-gold/40 transition-all cursor-pointer"
              onClick={() => setSelectedVan(vehicle)}
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-hextech-black border border-hextech-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {vehicle.photo ? (
                    <img src={vehicle.photo} alt={vehicle.plateNumber} className="w-full h-full object-cover" />
                  ) : (
                    <Bus size={40} className="text-hextech-gold/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-beaufort font-bold text-hextech-gold tracking-wider uppercase">
                        {vehicle.plateNumber}
                      </h3>
                      <p className="text-sm text-hextech-gray">{vehicle.driverName}</p>
                    </div>
                    {vehicle.price && (
                      <div className="text-right">
                        <div className="text-xs text-hextech-gray/60 uppercase">Mensal</div>
                        <div className="text-hextech-gold font-beaufort font-bold">
                          R$ {vehicle.price.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-hextech-gray/60 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {vehicle.destinationSchool}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {vehicle.currentPassengers}/{vehicle.capacity}
                    </span>
                  </div>
                  <div className="text-xs text-hextech-gold/80 font-beaufort uppercase tracking-wider">
                    {vehicle.type} • {vehicle.destinations?.length || 1} destino(s)
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Van Detail Modal */}
      {selectedVan && (
        <VanDetailModal
          vehicle={selectedVan}
          onClose={() => setSelectedVan(null)}
          onRequestTransport={handleRequestTransport}
          lang={lang}
        />
      )}
    </div>
  );
};

export default VanList;

