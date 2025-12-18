import React, { useState } from 'react';
import { UserRole, Language, Coordinates } from '../types';
import { authService } from '../services/authService';
import { t } from '../services/i18n';
import { Bus, User, ShieldCheck, Mail, Lock, AlertCircle, CheckCircle, MapPin, Phone, CreditCard, FileText, School } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

interface RegisterProps {
  onRegisterSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
  lang: Language;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin, lang }) => {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    cpf: '',
    address: '',
    licenseNumber: '',
    schoolName: '',
    parentPhone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get GPS location for students
  const { location: gpsLocation } = useGeolocation(selectedRole === UserRole.PASSENGER);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('form');
    setError('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (selectedRole === UserRole.DRIVER && !formData.licenseNumber) {
      setError('Número da CNH é obrigatório para motoristas');
      return;
    }

    if (selectedRole === UserRole.PASSENGER && !formData.address) {
      setError('Endereço é obrigatório para estudantes');
      return;
    }

    setLoading(true);

    try {
      const additionalData: any = {
        phone: formData.phone,
        cpf: formData.cpf
      };

      if (selectedRole === UserRole.DRIVER) {
        additionalData.licenseNumber = formData.licenseNumber;
      }

      if (selectedRole === UserRole.PASSENGER) {
        additionalData.address = formData.address;
        additionalData.location = gpsLocation || { lat: -23.5614, lng: -46.6565 };
        additionalData.parentPhone = formData.parentPhone;
      }

      if (selectedRole === UserRole.ADMIN) {
        additionalData.schoolName = formData.schoolName;
      }

      const result = await authService.register(
        formData.email,
        formData.password,
        formData.name,
        selectedRole!,
        additionalData
      );

      if (result.success && result.user) {
        onRegisterSuccess(result.user);
      } else {
        setError(result.error || 'Erro ao criar conta');
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-hextech-radial flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30" />

        <div className="w-full max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block p-1 border border-hextech-gold mb-6 shadow-[0_0_20px_rgba(195,167,88,0.2)]">
              <div className="bg-hextech-dark p-6 border border-hextech-gold/40">
                <Bus size={48} className="text-hextech-gold mx-auto" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-beaufort font-bold tracking-[0.2em] text-hextech-gold title-glow uppercase mb-2">
              SchoolPool
            </h1>
            <div className="h-px w-24 bg-hextech-gold mx-auto mb-4"></div>
            <p className="text-hextech-gray font-spiegel text-sm uppercase tracking-widest opacity-80">
              {t('register_title', lang) || 'Crie sua conta'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { role: UserRole.DRIVER, icon: Bus, title: 'Motorista', desc: 'Transporte estudantes com segurança' },
              { role: UserRole.PASSENGER, icon: User, title: 'Estudante', desc: 'Solicite transporte escolar' },
              { role: UserRole.ADMIN, icon: ShieldCheck, title: 'Diretor', desc: 'Gerencie a frota escolar' }
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => handleRoleSelect(item.role)}
                className="group relative bg-hextech-dark/80 border border-hextech-gold/20 p-1 hover:border-hextech-gold transition-all duration-300"
              >
                <div className="border border-hextech-gold/10 p-8 flex flex-col items-center text-center h-full group-hover:bg-hextech-gold/5">
                  <div className="mb-6 p-4 rounded-full border border-hextech-gold/30 group-hover:border-hextech-gold transition-all">
                    <item.icon className="text-hextech-gold" size={40} />
                  </div>
                  <h3 className="text-2xl font-beaufort font-bold text-hextech-gold mb-3 uppercase tracking-hextech">
                    {item.title}
                  </h3>
                  <p className="text-sm text-hextech-gray font-spiegel uppercase tracking-wider opacity-60 mb-6">
                    {item.desc}
                  </p>
                  <div className="w-full">
                    <div className="h-10 flex items-center justify-center font-beaufort text-sm uppercase tracking-hextech border bg-hextech-blue border-hextech-buttonBlue text-white">
                      Selecionar
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-hextech-gold font-beaufort text-sm uppercase tracking-widest hover:text-hextech-lightGold transition-colors underline"
            >
              Já tem uma conta? Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hextech-radial flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-beaufort font-bold tracking-[0.2em] text-hextech-gold title-glow uppercase mb-2">
            {selectedRole === UserRole.DRIVER && 'Cadastro de Motorista'}
            {selectedRole === UserRole.PASSENGER && 'Cadastro de Estudante'}
            {selectedRole === UserRole.ADMIN && 'Cadastro de Diretor'}
          </h2>
          <div className="h-px w-24 bg-hextech-gold mx-auto"></div>
        </div>

        <div className="bg-hextech-dark/90 border-2 border-hextech-gold/50 p-1 shadow-[0_0_40px_rgba(195,167,88,0.3)]">
          <div className="bg-hextech-black/90 border border-hextech-gold/30 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full bg-hextech-dark border border-hextech-gold/30 px-4 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="Confirme sua senha"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    CPF
                  </label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              {/* Role-specific Fields */}
              {selectedRole === UserRole.DRIVER && (
                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Número da CNH *
                  </label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      required
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="00000000000"
                    />
                  </div>
                </div>
              )}

              {selectedRole === UserRole.PASSENGER && (
                <>
                  <div>
                    <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                      Endereço *
                    </label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required
                        className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                        placeholder="Rua, número, bairro"
                      />
                    </div>
                    {gpsLocation && (
                      <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle size={12} /> Localização GPS capturada automaticamente
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                      Telefone do Responsável
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                      <input
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                        className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedRole === UserRole.ADMIN && (
                <div>
                  <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                    Nome da Escola
                  </label>
                  <div className="relative">
                    <School size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                      placeholder="Nome da instituição"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="flex-1 bg-hextech-dark border border-hextech-gold/30 text-hextech-gold py-3 font-beaufort text-sm uppercase tracking-widest hover:border-hextech-gold transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hextech-button-primary py-3 text-sm font-beaufort uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={onSwitchToLogin}
                className="text-hextech-gold font-beaufort text-sm uppercase tracking-widest hover:text-hextech-lightGold transition-colors underline"
              >
                Já tem uma conta? Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

