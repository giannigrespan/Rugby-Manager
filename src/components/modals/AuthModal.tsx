import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Check, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { VillorbaLogo } from '../VillorbaLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    logout
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name || 'Atleta', 'player');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'accesso con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        
        {/* Brand Banner in Modal */}
        <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-4">
          <VillorbaLogo size="md" colorMode="gold" showSubtitle={true} />
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1D1D21] transition-colors">✕</button>
        </div>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center font-bold flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[#E0E0E1] font-bold text-sm sm:text-base font-serif">
              {currentUser ? 'Gestione Account Utente' : (mode === 'login' ? 'Accesso Piattaforma Squadra' : 'Registrazione Nuova Atleta')}
            </h3>
            <p className="text-[11px] text-gray-400">Autenticazione Cloud Supabase & Google</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4 text-xs">
            <div className="bg-[#1D1D21] border border-[#2A2A2E] p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold text-base">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-[#E0E0E1] font-bold text-sm font-serif">{currentUser.name}</h4>
                  <p className="text-gray-400">{currentUser.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2A2A2E] flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Ruolo Attuale:</span>
                <span className="font-bold text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => { logout(); onClose(); }}
                className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg font-bold transition-all"
              >
                Disconnetti Account
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg border border-[#2A2A2E]"
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Accedi con Google</span>
            </button>

            <div className="flex items-center gap-2 text-gray-500 my-2">
              <div className="h-px bg-[#2A2A2E] flex-1"></div>
              <span className="text-[10px] uppercase font-bold">oppure email e password</span>
              <div className="h-px bg-[#2A2A2E] flex-1"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Nome e Cognome:</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Laura Rossi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Email:</label>
                <input
                  type="email"
                  required
                  placeholder="coach@rugbyteam.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Password:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>{mode === 'login' ? 'Accedi con Credenziali' : 'Registra Account'}</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-[#D4AF37] hover:text-[#C09F30] font-semibold"
              >
                {mode === 'login' ? 'Non hai un account? Registrati qui' : 'Hai già un account? Clicca per accedere'}
              </button>
            </div>

            {/* Privacy Policy & Terms Link in Auth Modal */}
            <p className="text-[10px] text-gray-500 text-center pt-2 leading-relaxed border-t border-[#2A2A2E]">
              Accedendo, accetti i nostri{' '}
              <a href="?page=terms" target="_blank" rel="noreferrer" className="text-[#D4AF37] underline hover:text-[#C09F30]">
                Termini di Servizio
              </a>{' '}
              e confermi di aver letto la{' '}
              <a href="?page=privacy" target="_blank" rel="noreferrer" className="text-[#D4AF37] underline hover:text-[#C09F30]">
                Privacy Policy
              </a>.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
