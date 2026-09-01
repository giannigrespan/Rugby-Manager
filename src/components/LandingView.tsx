import React from 'react';
import { LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { VillorbaLogo } from './VillorbaLogo';
import { useAuth } from '../context/AuthContext';

interface LandingViewProps {
  onOpenAuth: () => void;
  onEnterAsGuest: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenAuth,
  onEnterAsGuest,
  onOpenPrivacy,
  onOpenTerms
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E1] flex flex-col font-sans relative overflow-hidden">
      {/* Ambient gold glow accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 relative z-10">
        {/* Brand Badge (mirrors the official Villorba Rugby crest) */}
        <VillorbaLogo variant="badge" size="xl" showSubtitle={true} className="shadow-2xl shadow-black/60" />

        {/* Headline */}
        <div className="mt-10 text-center max-w-xl">
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#E0E0E1] tracking-tight">
            Rugby Villorba Team Manager
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-400 leading-relaxed">
            La piattaforma tecnica dello staff e delle atlete: presenze, carichi, infortuni,
            sessioni e comunicazioni di squadra in un unico posto.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mt-10 w-full max-w-sm flex flex-col gap-3">
          {currentUser ? (
            <button
              id="btn-landing-enter"
              onClick={onEnterAsGuest}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10 transition-all active:scale-95"
            >
              <span>Entra nella piattaforma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                id="btn-landing-login"
                onClick={onOpenAuth}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Accedi o Registrati</span>
              </button>

              <button
                id="btn-landing-guest"
                onClick={onEnterAsGuest}
                className="w-full py-3 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white text-sm font-semibold rounded-xl border border-[#2A2A2E] flex items-center justify-center gap-2 transition-colors"
              >
                <span>Continua come ospite</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Accesso riservato allo staff tecnico e alla rosa atlete registrate</span>
        </div>
      </main>

      {/* Footer with Legal Links */}
      <footer className="border-t border-[#2A2A2E] bg-[#121214]/60 py-4 px-6 text-xs text-gray-400 relative z-10">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-center gap-3">
          <span className="font-bold text-[#E0E0E1] tracking-tight">RUGBY VILLORBA TEAM MANAGER</span>
          <span className="text-[#D4AF37]">•</span>
          <span className="text-gray-400">Serie A Elite Femminile</span>
          <span className="hidden sm:inline">•</span>
          <button onClick={onOpenPrivacy} className="hover:text-[#D4AF37] transition-colors">
            Norme sulla Privacy
          </button>
          <span>•</span>
          <button onClick={onOpenTerms} className="hover:text-[#D4AF37] transition-colors">
            Termini di Servizio
          </button>
        </div>
      </footer>
    </div>
  );
};
