import React, { useState, useMemo } from 'react';
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
  CalendarDays
} from 'lucide-react';

const WEEKLY_GOAL_MIN = 45;

// Monday (start) / Sunday (end) of the ISO week containing the given YYYY-MM-DD date
const getWeekRange = (dateStr: string): { monday: Date; sunday: Date } => {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
};

const isDateInRange = (dateStr: string, monday: Date, sunday: Date): boolean => {
  const t = new Date(`${dateStr}T00:00:00`).getTime();
  return t >= monday.getTime() && t <= sunday.getTime();
};

export const KickingSpecialistsView: React.FC = () => {
  const { players, kickingSessions, addKickingSession, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isPlayer = currentUser?.role === 'player';

  const [showModal, setShowModal] = useState(false);
  const kickerCandidates = players.filter(p =>
    p.position.includes('Apertura') ||
    p.position.includes('Mischia') ||
    p.position.includes('Centro') ||
    p.position.includes('Estremo')
  );

  const selectablePlayers = isPlayer ? players.filter(p => p.id === currentUser?.id) : kickerCandidates;
  const defaultPlayerId = isPlayer ? (currentUser?.id || '') : (kickerCandidates[0]?.id || 'p-26');

  const [selectedPlayerId, setSelectedPlayerId] = useState(defaultPlayerId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
  const [extraSkills, setExtraSkills] = useState<{ label: string; minutes: number }[]>([]);
  const [notes, setNotes] = useState('');

  const addExtraSkillRow = () => setExtraSkills(prev => [...prev, { label: '', minutes: 10 }]);
  const updateExtraSkillRow = (idx: number, field: 'label' | 'minutes', value: string) => {
    setExtraSkills(prev => prev.map((s, i) => i === idx
      ? { ...s, [field]: field === 'minutes' ? (parseInt(value) || 0) : value }
      : s));
  };
  const removeExtraSkillRow = (idx: number) => setExtraSkills(prev => prev.filter((_, i) => i !== idx));

  // Minuti già registrati per l'atleta nella settimana del giorno selezionato,
  // per mostrare il progresso verso l'obiettivo di 45 minuti settimanali.
  const weeklyProgressMin = useMemo(() => {
    const { monday, sunday } = getWeekRange(date);
    return kickingSessions
      .filter(ks => ks.playerId === selectedPlayerId && isDateInRange(ks.date, monday, sunday))
      .reduce((sum, ks) => sum + ks.durationMin, 0);
  }, [kickingSessions, selectedPlayerId, date]);

  const projectedWeeklyMin = weeklyProgressMin + durationMin;

  const handleCreateKicking = async (e: React.FormEvent) => {
    e.preventDefault();
    const kicker = players.find(p => p.id === selectedPlayerId);
    if (!kicker) return;

    const totalKicks = piazzatiTotal + dropTotal + spostamentoTotal + upAndUnderTotal;
    const successfulKicks = piazzatiSuccess + dropSuccess + spostamentoSuccess + upAndUnderSuccess;
    const cleanedExtraSkills = extraSkills.filter(s => s.label.trim());

    await addKickingSession({
      playerId: kicker.id,
      playerName: kicker.name,
      date,
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
      extraSkills: cleanedExtraSkills.length ? cleanedExtraSkills : undefined,
      notes: notes.trim() ? notes : undefined
    });

    setShowModal(false);
    setDate(new Date().toISOString().slice(0, 10));
    setExtraSkills([]);
    setNotes('');
  };

  const handleExportCsv = () => {
    exportToCsv(
      `calci_specialisti_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Giocatrice', 'Durata (min)', 'Calci Totali', 'Calci Riusciti', 'Precisione %', 'Piazzati Riusciti/Tot', 'Drop Riusciti/Tot', 'Spostamento Riusciti/Tot', 'Up&Under Riusciti/Tot', 'Skills Generici (min)', 'Note'],
      kickingSessions.map(ks => [
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
        `"${(ks.extraSkills || []).map(s => `${s.label} (${s.minutes}m)`).join(', ').replace(/"/g, "'")}"`,
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
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Calci Trequarti & Specialisti al Piede</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                Obiettivo: {WEEKLY_GOAL_MIN} min / settimana
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Piazzati da fermo, trasformazioni ai pali, drop goal, box kick del 9, calci di liberazione 50-22 e skills generici
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
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registra Sessione Calci</span>
          </button>
        </div>
      </div>

      {/* Weekly Progress Toward the 45min Goal */}
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-xl">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
          Progressi Settimanali (obiettivo {WEEKLY_GOAL_MIN} min)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(isPlayer ? selectablePlayers : kickerCandidates).map(p => {
            const { monday, sunday } = getWeekRange(new Date().toISOString().slice(0, 10));
            const minutesThisWeek = kickingSessions
              .filter(ks => ks.playerId === p.id && isDateInRange(ks.date, monday, sunday))
              .reduce((sum, ks) => sum + ks.durationMin, 0);
            const pct = Math.min(100, Math.round((minutesThisWeek / WEEKLY_GOAL_MIN) * 100));
            const reached = minutesThisWeek >= WEEKLY_GOAL_MIN;

            return (
              <div key={p.id} className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#E0E0E1] truncate">{p.name}</span>
                  <span className={`font-bold ${reached ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                    {minutesThisWeek}/{WEEKLY_GOAL_MIN} min
                  </span>
                </div>
                <div className="w-full bg-[#121214] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${reached ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Specialist Kicker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kickingSessions.map(ks => {
          const overallPct = Math.round((ks.successfulKicks / ks.totalKicks) * 100) || 0;
          const piazzatiPct = Math.round((ks.stats.piazzati.success / ks.stats.piazzati.total) * 100) || 0;

          return (
            <div key={ks.id} className="bg-[#121214] border border-[#2A2A2E] hover:border-[#D4AF37]/50 rounded-xl p-5 shadow-xl space-y-4 transition-all">
              <div className="flex items-start justify-between border-b border-[#2A2A2E] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#E0E0E1] font-serif">{ks.playerName}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{ks.date}</span>
                    <span>•</span>
                    <span className="text-[#D4AF37] font-semibold">{ks.durationMin} minuti</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#D4AF37]">{overallPct}%</span>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Precisione Totale</p>
                </div>
              </div>

              {/* Stats Breakdown Pills */}
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

              {/* Pitch Zones Breakdown */}
              {ks.fieldZoneSuccess && (
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

              {/* Generic Skills Breakdown */}
              {ks.extraSkills && ks.extraSkills.length > 0 && (
                <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] text-xs space-y-1.5">
                  <span className="font-bold text-gray-300 block text-[11px] uppercase tracking-wider">Skills Generici:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ks.extraSkills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[11px] text-gray-300">
                        {skill.label} <span className="text-[#D4AF37] font-bold">{skill.minutes}m</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ks.notes && (
                <p className="text-xs text-gray-400 italic">"{ks.notes}"</p>
              )}
            </div>
          );
        })}

        {kickingSessions.length === 0 && (
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
                Registra Sessione Calci
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateKicking} className="space-y-4 text-xs">

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Specialista Calciatrice:</label>
                <select
                  value={selectedPlayerId}
                  disabled={isPlayer}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37] disabled:opacity-70"
                >
                  {selectablePlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber || '-'} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Giorno di Lavoro:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Minuti Dedicati:</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMin}
                    onChange={(e) => setDurationMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Weekly Goal Progress */}
              <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">Progresso Settimanale:</span>
                  <span className={`font-bold ${projectedWeeklyMin >= WEEKLY_GOAL_MIN ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                    {projectedWeeklyMin}/{WEEKLY_GOAL_MIN} min
                  </span>
                </div>
                <div className="w-full bg-[#121214] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${projectedWeeklyMin >= WEEKLY_GOAL_MIN ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}
                    style={{ width: `${Math.min(100, Math.round((projectedWeeklyMin / WEEKLY_GOAL_MIN) * 100))}%` }}
                  />
                </div>
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

              {/* Generic Skills */}
              <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider text-[11px]">Skills Generici (oltre a quelli indicati):</label>
                  <button
                    type="button"
                    onClick={addExtraSkillRow}
                    className="flex items-center gap-1 text-[#D4AF37] hover:text-[#C09F30] font-semibold text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Aggiungi
                  </button>
                </div>

                {extraSkills.length === 0 && (
                  <p className="text-gray-500 text-[11px]">Nessuno skill generico aggiunto.</p>
                )}

                {extraSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="es. Calci di rimessa laterale..."
                      value={skill.label}
                      onChange={(e) => updateExtraSkillRow(idx, 'label', e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={skill.minutes}
                      onChange={(e) => updateExtraSkillRow(idx, 'minutes', e.target.value)}
                      className="w-20 px-2 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#D4AF37] font-bold text-center"
                    />
                    <span className="text-gray-400">min</span>
                    <button
                      type="button"
                      onClick={() => removeExtraSkillRow(idx)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">
                  {isPlayer ? 'Note Atleta / Condizioni Vento:' : 'Note Staff / Condizioni Vento:'}
                </label>
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg border border-[#2A2A2E]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg shadow-md transition-all active:scale-95"
                >
                  Salva Statistiche Calci
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
