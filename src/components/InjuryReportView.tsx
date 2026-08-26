import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/csvExport';
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
  Trash2,
  Download
} from 'lucide-react';

export const InjuryReportView: React.FC = () => {
  const { players, injuries, addInjuryReport, updateInjuryReport, deleteInjuryReport, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isPlayer = currentUser?.role === 'player';
  const isStaff = !isPlayer;

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(isPlayer ? currentUser!.id : (players[0]?.id || ''));
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [exportRange, setExportRange] = useState<'week' | 'season'>('season');

  const activeInjuries = injuries.filter(i => i.status !== 'cleared');

  // Segnalazione rapida da parte dell'atleta (o dello staff): solo nome, data e nota.
  // Il dettaglio clinico (zona, gravità, piano terapeutico) è compito della fisioterapista
  // nella sua scheda dedicata (vedi "Note Fisioterapia").
  const handleCreateInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player || !note.trim()) return;

    await addInjuryReport({
      playerId: player.id,
      playerName: player.name,
      injuryDate: reportDate,
      bodyPart: 'Altro',
      injuryType: note.trim(),
      severity: 'mild',
      rtpExpectedDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      status: 'in_rehab',
      physioNotes: note.trim(),
      treatmentPlan: '',
      hiaConcussionProtocol: false
    });

    setShowAddModal(false);
    setNote('');
    setReportDate(new Date().toISOString().slice(0, 10));
  };

  const handleStatusChange = async (injury: InjuryReport, newStatus: InjuryReport['status']) => {
    await updateInjuryReport({
      ...injury,
      status: newStatus
    });
  };

  const handleExportCsv = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const source = exportRange === 'week'
      ? injuries.filter(i => new Date(i.injuryDate) >= oneWeekAgo)
      : injuries;

    exportToCsv(
      `infortuni_fastidi_${exportRange === 'week' ? 'settimana' : 'stagione'}_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Giocatrice', 'Nota', 'Stato', 'RTP Stimato'],
      source.map(i => [
        i.injuryDate,
        `"${i.playerName}"`,
        `"${(i.physioNotes || i.injuryType || '').replace(/"/g, "'")}"`,
        i.status,
        i.rtpExpectedDate
      ])
    );
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
              Segnalazioni rapide di fastidi/infortuni; il dettaglio clinico è nella scheda dedicata della fisioterapista
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStaff && (
            <>
              <select
                value={exportRange}
                onChange={(e) => setExportRange(e.target.value as 'week' | 'season')}
                className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="week">Ultima Settimana</option>
                <option value="season">Stagione Intera</option>
              </select>
              <button
                id="btn-export-injuries-csv"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Esporta CSV</span>
              </button>
            </>
          )}
          <button
            id="btn-add-injury-report"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Segnala Fastidio / Infortunio</span>
          </button>
        </div>
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
                <h4 className="text-base font-bold text-[#E0E0E1] font-serif">{injury.playerName}</h4>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  {injury.injuryDate}
                </span>
              </div>

              <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] text-xs text-gray-300">
                {injury.physioNotes || injury.injuryType}
              </div>

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

      {/* Modal to Add New Injury Report - segnalazione rapida */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                <Bandage className="w-5 h-5 text-[#D4AF37]" />
                Segnalazione Infortunio / Fastidio
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateInjury} className="space-y-4 text-xs">

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Giocatrice:</label>
                <select
                  value={selectedPlayerId}
                  disabled={isPlayer}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37] disabled:opacity-70"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber || '-'} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Data:</label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Nota su Fastidio / Infortunio:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="es. Fastidio al ginocchio destro dopo l'allenamento di ieri, dolore lieve in flessione..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <p className="text-[10px] text-gray-500 italic">
                La segnalazione sarà visibile a tutto lo staff. La fisioterapista, dopo la visita, registrerà i dettagli clinici nella sua scheda dedicata.
              </p>

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
                  Registra Segnalazione
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
