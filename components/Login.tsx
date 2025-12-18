import React, { useState } from 'react';
import { UserRole, Language } from '../types';
import { authService } from '../services/authService';
import { t } from '../services/i18n';
import { Bus, User, ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToRegister: () => void;
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hextech-radial flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hextech-gold to-transparent opacity-30"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
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
            {t('login_title', lang) || 'Acesse sua conta'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-hextech-dark/90 border-2 border-hextech-gold/50 p-1 shadow-[0_0_40px_rgba(195,167,88,0.3)]">
          <div className="bg-hextech-black/90 border border-hextech-gold/30 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                  {t('email', lang) || 'Email'}
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
                  {t('password', lang) || 'Senha'}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hextech-gold/60" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-hextech-dark border border-hextech-gold/30 px-12 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full hextech-button-primary py-4 text-sm font-beaufort uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : t('login', lang) || 'Entrar'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-hextech-gray text-sm mb-2">
                {t('no_account', lang) || 'Não tem uma conta?'}
              </p>
              <button
                onClick={onSwitchToRegister}
                className="text-hextech-gold font-beaufort text-sm uppercase tracking-widest hover:text-hextech-lightGold transition-colors underline"
              >
                {t('register', lang) || 'Cadastre-se'}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Accounts Info */}
        <div className="mt-6 text-center">
          <p className="text-hextech-gray/60 text-xs uppercase tracking-widest mb-2">
            Contas de teste:
          </p>
          <div className="space-y-1 text-hextech-gray/80 text-xs font-spiegel">
            <p>Motorista: motorista@escolapool.com / 123456</p>
            <p>Estudante: estudante@escolapool.com / 123456</p>
            <p>Diretor: diretor@escolapool.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

