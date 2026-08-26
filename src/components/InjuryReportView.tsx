import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { InjuryReport } from '../types';
import { 
  AlertTriangle, 
  Plus, 
  ShieldAlert, 
  Bandage, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Activity, 
  HeartHandshake, 
  FileText,
  Trash2,
  Edit2
} from 'lucide-react';

export const InjuryReportView: React.FC = () => {
  const { players, injuries, addInjuryReport, updateInjuryReport, deleteInjuryReport, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role !== 'player';

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || '');
  const [bodyPart, setBodyPart] = useState<InjuryReport['bodyPart']>('Caviglia');
  const [injuryType, setInjuryType] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [rtpExpectedDate, setRtpExpectedDate] = useState('');
  const [physioNotes, setPhysioNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [hiaConcussionProtocol, setHiaConcussionProtocol] = useState(false);

  const activeInjuries = injuries.filter(i => i.status !== 'cleared');
  const clearedInjuries = injuries.filter(i => i.status === 'cleared');

  const handleCreateInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player || !injuryType.trim()) return;

    await addInjuryReport({
      playerId: player.id,
      playerName: player.name,
      injuryDate: new Date().toISOString().slice(0, 10),
      bodyPart,
      injuryType,
      severity,
      rtpExpectedDate: rtpExpectedDate || new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      status: 'in_rehab',
      physioNotes,
      treatmentPlan,
      hiaConcussionProtocol
    });

    setShowAddModal(false);
    setInjuryType('');
    setPhysioNotes('');
    setTreatmentPlan('');
    setHiaConcussionProtocol(false);
  };

  const handleStatusChange = async (injury: InjuryReport, newStatus: InjuryReport['status']) => {
    await updateInjuryReport({
      ...injury,
      status: newStatus
    });
  };

  return (
    <div id="injury-reports-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center text-2xl font-bold">
            <AlertTriangle className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Report Fastidi & Registro Infortuni</h2>
              <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold rounded-full">
                {activeInjuries.length} Attivi
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Monitoraggio clinico, protocolli Return-to-Play (RTP) e tracciamento HIA Concussion
            </p>
          </div>
        </div>

        {isStaff && (
          <button
            id="btn-add-injury-report"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Fastidio / Infortunio</span>
          </button>
        )}
      </div>

      {/* World Rugby HIA Banner if any */}
      {injuries.some(i => i.hiaConcussionProtocol && i.status !== 'cleared') && (
        <div className="bg-[#1D1D21] border border-[#D4AF37]/50 p-4 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#D4AF37] uppercase tracking-wider">PROTOCOLLO COMMOZIONE WORLD RUGBY HIA IN CORSO</p>
            <p className="mt-0.5 text-gray-300">
              Atleta soggetta al protocollo di rientro graduale a 6 stadi (GRTP). Vietato il contatto fisico o allenamento ad alta intensità prima del nulla osta medico.
            </p>
          </div>
        </div>
      )}

      {/* Active Injuries Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D4AF37]" />
          Infortuni e Fastidi Attivi in Trattamento ({activeInjuries.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeInjuries.map(injury => (
            <div 
              key={injury.id} 
              className="bg-[#121214] border border-[#2A2A2E] hover:border-[#D4AF37]/50 rounded-xl p-5 shadow-xl space-y-3 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-[#1D1D21] px-2 py-0.5 rounded border border-[#2A2A2E]">
                    {injury.bodyPart}
                  </span>
                  <h4 className="text-base font-bold text-[#E0E0E1] mt-1 font-serif">{injury.playerName}</h4>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  injury.severity === 'severe' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                  injury.severity === 'moderate' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40'
                }`}>
                  {injury.severity.toUpperCase()}
                </span>
              </div>

              <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] space-y-1.5 text-xs">
                <p className="font-semibold text-[#E0E0E1]">{injury.injuryType}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    Data: {injury.injuryDate}
                  </span>
                  <span className="flex items-center gap-1 text-[#D4AF37] font-medium">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    RTP Stimato: {injury.rtpExpectedDate}
                  </span>
                </div>
              </div>

              {injury.treatmentPlan && (
                <div className="text-xs text-gray-300 bg-[#1D1D21]/60 p-2.5 rounded-lg border border-[#2A2A2E]">
                  <span className="font-semibold text-[#D4AF37]">Piano Terapeutico: </span>
                  {injury.treatmentPlan}
                </div>
              )}

              {injury.physioNotes && (
                <div className="text-xs text-gray-400 italic">
                  "{injury.physioNotes}"
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="pt-2 border-t border-[#2A2A2E] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                  <span className="text-xs font-semibold text-[#D4AF37] capitalize">{injury.status.replace('_', ' ')}</span>
                </div>

                {isStaff && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(injury, 'cleared')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Segna atleta come guarita e rientrata in gruppo"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Rientro (Fit)</span>
                    </button>
                    <button
                      onClick={() => deleteInjuryReport(injury.id)}
                      className="p-1 text-gray-500 hover:text-red-400 rounded-lg hover:bg-[#1D1D21]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {activeInjuries.length === 0 && (
            <div className="col-span-full py-12 text-center bg-[#121214] border border-[#2A2A2E] rounded-xl">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-[#E0E0E1] font-bold text-base font-serif">Nessun Infortunio Attivo</p>
              <p className="text-xs text-gray-400">Tutte le atlete della rosa sono attualmente idonee agli allenamenti.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal to Add New Injury Report */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                <Bandage className="w-5 h-5 text-[#D4AF37]" />
                Segnalazione Infortunio / Fastidio Staff
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateInjury} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Giocatrice Infortunata:</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber || '-'} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Zona del Corpo:</label>
                  <select
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Caviglia">Caviglia</option>
                    <option value="Ginocchio">Ginocchio</option>
                    <option value="Spalla">Spalla</option>
                    <option value="Collo / Schiena">Collo / Schiena</option>
                    <option value="Coscia / Ischiocrurali">Coscia / Ischiocrurali</option>
                    <option value="Polpaccio">Polpaccio</option>
                    <option value="Commozione HIA">Commozione HIA</option>
                    <option value="Polso / Mano">Polso / Mano</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Gravità:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="mild">Lieve (1-7 giorni)</option>
                    <option value="moderate">Moderato (1-3 settimane)</option>
                    <option value="severe">Grave (&gt; 1 mese)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Diagnosi / Tipo Infortunio:</label>
                <input
                  type="text"
                  placeholder="es. Distorsione tibio-tarsica II grado con versamento..."
                  value={injuryType}
                  onChange={(e) => setInjuryType(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Data Prevista Rientro (RTP):</label>
                <input
                  type="date"
                  value={rtpExpectedDate}
                  onChange={(e) => setRtpExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Piano Terapeutico & Limitazioni:</label>
                <textarea
                  rows={2}
                  placeholder="es. Stop ai contatti, lavoro differenziato in piscina, tecarterapia..."
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg">
                <input
                  type="checkbox"
                  id="chk-hia"
                  checked={hiaConcussionProtocol}
                  onChange={(e) => setHiaConcussionProtocol(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] rounded"
                />
                <label htmlFor="chk-hia" className="text-gray-300 font-semibold cursor-pointer">
                  Attiva Protocollo Commozione Cerebrale World Rugby (HIA)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2A2E]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg border border-[#2A2A2E]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg shadow-md transition-all active:scale-95"
                >
                  Registra Infortunio
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
