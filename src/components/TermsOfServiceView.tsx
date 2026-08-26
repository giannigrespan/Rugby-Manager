import React from 'react';
import { FileText, ArrowLeft, Shield, CheckCircle2, Scale, Users, AlertCircle, HelpCircle } from 'lucide-react';

interface TermsOfServiceViewProps {
  onBack?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Navigation / Breadcrumb */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-[#2A2A2E] transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            <span>Torna all'Applicazione</span>
          </button>

          <span className="text-xs text-gray-500">
            Ultimo aggiornamento: 26 Agosto 2026
          </span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#E0E0E1] font-serif">
              Termini e Condizioni di Utilizzo
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Rugby Villorba Team Manager • Piattaforma Gestionale Tecnica e Sanitaria
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          I presenti Termini di Utilizzo disciplinano l'accesso e l'uso dell'applicazione <strong className="text-white">Rugby Villorba Team Manager</strong> da parte di tesserate, allenatori, staff medico, preparatori atletici e dirigenti societari. Accedendo all'applicazione, l'utente accetta integralmente i seguenti termini.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        
        {/* 1. Oggetto del Servizio */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>1. Oggetto del Servizio e Finalità Sportiva</span>
          </h2>
          <p>
            <strong>Rugby Villorba Team Manager</strong> è una piattaforma web dedicata alla gestione tecnica, atletica, organizzativa e sanitaria del club sportivo Rugby Villorba (Serie A Elite Femminile). 
          </p>
          <p>
            Le funzionalità offerte includono:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
            <li>Rilevazione presenze e appello per sessioni di allenamento, riunioni e partite.</li>
            <li>Monitoraggio del carico di lavoro atletico soggettivo (sRPE / RPE) e focus tattico pre/post gara.</li>
            <li>Cartelle cliniche fisioterapiche riservate e gestione protocolli infortuni / World Rugby HIA.</li>
            <li>Programmi di allenamento individuale, mobilità e tracking specialistico calci piazzati.</li>
            <li>Assegnazione compiti video-analisi e comunicazioni di squadra.</li>
          </ul>
        </section>

        {/* 2. Account, Accesso e Sicurezza */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>2. Account, Credenziali e Responsabilità dell'Utente</span>
          </h2>
          <p>
            L'accesso alla piattaforma è riservato ai soli soggetti autorizzati dalla direzione sportiva. L'utente si impegna a:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-300">
            <li>Custodire con diligenza le proprie credenziali e non cederle a terzi non autorizzati.</li>
            <li>Fornire informazioni veritiere, accurate e tempestive circa il proprio stato fisico (infortuni, fastidi, carichi).</li>
            <li>Non utilizzare la piattaforma per scopi contrari alla legge, ai regolamenti FIR o alla deontologia sportiva.</li>
          </ul>
        </section>

        {/* 3. Integrazione con Google Workspace e Servizi Cloud */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>3. Integrazione con Google Workspace e Servizi Terzi</span>
          </h2>
          <p>
            L'applicazione offre la possibilità di collegare account Google (Google Sheets e Google Calendar) tramite autenticazione sicura OAuth 2.0. L'autorizzazione può essere revocata dall'utente in qualsiasi momento direttamente dalla pagina del proprio account Google.
          </p>
          <p>
            L'elaborazione dei dati rispetta le relative norme di utilizzo stabilite da Google Inc. e le policy di sicurezza di Firebase Cloud.
          </p>
        </section>

        {/* 4. Dati Sanitari e Disclaimer Medico-Sportivo */}
        <section className="bg-[#121214] border border-amber-500/30 rounded-xl p-6 space-y-3 bg-amber-950/10">
          <h2 className="text-base font-bold text-amber-300 font-serif flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>4. Protocolli Sanitari e Disclaimer Medico</span>
          </h2>
          <p className="text-gray-300">
            Le sezioni dedicate a infortuni, RPE e note fisioterapiche sono strumenti di supporto organizzativo per il team medico e tecnico del club.
          </p>
          <p className="text-gray-300">
            L'applicazione <strong>non sostituisce in alcun modo una diagnosi medica formale</strong> né il giudizio clinico dei medici sportivi abilitati. Le decisioni relative all'idoneità agonistica e al protocollo HIA (Head Injury Assessment) restano di esclusiva competenza del personale medico preposto ai sensi dei regolamenti federali.
          </p>
        </section>

        {/* 5. Proprietà Intellettuale e Riservatezza */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>5. Riservatezza dei Dati Tattici e Sportivi</span>
          </h2>
          <p>
            Tutti i dati tattici, le video-analisi, i piani di gioco e le valutazioni individuali archiviati nella piattaforma costituiscono materiale riservato ad uso esclusivo del club sportivo Rugby Villorba e non possono essere diffusi o pubblicati senza espressa autorizzazione.
          </p>
        </section>

        {/* 6. Modifiche ai Termini e Contatti */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>6. Modifiche ai Termini e Contatti</span>
          </h2>
          <p>
            Il gestore dell'applicazione si riserva il diritto di aggiornare periodicamente i presenti termini per adeguarli all'evoluzione normativa o tecnica della piattaforma.
          </p>
          <div className="bg-[#1D1D21] p-4 rounded-lg border border-[#2A2A2E] text-gray-300 space-y-1 font-mono text-xs">
            <p><strong className="text-white">Responsabile del Trattamento / Assistenza:</strong> Alberto Tonetto</p>
            <p><strong className="text-white">Email:</strong> <a href="mailto:alberto.tonetto@gmail.com" className="text-[#D4AF37] hover:underline">alberto.tonetto@gmail.com</a></p>
            <p><strong className="text-white">Club:</strong> Rugby Villorba (Serie A Elite Femminile)</p>
          </div>
        </section>

      </div>

      {/* Footer Back Button */}
      {onBack && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
          >
            Torna all'Applicazione
          </button>
        </div>
      )}

    </div>
  );
};
