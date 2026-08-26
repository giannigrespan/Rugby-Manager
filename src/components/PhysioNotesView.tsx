import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/csvExport';
import { PhysioNote, PhysioHealthStatus } from '../types';
import {
  Stethoscope,
  Plus,
  Trash2,
  AlertCircle,
  Download
} from 'lucide-react';

const HEALTH_STATUS_CONFIG: Record<PhysioHealthStatus, { label: string; color: string }> = {
  idoneo_100: { label: 'Idonea (100%)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  idoneo_limitazioni: { label: 'Idonea con Limitazioni (No contatto)', color: 'bg-lime-500/20 text-lime-400 border-lime-500/40' },
  affaticata: { label: 'Affaticata (Carichi ridotti / Scarico)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  recupero_fisioterapia: { label: 'In Recupero / Fisioterapia', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  infortunata: { label: 'Infortunata / Non idonea', color: 'bg-red-500/20 text-red-400 border-red-500/40' }
};

export const PhysioNotesView: React.FC = () => {
  const { players, physioNotes, addPhysioNote, deletePhysioNote, isSyncing } = useData();
  const { currentUser } = useAuth();
  // Solo il fisioterapista può creare/eliminare cartelle: tutti gli altri ruoli con la sezione
  // visibile (via matrice permessi) sono sola-visualizzazione.
  const canEditPhysioNotes = currentUser?.role === 'physiotherapist';

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || '');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionType, setSessionType] = useState<PhysioNote['sessionType']>('Trattamento Manuale');
  const [healthStatus, setHealthStatus] = useState<PhysioHealthStatus>('idoneo_100');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [rtpStatus, setRtpStatus] = useState('In trattamento');
  const [isConfidential, setIsConfidential] = useState(false);
  const [exportRange, setExportRange] = useState<'week' | 'season'>('season');

  // Expiring medical certificates (< 45 days)
  const expiringMedicalPlayers = players.filter(p => {
    if (!p.medicalExpiry) return false;
    const diffDays = (new Date(p.medicalExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diffDays <= 45;
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player || !diagnosis.trim()) return;

    await addPhysioNote({
      playerId: player.id,
      playerName: player.name,
      date: evaluationDate,
      physioName: currentUser?.name || 'Fisioterapista',
      healthStatus,
      sessionType,
      diagnosis,
      treatment,
      exercisePlan: '',
      rtpStatus,
      isConfidential
    });

    setShowAddModal(false);
    setDiagnosis('');
    setTreatment('');
    setEvaluationDate(new Date().toISOString().slice(0, 10));
  };

  const handleExportCsv = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const source = exportRange === 'week'
      ? physioNotes.filter(n => new Date(n.date) >= oneWeekAgo)
      : physioNotes;

    exportToCsv(
      `note_fisioterapia_${exportRange === 'week' ? 'settimana' : 'stagione'}_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Giocatrice', 'Autore', 'Stato di Salute', 'Resoconto', 'Suggerimenti', 'Stato RTP'],
      source.map(n => [
        n.date,
        `"${n.playerName}"`,
        `"${n.physioName}"`,
        HEALTH_STATUS_CONFIG[n.healthStatus]?.label || n.healthStatus || '',
        `"${n.diagnosis.replace(/"/g, "'")}"`,
        `"${n.treatment.replace(/"/g, "'")}"`,
        `"${n.rtpStatus}"`
      ])
    );
  };

  return (
    <div id="physio-notes-container" className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center text-2xl font-bold">
            <Stethoscope className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Note Fisioterapia & Schede Salute</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                {physioNotes.length} Cartelle
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Diario trattamenti fisioterapici, test fisici, terapie manuali e scadenze visite mediche agonistiche
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={exportRange}
            onChange={(e) => setExportRange(e.target.value as 'week' | 'season')}
            className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="week">Ultima Settimana</option>
            <option value="season">Stagione Intera</option>
          </select>
          <button
            id="btn-export-physio-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Esporta CSV</span>
          </button>

          {canEditPhysioNotes && (
            <button
              id="btn-add-physio-note"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Nota Trattamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Medical Certificate Expiry Warning Card */}
      {expiringMedicalPlayers.length > 0 && (
        <div className="bg-[#1D1D21] border border-[#D4AF37]/40 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>Attenzione Scadenza Visite Mediche Agonistiche ({expiringMedicalPlayers.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringMedicalPlayers.map(p => (
              <span key={p.id} className="px-2.5 py-1 bg-[#121214] text-gray-200 border border-[#2A2A2E] rounded-lg text-[11px] flex items-center gap-1.5 font-medium">
                <span>#{p.jerseyNumber || '-'} {p.name}</span>
                <span className="text-[#D4AF37] font-bold">Scadenza: {p.medicalExpiry}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {!canEditPhysioNotes && (
        <div className="bg-[#1D1D21] border border-[#2A2A2E] p-3 rounded-xl text-xs text-gray-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>Solo il fisioterapista può creare o modificare le cartelle. Questa vista è in sola lettura.</span>
        </div>
      )}

      {/* Physio Notes Logbook List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {physioNotes.map(note => {
          const statusConfig = HEALTH_STATUS_CONFIG[note.healthStatus];
          return (
            <div
              key={note.id}
              className="bg-[#121214] border border-[#2A2A2E] hover:border-[#D4AF37]/40 rounded-xl p-5 shadow-xl space-y-3 transition-all"
            >
              <div className="flex items-start justify-between border-b border-[#2A2A2E] pb-3">
                <div>
                  {statusConfig && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-[#E0E0E1] mt-1 font-serif">{note.playerName}</h3>
                  <p className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{note.date}</span>
                    <span>•</span>
                    <span>Autore: {note.physioName}</span>
                  </p>
                </div>

                {canEditPhysioNotes && (
                  <button
                    onClick={() => deletePhysioNote(note.id)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-[#1D1D21]"
                    title="Elimina nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E]">
                  <span className="font-bold text-[#E0E0E1] block mb-0.5">Resoconto Stato di Salute:</span>
                  <p className="text-gray-300">{note.diagnosis}</p>
                </div>

                <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E]">
                  <span className="font-bold text-[#D4AF37] block mb-0.5">Suggerimenti per Recupero e Gestione Allenamenti:</span>
                  <p className="text-gray-300">{note.treatment}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2A2A2E] flex items-center justify-between text-xs">
                <span className="text-gray-400">Stato RTP:</span>
                <span className="font-bold text-[#D4AF37]">{note.rtpStatus}</span>
              </div>
            </div>
          );
        })}

        {physioNotes.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#121214] border border-[#2A2A2E] rounded-xl">
            <Stethoscope className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-[#E0E0E1] font-bold text-base font-serif">Nessuna Cartella Fisioterapica</p>
            <p className="text-xs text-gray-400">Non ci sono ancora note o trattamenti registrati per la rosa.</p>
          </div>
        )}
      </div>

      {/* Add Physio Note Modal */}
      {showAddModal && canEditPhysioNotes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#D4AF37]" />
                  Nuova Scheda Fisioterapica / Valutazione Atleta
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Autore: {currentUser?.name} ({currentUser?.role.replace('_', ' ')})</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Seleziona Atleta:</label>
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

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Data Valutazione:</label>
                  <input
                    type="date"
                    required
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Stato di Salute & Idoneità:</label>
                <select
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value as PhysioHealthStatus)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                >
                  {Object.entries(HEALTH_STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Tipologia Seduta:</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Valutazione Iniziale">Valutazione Iniziale</option>
                  <option value="Trattamento Manuale">Trattamento Manuale</option>
                  <option value="Differenziato Campo">Differenziato Campo</option>
                  <option value="Controllo Pre-Gara">Controllo Pre-Gara</option>
                  <option value="Test RTP">Test RTP</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Resoconto Stato di Salute (Sintomi, Diagnosi, Valutazione Funzionale):</label>
                <textarea
                  rows={3}
                  placeholder="es. Riscontrato al quadricipite sinistro avvertito durante l'ultimo allenamento, dati palpazione, edema visibile..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Suggerimenti Dati per Recupero, Riposo e Gestione Allenamenti:</label>
                <textarea
                  rows={3}
                  placeholder="es. Consigliate 48h di riposo attivo, applicazione del ghiaccio 3 volte al giorno (15 min), seduta di ricarterapia giovedì. Evitare contatto e salti in touche fino a lunedì..."
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Stato Return-To-Play:</label>
                <input
                  type="text"
                  placeholder="es. Fase 2 di 5: Palestra / Idonea al 100%..."
                  value={rtpStatus}
                  onChange={(e) => setRtpStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
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
                  Registra Nota Fisioterapica
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
