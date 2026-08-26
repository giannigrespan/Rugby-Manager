import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { 
  CalendarSync, 
  Calendar, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  ShieldCheck 
} from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({ isOpen, onClose }) => {
  const { sessions, exportToIcsFile, generateGoogleCalendarUrl } = useData();
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const nextSession = sessions.find(s => s.status === 'scheduled') || sessions[0];
  const nextSessionGoogleUrl = nextSession ? generateGoogleCalendarUrl(nextSession) : '#';

  const copyWebcalLink = () => {
    const webcal = `webcal://${window.location.host}/api/calendar/rugby-sessions.ics`;
    navigator.clipboard.writeText(webcal);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center font-bold">
              <CalendarSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif">Sincronizzazione Calendari Esterni</h3>
              <p className="text-xs text-gray-400">Google Calendar, Apple iCal, Microsoft Outlook</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>

        {/* Options */}
        <div className="space-y-3 text-xs">
          
          {/* Direct .ICS Export */}
          <div className="bg-[#1D1D21] border border-[#2A2A2E] p-4 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-bold text-[#E0E0E1] font-serif">Download File Calendario (.ICS)</span>
              </div>
              <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded-full font-bold">
                {sessions.length} Eventi
              </span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Scarica il pacchetto universale compatibile con Apple Calendar su iPhone/Mac, Google Calendar e Outlook.
            </p>
            <button
              onClick={() => exportToIcsFile(sessions)}
              className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Scarica Calendario Rugby (.ics)</span>
            </button>
          </div>

          {/* Google Calendar Direct Sync for Upcoming Session */}
          {nextSession && (
            <div className="bg-[#1D1D21] border border-[#2A2A2E] p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-[#E0E0E1] font-serif">Prossimo Allenamento su Google Calendar</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{nextSession.date}</span>
              </div>
              <p className="text-gray-400 text-[11px]">
                Aggiungi istantaneamente <strong className="text-[#E0E0E1]">"{nextSession.title}"</strong> con orari, campo e focus tattico al tuo account Google personale.
              </p>
              <a
                href={nextSessionGoogleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Apri e Salva in Google Calendar</span>
              </a>
            </div>
          )}

          {/* Live Subscription URL */}
          <div className="bg-[#1D1D21] border border-[#2A2A2E] p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-bold text-[#E0E0E1] font-serif">URL Feed Calendario (Sottoscrizione Live)</span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Incolla questo link nella sezione "Iscriviti a Calendario" del tuo smartphone per aggiornamenti automatici delle sessioni.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`webcal://${typeof window !== 'undefined' ? window.location.host : 'app.rugby.it'}/calendar.ics`}
                className="w-full px-3 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-gray-300 font-mono text-[11px]"
              />
              <button
                onClick={copyWebcalLink}
                className="px-3 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg flex items-center gap-1 shrink-0"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'Copiato' : 'Copia'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2A2A2E]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg text-xs border border-[#2A2A2E]"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
