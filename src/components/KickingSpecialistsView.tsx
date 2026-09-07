import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { KickingSession } from '../types';
import { exportToCsv } from '../utils/csvExport';
import {
  Target,
  Plus,
  Award,
  Crosshair,
  Clock,
  TrendingUp,
  Sparkles,
  Flame,
  CheckCircle,
  Percent,
  Download,
  Trash2,
  Edit2
} from 'lucide-react';

export const KickingSpecialistsView: React.FC = () => {
  const { players, kickingSessions, addKickingSession, updateKickingSession, deleteKickingSession, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role !== 'player';

  // Ogni atleta vede solo la propria sessione di calci e specialisti; lo staff vede tutto.
  const visibleKickingSessions = isStaff
    ? kickingSessions
    : kickingSessions.filter(ks => ks.playerId === currentUser?.id);

  const canEditKick = (ks: KickingSession) => isStaff || ks.playerId === currentUser?.id;

  const handleDeleteKick = (ks: KickingSession) => {
    if (window.confirm(`Eliminare la sessione calci di ${ks.playerName} del ${ks.date}?`)) {
      deleteKickingSession(ks.id);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [editingKick, setEditingKick] = useState<KickingSession | null>(null);
  const kickerCandidates = players.filter(p =>
    p.position.includes('Apertura') ||
    p.position.includes('Mischia') ||
    p.position.includes('Centro') ||
    p.position.includes('Estremo')
  );

  // Form semplificato per le atlete: tempo di lavoro generico oppure test
  // di precisione sui piazzati, con solo le percentuali per posizione.
  const [athleteMode, setAthleteMode] = useState<'generic' | 'test'>('generic');
  const [athleteDurationMin, setAthleteDurationMin] = useState(30);
  const [athleteNotes, setAthleteNotes] = useState('');
  const [testSinistra, setTestSinistra] = useState(0);
  const [testCentro, setTestCentro] = useState(0);
  const [testDestra, setTestDestra] = useState(0);

  const resetAthleteForm = () => {
    setAthleteMode('generic');
    setAthleteDurationMin(30);
    setAthleteNotes('');
    setTestSinistra(0);
    setTestCentro(0);
    setTestDestra(0);
  };

  const handleCreateAthleteKicking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const emptyStats = {
      piazzati: { total: 0, success: 0 },
      drop: { total: 0, success: 0 },
      spostamento: { total: 0, success: 0 },
      upAndUnder: { total: 0, success: 0 }
    };

    const payload = athleteMode === 'generic'
      ? {
          playerId: currentUser.id,
          playerName: currentUser.name,
          date: editingKick ? editingKick.date : new Date().toISOString().slice(0, 10),
          durationMin: athleteDurationMin,
          totalKicks: 0,
          successfulKicks: 0,
          stats: emptyStats,
          notes: athleteNotes.trim() ? athleteNotes : undefined,
          sessionType: 'generic' as const
        }
      : {
          playerId: currentUser.id,
          playerName: currentUser.name,
          date: editingKick ? editingKick.date : new Date().toISOString().slice(0, 10),
          durationMin: athleteDurationMin,
          totalKicks: 0,
          successfulKicks: 0,
          stats: emptyStats,
          fieldZoneSuccess: { sinistra: testSinistra, centro: testCentro, destra: testDestra },
          notes: athleteNotes.trim() ? athleteNotes : undefined,
          sessionType: 'placed_kicks_test' as const
        };

    if (editingKick) {
      await updateKickingSession({ ...payload, id: editingKick.id });
    } else {
      await addKickingSession(payload);
    }
    resetAthleteForm();
    setEditingKick(null);
    setShowModal(false);
  };

  const [selectedPlayerId, setSelectedPlayerId] = useState(kickerCandidates[0]?.id || 'p-26');
  const [durationMin, setDurationMin] = useState(45);
  const [piazzatiTotal, setPiazzatiTotal] = useState(25);
  const [piazzatiSuccess, setPiazzatiSuccess] = useState(22);
  const [dropTotal, setDropTotal] = useState(5);
  const [dropSuccess, setDropSuccess] = useState(4);
  const [spostamentoTotal, setSpostamentoTotal] = useState(6);
  const [spostamentoSuccess, setSpostamentoSuccess] = useState(5);
  const [upAndUnderTotal, setUpAndUnderTotal] = useState(4);
  const [upAndUnderSuccess, setUpAndUnderSuccess] = useState(3);
  const [zoneCentro, setZoneCentro] = useState(90);
  const [zoneDestra, setZoneDestra] = useState(85);
  const [zoneSinistra, setZoneSinistra] = useState(80);
  const [notes, setNotes] = useState('');

  const resetKickForm = () => {
    setSelectedPlayerId(kickerCandidates[0]?.id || 'p-26');
    setDurationMin(45);
    setPiazzatiTotal(25);
    setPiazzatiSuccess(22);
    setDropTotal(5);
    setDropSuccess(4);
    setSpostamentoTotal(6);
    setSpostamentoSuccess(5);
    setUpAndUnderTotal(4);
    setUpAndUnderSuccess(3);
    setZoneCentro(90);
    setZoneDestra(85);
    setZoneSinistra(80);
    setNotes('');
  };

  const startEditKick = (ks: KickingSession) => {
    setEditingKick(ks);

    if (!isStaff) {
      setAthleteMode(ks.sessionType === 'placed_kicks_test' ? 'test' : 'generic');
      setAthleteDurationMin(ks.durationMin);
      setAthleteNotes(ks.notes || '');
      setTestSinistra(ks.fieldZoneSuccess?.sinistra ?? 0);
      setTestCentro(ks.fieldZoneSuccess?.centro ?? 0);
      setTestDestra(ks.fieldZoneSuccess?.destra ?? 0);
      setShowModal(true);
      return;
    }

    setSelectedPlayerId(ks.playerId);
    setDurationMin(ks.durationMin);
    setPiazzatiTotal(ks.stats.piazzati.total);
    setPiazzatiSuccess(ks.stats.piazzati.success);
    setDropTotal(ks.stats.drop.total);
    setDropSuccess(ks.stats.drop.success);
    setSpostamentoTotal(ks.stats.spostamento.total);
    setSpostamentoSuccess(ks.stats.spostamento.success);
    setUpAndUnderTotal(ks.stats.upAndUnder.total);
    setUpAndUnderSuccess(ks.stats.upAndUnder.success);
    setZoneCentro(ks.fieldZoneSuccess?.centro ?? 90);
    setZoneDestra(ks.fieldZoneSuccess?.destra ?? 85);
    setZoneSinistra(ks.fieldZoneSuccess?.sinistra ?? 80);
    setNotes(ks.notes || '');
    setShowModal(true);
  };

  const closeKickModal = () => {
    setShowModal(false);
    setEditingKick(null);
    if (isStaff) resetKickForm(); else resetAthleteForm();
  };

  const handleCreateKicking = async (e: React.FormEvent) => {
    e.preventDefault();
    const kicker = players.find(p => p.id === selectedPlayerId);
    if (!kicker) return;

    const totalKicks = piazzatiTotal + dropTotal + spostamentoTotal + upAndUnderTotal;
    const successfulKicks = piazzatiSuccess + dropSuccess + spostamentoSuccess + upAndUnderSuccess;

    const payload = {
      playerId: kicker.id,
      playerName: kicker.name,
      date: editingKick ? editingKick.date : new Date().toISOString().slice(0, 10),
      durationMin,
      totalKicks,
      successfulKicks,
      stats: {
        piazzati: { total: piazzatiTotal, success: piazzatiSuccess },
        drop: { total: dropTotal, success: dropSuccess },
        spostamento: { total: spostamentoTotal, success: spostamentoSuccess },
        upAndUnder: { total: upAndUnderTotal, success: upAndUnderSuccess }
      },
      fieldZoneSuccess: {
        centro: zoneCentro,
        destra: zoneDestra,
        sinistra: zoneSinistra
      },
      notes: notes.trim() ? notes : undefined,
      sessionType: 'full' as const
    };

    if (editingKick) {
      await updateKickingSession({ ...payload, id: editingKick.id });
    } else {
      await addKickingSession(payload);
    }

    closeKickModal();
  };

  const handleExportCsv = () => {
    exportToCsv(
      `calci_specialisti_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Giocatrice', 'Durata (min)', 'Calci Totali', 'Calci Riusciti', 'Precisione %', 'Piazzati Riusciti/Tot', 'Drop Riusciti/Tot', 'Spostamento Riusciti/Tot', 'Up&Under Riusciti/Tot', 'Note'],
      visibleKickingSessions.map(ks => [
        ks.date,
        `"${ks.playerName}"`,
        ks.durationMin,
        ks.totalKicks,
        ks.successfulKicks,
        Math.round((ks.successfulKicks / ks.totalKicks) * 100) || 0,
        `${ks.stats.piazzati.success}/${ks.stats.piazzati.total}`,
        `${ks.stats.drop.success}/${ks.stats.drop.total}`,
        `${ks.stats.spostamento.success}/${ks.stats.spostamento.total}`,
        `${ks.stats.upAndUnder.success}/${ks.stats.upAndUnder.total}`,
        `"${(ks.notes || '').replace(/"/g, "'")}"`
      ])
    );
  };

  return (
    <div id="kicking-specialists-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center text-2xl font-bold">
            <Target className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Calci Trequarti & Specialisti al Piede (45 min)</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                Precisione & Percentuali Balistiche
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Piazzati da fermo, trasformazioni ai pali, drop goal, box kick del 9 e calci di liberazione 50-22
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-kicking-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Esporta CSV</span>
          </button>
          <button
            id="btn-add-kicking-session"
            onClick={() => {
              if (isStaff) resetKickForm(); else resetAthleteForm();
              setEditingKick(null);
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isStaff ? 'Registra Sessione Calci (45m)' : 'Registra la Tua Sessione'}</span>
          </button>
        </div>
      </div>

      {/* Specialist Kicker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleKickingSessions.map(ks => {
          const overallPct = Math.round((ks.successfulKicks / ks.totalKicks) * 100) || 0;
          const piazzatiPct = Math.round((ks.stats.piazzati.success / ks.stats.piazzati.total) * 100) || 0;
          const isGeneric = ks.sessionType === 'generic';
          const isTest = ks.sessionType === 'placed_kicks_test';

          return (
            <div key={ks.id} className="bg-[#121214] border border-[#2A2A2E] hover:border-[#D4AF37]/50 rounded-xl p-5 shadow-xl space-y-4 transition-all">
              <div className="flex items-start justify-between border-b border-[#2A2A2E] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
                    {ks.playerName}
                    {isGeneric && (
                      <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] rounded font-semibold uppercase tracking-wider">
                        Tempo di lavoro
                      </span>
                    )}
                    {isTest && (
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] rounded font-semibold uppercase tracking-wider">
                        Test piazzati
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{ks.date}</span>
                    <span>•</span>
                    <span className="text-[#D4AF37] font-semibold">{ks.durationMin} minuti</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    {!isGeneric && !isTest && <span className="text-2xl font-black text-[#D4AF37]">{overallPct}%</span>}
                    {canEditKick(ks) && (
                      <>
                        <button
                          onClick={() => startEditKick(ks)}
                          className="p-1 text-gray-500 hover:text-[#D4AF37] hover:bg-[#1D1D21] rounded-lg"
                          title="Modifica sessione"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKick(ks)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-[#1D1D21] rounded-lg"
                          title="Elimina sessione"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  {!isGeneric && !isTest && (
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Precisione Totale</p>
                  )}
                </div>
              </div>

              {isGeneric && (
                <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] text-xs text-gray-300">
                  Tempo di lavoro registrato: <span className="font-bold text-[#E0E0E1]">{ks.durationMin} minuti</span>
                </div>
              )}

              {/* Stats Breakdown Pills */}
              {!isGeneric && !isTest && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Piazzati ai Pali:</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-bold text-[#E0E0E1]">{ks.stats.piazzati.success}/{ks.stats.piazzati.total}</span>
                    <span className="text-emerald-400 font-bold">{piazzatiPct}%</span>
                  </div>
                </div>

                <div className="bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Drop Goal:</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-bold text-[#E0E0E1]">{ks.stats.drop.success}/{ks.stats.drop.total}</span>
                    <span className="text-[#D4AF37] font-bold">
                      {Math.round((ks.stats.drop.success / (ks.stats.drop.total || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Liberazione 50-22:</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-bold text-[#E0E0E1]">{ks.stats.spostamento.success}/{ks.stats.spostamento.total}</span>
                    <span className="text-blue-400 font-bold">
                      {Math.round((ks.stats.spostamento.success / (ks.stats.spostamento.total || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Box Kick (9):</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-bold text-[#E0E0E1]">{ks.stats.upAndUnder.success}/{ks.stats.upAndUnder.total}</span>
                    <span className="text-purple-400 font-bold">
                      {Math.round((ks.stats.upAndUnder.success / (ks.stats.upAndUnder.total || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              )}

              {/* Pitch Zones Breakdown */}
              {ks.fieldZoneSuccess && (isTest || !isGeneric) && (
                <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] text-xs space-y-1.5">
                  <span className="font-bold text-gray-300 block text-[11px] uppercase tracking-wider">Precisione per Zona Campo:</span>
                  <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
                    <div className="bg-[#121214] p-1.5 rounded-lg border border-[#2A2A2E]">
                      <p className="text-gray-400">Sinistra</p>
                      <p className="font-bold text-emerald-400">{ks.fieldZoneSuccess.sinistra}%</p>
                    </div>
                    <div className="bg-[#121214] p-1.5 rounded-lg border border-[#2A2A2E]">
                      <p className="text-gray-400">Centro</p>
                      <p className="font-bold text-[#D4AF37]">{ks.fieldZoneSuccess.centro}%</p>
                    </div>
                    <div className="bg-[#121214] p-1.5 rounded-lg border border-[#2A2A2E]">
                      <p className="text-gray-400">Destra</p>
                      <p className="font-bold text-emerald-400">{ks.fieldZoneSuccess.destra}%</p>
                    </div>
                  </div>
                </div>
              )}

              {ks.notes && (
                <p className="text-xs text-gray-400 italic">"{ks.notes}"</p>
              )}
            </div>
          );
        })}

        {visibleKickingSessions.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#121214] border border-[#2A2A2E] rounded-xl">
            <Target className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-[#E0E0E1] font-bold text-base font-serif">Nessuna Sessione Calci Registrata</p>
            <p className="text-xs text-gray-400">Registra i report balistici di piazzati, drop e calci di liberazione per le mediatrici e calciatrici.</p>
          </div>
        )}
      </div>

      {/* Modal Add Kicking */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-[#D4AF37]" />
                {isStaff
                  ? (editingKick ? 'Modifica Sessione Calci' : 'Registra Sessione Calci (45 min)')
                  : (editingKick ? 'Modifica la Tua Sessione' : 'Registra la Tua Sessione Calci')}
              </h3>
              <button onClick={closeKickModal} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            {!isStaff && (
              <form onSubmit={handleCreateAthleteKicking} className="space-y-4 text-xs">

                <div>
                  <label className="block font-semibold text-gray-300 mb-1.5 uppercase tracking-wider text-[11px]">Tipo di Sessione:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAthleteMode('generic')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                        athleteMode === 'generic'
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                          : 'bg-[#1D1D21] text-gray-300 border-[#2A2A2E] hover:bg-[#26262B]'
                      }`}
                    >
                      Tempo di Lavoro Generico
                    </button>
                    <button
                      type="button"
                      onClick={() => setAthleteMode('test')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                        athleteMode === 'test'
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                          : 'bg-[#1D1D21] text-gray-300 border-[#2A2A2E] hover:bg-[#26262B]'
                      }`}
                    >
                      Test Calci Piazzati
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Durata (minuti):</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={athleteDurationMin}
                    onChange={(e) => setAthleteDurationMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {athleteMode === 'test' && (
                  <div className="grid grid-cols-3 gap-3 bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E]">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[10px]">Sinistra %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testSinistra}
                        onChange={(e) => setTestSinistra(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[10px]">Centro %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testCentro}
                        onChange={(e) => setTestCentro(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[10px]">Destra %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testDestra}
                        onChange={(e) => setTestDestra(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Note (facoltativo):</label>
                  <input
                    type="text"
                    placeholder="es. Vento contrario, buone sensazioni..."
                    value={athleteNotes}
                    onChange={(e) => setAthleteNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2A2E]">
                  <button
                    type="button"
                    onClick={closeKickModal}
                    className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg border border-[#2A2A2E]"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg shadow-md transition-all active:scale-95"
                  >
                    {editingKick ? 'Salva Modifiche' : 'Salva Sessione'}
                  </button>
                </div>

              </form>
            )}

            {isStaff && (
            <form onSubmit={handleCreateKicking} className="space-y-4 text-xs">

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Specialista Calciatrice:</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                >
                  {kickerCandidates.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber || '-'} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-3 bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E]">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Piazzati Riusciti / Totali:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={piazzatiSuccess}
                      onChange={(e) => setPiazzatiSuccess(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-emerald-400 font-bold text-center"
                    />
                    <span className="text-gray-400 font-bold">/</span>
                    <input
                      type="number"
                      min="1"
                      value={piazzatiTotal}
                      onChange={(e) => setPiazzatiTotal(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Drop Goal Riusciti / Totali:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={dropSuccess}
                      onChange={(e) => setDropSuccess(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#D4AF37] font-bold text-center"
                    />
                    <span className="text-gray-400 font-bold">/</span>
                    <input
                      type="number"
                      min="1"
                      value={dropTotal}
                      onChange={(e) => setDropTotal(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Liberazione 50-22 (Riusciti/Tot):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={spostamentoSuccess}
                      onChange={(e) => setSpostamentoSuccess(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-blue-400 font-bold text-center"
                    />
                    <span className="text-gray-400 font-bold">/</span>
                    <input
                      type="number"
                      min="1"
                      value={spostamentoTotal}
                      onChange={(e) => setSpostamentoTotal(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Box Kick / Up&Under:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={upAndUnderSuccess}
                      onChange={(e) => setUpAndUnderSuccess(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-purple-400 font-bold text-center"
                    />
                    <span className="text-gray-400 font-bold">/</span>
                    <input
                      type="number"
                      min="1"
                      value={upAndUnderTotal}
                      onChange={(e) => setUpAndUnderTotal(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Note Staff / Condizioni Vento:</label>
                <input
                  type="text"
                  placeholder="es. Vento trasversale da sinistra, ottimo impatto palla..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2A2E]">
                <button
                  type="button"
                  onClick={closeKickModal}
                  className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg border border-[#2A2A2E]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg shadow-md transition-all active:scale-95"
                >
                  {editingKick ? 'Salva Modifiche' : 'Salva Statistiche Calci'}
                </button>
              </div>

            </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
