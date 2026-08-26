import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, FileText, Globe, Mail, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
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
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#E0E0E1] font-serif">
              Informativa sulle Norme di Privacy
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Rugby Villorba Team Manager • Conforme a GDPR (UE 2016/679) e Google API Services User Data Policy
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          La presente Informativa sulla Privacy descrive le modalità con cui l'applicazione <strong className="text-white">Rugby Villorba Team Manager</strong> raccoglie, utilizza, conserva e protegge le informazioni personali di atlete, staff tecnico, staff sanitario e dirigenti sportivi, nonché l'interazione con i servizi autorizzati di Google (Google Sheets, Google Calendar, Google Auth).
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        
        {/* 1. Titolare del Trattamento */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>1. Titolare del Trattamento dei Dati</span>
          </h2>
          <p>
            Il Titolare del Trattamento per l'applicazione <strong>Rugby Villorba Team Manager</strong> è:
          </p>
          <div className="bg-[#1D1D21] p-4 rounded-lg border border-[#2A2A2E] text-gray-300 space-y-1 font-mono text-xs">
            <p><strong className="text-white">Titolare / Responsabile del Trattamento:</strong> Alberto Tonetto</p>
            <p><strong className="text-white">Organizzazione Sportiva:</strong> Rugby Villorba (Serie A Elite Femminile)</p>
            <p><strong className="text-white">Email di Contatto Privacy / DPO:</strong> <a href="mailto:alberto.tonetto@gmail.com" className="text-[#D4AF37] hover:underline">alberto.tonetto@gmail.com</a></p>
            <p><strong className="text-white">Sede Operativa:</strong> Villorba (Treviso), Italia</p>
          </div>
        </section>

        {/* 2. Dati Raccolti */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>2. Tipologie di Dati Raccolti e Trattati</span>
          </h2>
          <p>L'applicazione raccoglie esclusivamente i dati necessari per la gestione tecnica e sanitaria della squadra:</p>
          
          <ul className="list-disc list-inside space-y-2 pl-2 text-gray-300">
            <li>
              <strong className="text-white">Dati Identificativi e di Contatto:</strong> Nome, cognome, indirizzo email, recapito telefonico, ruolo in campo, numero di maglia e data di nascita.
            </li>
            <li>
              <strong className="text-white">Dati Prestazionali e di Presenza:</strong> Registro presenze ad allenamenti e gare, feedback RPE (Rate of Perceived Exertion), durata sessioni, statistiche calci piazzati, compiti tecnici e carichi di lavoro.
            </li>
            <li>
              <strong className="text-white">Dati Sanitari e Idoneità Sportiva (Art. 9 GDPR):</strong> Scadenza del certificato medico agonistico, note fisioterapiche riservate, segnalazioni infortuni/fastidi e protocolli sanitari World Rugby HIA (Head Injury Assessment). Tali dati sono accessibili esclusivamente allo staff medico autorizzato e al preparatore.
            </li>
            <li>
              <strong className="text-white">Dati di Autenticazione:</strong> Identificativi account Google (OAuth 2.0) e token di sessione Firebase crittografati.
            </li>
          </ul>
        </section>

        {/* 3. Google API Services User Data Policy */}
        <section className="bg-[#121214] border border-[#D4AF37]/40 rounded-xl p-6 space-y-3 bg-gradient-to-b from-[#121214] to-[#1A1810]">
          <h2 className="text-base font-bold text-[#D4AF37] font-serif flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#D4AF37]" />
            <span>3. Conformità alle Norme sui Dati Utente delle API di Google</span>
          </h2>
          <p className="text-gray-300">
            L'applicazione Rugby Villorba Team Manager utilizza i servizi Google OAuth per le sole seguenti funzionalità esplicitamente autorizzate dall'utente:
          </p>
          
          <div className="space-y-2 pl-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p><strong className="text-white">Google Sheets API:</strong> Lettura e sincronizzazione unidirezionale di anagrafiche atlete o fogli presenze societari autorizzati direttamente dal dirigente responsabile.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p><strong className="text-white">Google Calendar API:</strong> Sincronizzazione degli eventi di allenamento e partite sul calendario della squadra.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p><strong className="text-white">Google Identity Services (Auth):</strong> Autenticazione sicura dell'atleta o del membro dello staff.</p>
            </div>
          </div>

          <div className="p-4 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg mt-3 text-xs text-gray-300 space-y-2">
            <p className="font-semibold text-[#D4AF37]">
              Dichiarazione di Utilizzo Limitato (Google Limited Use Disclosure):
            </p>
            <p className="italic">
              "L'uso e il trasferimento a qualsiasi altra app delle informazioni ricevute dalle API di Google da parte di Rugby Villorba Team Manager sono conformi alle <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-[#D4AF37] underline">Norme sui dati utente dei servizi API di Google</a>, compresi i requisiti di Utilizzo Limitato (Limited Use requirements)."
            </p>
            <p>
              I dati ottenuti tramite API Google <strong>non vengono mai venduti a terzi</strong>, non vengono utilizzati per pubblicità comportamentale né ceduti a broker di dati.
            </p>
          </div>
        </section>

        {/* 4. Finalità del Trattamento */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>4. Finalità e Base Giuridica del Trattamento</span>
          </h2>
          <p>Il trattamento dei dati personali è effettuato esclusivamente per:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-300">
            <li>Esecuzione dell'attività sportivo-agonistica e organizzazione degli allenamenti.</li>
            <li>Monitoraggio della salute delle atlete e prevenzione infortuni (tutela dell'incolumità fisica).</li>
            <li>Adempimento degli obblighi federali FIR (Federazione Italiana Rugby) e visite mediche di idoneità.</li>
            <li>Comunicazioni di servizio tra staff e tesserate.</li>
          </ul>
        </section>

        {/* 5. Conservazione e Sicurezza dei Dati */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>5. Sicurezza e Conservazione dei Dati</span>
          </h2>
          <p>
            I dati sono protetti tramite crittografia standard di settore TLS/HTTPS in transito e crittografia AES-256 a riposo sui server sicuri Google Cloud Firestore conformi alle normative europee GDPR.
          </p>
          <p>
            I dati vengono conservati per la durata della stagione agonistica e dell'iscrizione al club sportivo, salvo richiesta di cancellazione anticipata.
          </p>
        </section>

        {/* 6. Diritti dell'Interessato */}
        <section className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>6. Diritti dell'Interessato (GDPR Artt. 15-22)</span>
          </h2>
          <p>
            Ciascun utente, atleta o membro dello staff ha il diritto di:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-300">
            <li>Accedere ai propri dati personali registrati nell'applicazione.</li>
            <li>Richiedere la rettifica, la modifica o l'aggiornamento dei propri dati.</li>
            <li>Richiedere la cancellazione permanente ("Diritto all'oblio").</li>
            <li>Revocare in qualsiasi momento il consenso all'autenticazione Google tramite le impostazioni dell'Account Google.</li>
          </ul>
          <p className="pt-2">
            Per esercitare i propri diritti, inviare un'email a: <a href="mailto:alberto.tonetto@gmail.com" className="text-[#D4AF37] font-semibold underline">alberto.tonetto@gmail.com</a>.
          </p>
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
