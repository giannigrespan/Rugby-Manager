import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/csvExport';
import {
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Send,
  Flame,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

// Lunedì della settimana ISO a cui appartiene una data (chiave di raggruppamento periodizzato)
const getWeekKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = (d.getUTCDay() + 6) % 7; // Lunedì = 0
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - day);
  return monday.toISOString().slice(0, 10);
};

export const RpeAndFocusView: React.FC = () => {
  const { players, sessions, rpeFeedbacks, submitRpeFeedback, isSyncing } = useData();
  const { currentUser } = useAuth();

  const isPlayer = currentUser?.role === 'player';
  const defaultPlayerId = isPlayer ? currentUser.id : players[0]?.id || '';

  // Form State for Submitting RPE
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(defaultPlayerId);
  const [rpe, setRpe] = useState<number>(7);
  const [whatWentWell, setWhatWentWell] = useState<string>('');
  const [difficulties, setDifficulties] = useState<string>('');
  const [otherNotes, setOtherNotes] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Filter state for analytics table
  const [filterSessionId, setFilterSessionId] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<'all' | 'avanti' | 'trequarti'>('all');
  const [exportRange, setExportRange] = useState<'week' | 'season'>('week');

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  const targetPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId) || players[0];
  }, [players, selectedPlayerId]);

  const calculatedLoad = (selectedSession?.plannedDurationMin || 90) * rpe;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !targetPlayer) return;

    await submitRpeFeedback({
      sessionId: selectedSession.id,
      sessionDate: selectedSession.date,
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      rpe,
      sessionLoad: calculatedLoad,
      whatWentWell: whatWentWell.trim() ? whatWentWell : undefined,
      difficulties: difficulties.trim() ? difficulties : undefined,
      otherNotes: otherNotes.trim() ? otherNotes : undefined
    });

    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 4000);
    setWhatWentWell('');
    setDifficulties('');
    setOtherNotes('');
  };

  // Media RPE e carico per sessione
  const chartData = useMemo(() => {
    return sessions.map(session => {
      const feedbacksForSession = rpeFeedbacks.filter(f => f.sessionId === session.id);
      if (feedbacksForSession.length === 0) {
        return {
          name: session.date.slice(5),
          title: session.title,
          rpeProgrammato: session.plannedRpe,
          rpeMedioSquadra: 0,
          caricoMedioUA: 0
        };
      }

      const avgRpe = Math.round((feedbacksForSession.reduce((acc, f) => acc + f.rpe, 0) / feedbacksForSession.length) * 10) / 10;
      const avgLoad = Math.round(feedbacksForSession.reduce((acc, f) => acc + f.sessionLoad, 0) / feedbacksForSession.length);

      return {
        name: session.date.slice(5),
        title: session.title,
        rpeProgrammato: session.plannedRpe,
        rpeMedioSquadra: avgRpe,
        caricoMedioUA: avgLoad
      };
    });
  }, [sessions, rpeFeedbacks]);

  // Media RPE periodizzata per settimana (lunedì della settimana come chiave)
  const weeklyData = useMemo(() => {
    const byWeek = new Map<string, { totalRpe: number; count: number }>();
    rpeFeedbacks.forEach(f => {
      const key = getWeekKey(f.sessionDate);
      const entry = byWeek.get(key) || { totalRpe: 0, count: 0 };
      entry.totalRpe += f.rpe;
      entry.count += 1;
      byWeek.set(key, entry);
    });
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, { totalRpe, count }]) => ({
        settimana: week,
        rpeMedioSettimanale: Math.round((totalRpe / count) * 10) / 10
      }));
  }, [rpeFeedbacks]);

  // Department comparison (solo RPE medio)
  const departmentStats = useMemo(() => {
    const avantiPlayerIds = new Set(players.filter(p => p.department === 'avanti').map(p => p.id));
    const trequartiPlayerIds = new Set(players.filter(p => p.department === 'trequarti').map(p => p.id));

    const avantiFeedbacks = rpeFeedbacks.filter(f => avantiPlayerIds.has(f.playerId));
    const trequartiFeedbacks = rpeFeedbacks.filter(f => trequartiPlayerIds.has(f.playerId));

    const avgRpeAvanti = avantiFeedbacks.length ? (avantiFeedbacks.reduce((a, b) => a + b.rpe, 0) / avantiFeedbacks.length).toFixed(1) : '-';
    const avgRpeTrequarti = trequartiFeedbacks.length ? (trequartiFeedbacks.reduce((a, b) => a + b.rpe, 0) / trequartiFeedbacks.length).toFixed(1) : '-';

    return { avgRpeAvanti, avgRpeTrequarti };
  }, [players, rpeFeedbacks]);

  // Workload spike warnings (RPE >= 9)
  const fatigueAlerts = useMemo(() => {
    return rpeFeedbacks.filter(f => f.rpe >= 9);
  }, [rpeFeedbacks]);

  // Filtered feedbacks list
  const filteredFeedbacks = useMemo(() => {
    return rpeFeedbacks.filter(f => {
      const matchSession = filterSessionId === 'all' || f.sessionId === filterSessionId;
      const player = players.find(p => p.id === f.playerId);
      const matchDep = filterDepartment === 'all' || (player && player.department === filterDepartment);
      return matchSession && matchDep;
    });
  }, [rpeFeedbacks, filterSessionId, filterDepartment, players]);

  // Solo le proprie valutazioni, per l'atleta
  const ownFeedbacks = useMemo(() => {
    if (!currentUser) return [];
    return rpeFeedbacks.filter(f => f.playerId === currentUser.id);
  }, [rpeFeedbacks, currentUser]);

  const handleExportCsv = () => {
    const currentWeekKey = getWeekKey(new Date().toISOString().slice(0, 10));
    const source = exportRange === 'week'
      ? filteredFeedbacks.filter(f => getWeekKey(f.sessionDate) === currentWeekKey)
      : filteredFeedbacks;

    exportToCsv(
      `rpe_focus_${exportRange === 'week' ? 'settimana' : 'stagione'}_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Giocatrice', 'RPE', 'Carico (UA)', 'Cosa è andato bene', 'Difficoltà', 'Altre segnalazioni'],
      source.map(f => [
        f.sessionDate,
        `"${f.playerName}"`,
        f.rpe,
        f.sessionLoad,
        `"${(f.whatWentWell || '').replace(/"/g, "'")}"`,
        `"${(f.difficulties || '').replace(/"/g, "'")}"`,
        `"${(f.otherNotes || '').replace(/"/g, "'")}"`
      ])
    );
  };

  return (
    <div id="rpe-focus-container" className="space-y-6 animate-in fade-in duration-300">

      {/* Top Section: Quick Feedback Logger + High level summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Interactive RPE Logger Card */}
        <div className="lg:col-span-6 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center font-bold">
                <Heart className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-base font-serif">Registra RPE Allenamento</h3>
                <p className="text-xs text-gray-400">Valutazione sforzo percepito (Borg CR10)</p>
              </div>
            </div>
            {isPlayer && (
              <span className="px-3 py-1 bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] text-xs font-semibold rounded-full">
                Atleta: {currentUser.name}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">

            {/* Select Session & Athlete */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Sessione di Allenamento:</label>
                <select
                  id="select-rpe-session"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.date} - {s.title} ({s.plannedDurationMin}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Giocatrice / Atleta:</label>
                <select
                  id="select-rpe-player"
                  value={selectedPlayerId}
                  disabled={isPlayer}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37] disabled:opacity-70"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber || '-'} {p.name} ({p.department.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RPE Borg CR10 Slider */}
            <div className="bg-[#1D1D21] p-4 rounded-xl border border-[#2A2A2E] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  RPE (Sforzo Percepito):
                </span>
                <span className={`text-base font-bold px-2.5 py-0.5 rounded-md ${
                  rpe >= 9 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  rpe >= 7 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  rpe >= 5 ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {rpe} / 10
                </span>
              </div>
              <input
                id="slider-rpe-value"
                type="range"
                min="1"
                max="10"
                step="1"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1 (Facilissimo)</span>
                <span>5 (Moderato)</span>
                <span>7 (Duro)</span>
                <span>10 (Massimale)</span>
              </div>
            </div>

            {/* Calculated Session Load (sRPE) */}
            <div className="flex items-center justify-between bg-[#1D1D21] border border-[#D4AF37]/30 p-3.5 rounded-lg">
              <div>
                <p className="text-xs text-[#D4AF37] font-bold">Carico Calcolato della Sessione (sRPE = RPE × Durata):</p>
                <p className="text-[10px] text-gray-400">{rpe} × {selectedSession?.plannedDurationMin || 90} minuti</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#E0E0E1]">{calculatedLoad}</span>
                <span className="text-xs text-[#D4AF37] font-bold ml-1">UA</span>
              </div>
            </div>

            {/* Focus dell'allenamento: commento libero */}
            <div className="space-y-3 bg-[#1D1D21] p-4 rounded-xl border border-[#2A2A2E]">
              <p className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">Focus dell'allenamento:</p>
              <div>
                <label className="block font-semibold text-gray-300 mb-1 text-[11px]">Cosa è andato bene?</label>
                <textarea
                  id="input-rpe-went-well"
                  rows={2}
                  placeholder="es. Ottimo ritmo nei contrattacchi, buona intesa in mischia..."
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-300 mb-1 text-[11px]">Quali difficoltà ho incontrato?</label>
                <textarea
                  id="input-rpe-difficulties"
                  rows={2}
                  placeholder="es. Difficoltà a mantenere il ritmo negli ultimi 10 minuti..."
                  value={difficulties}
                  onChange={(e) => setDifficulties(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-300 mb-1 text-[11px]">Altre segnalazioni:</label>
                <textarea
                  id="input-rpe-other-notes"
                  rows={2}
                  placeholder="es. Fastidio muscolare, contatto subito, note per lo staff..."
                  value={otherNotes}
                  onChange={(e) => setOtherNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-1">
              {submittedSuccess ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Feedback registrato con successo!</span>
                </div>
              ) : <div />}

              <button
                id="btn-submit-rpe-feedback"
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Invia Valutazione</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right: coach-only summary, or own history for players */}
        {isPlayer ? (
          <div className="lg:col-span-6 bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-2xl">
            <h3 className="text-[#E0E0E1] font-bold text-sm font-serif mb-3">Le Mie Valutazioni Recenti</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {ownFeedbacks.length > 0 ? (
                ownFeedbacks.slice().reverse().map(f => (
                  <div key={f.id} className="bg-[#1D1D21] border border-[#2A2A2E] p-3 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-400">{f.sessionDate}</span>
                      <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 rounded font-bold">RPE {f.rpe}/10</span>
                    </div>
                    {f.whatWentWell && <p className="text-gray-300 mt-1"><span className="text-emerald-400 font-semibold">Bene:</span> {f.whatWentWell}</p>}
                    {f.difficulties && <p className="text-gray-300 mt-1"><span className="text-amber-400 font-semibold">Difficoltà:</span> {f.difficulties}</p>}
                    {f.otherNotes && <p className="text-gray-300 mt-1"><span className="text-gray-400 font-semibold">Altro:</span> {f.otherNotes}</p>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-2 text-center">Nessuna valutazione registrata finora.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-6 space-y-4">

            {/* Department Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Reparto Avanti</span>
                  <span className="text-base">🏉</span>
                </div>
                <div className="mt-3 text-center bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">RPE Medio</p>
                  <p className="text-xl font-bold text-[#D4AF37] mt-0.5">{departmentStats.avgRpeAvanti}</p>
                </div>
              </div>

              <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Reparto Trequarti</span>
                  <span className="text-base">⚡</span>
                </div>
                <div className="mt-3 text-center bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">RPE Medio</p>
                  <p className="text-xl font-bold text-blue-400 mt-0.5">{departmentStats.avgRpeTrequarti}</p>
                </div>
              </div>
            </div>

            {/* High Fatigue / Spike Alerts */}
            <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3 mb-3">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Avvisi Sovraccarico & Picchi RPE (≥ 9)
                </h4>
                <span className="text-xs bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full font-bold border border-red-500/30">
                  {fatigueAlerts.length} Segnalazioni
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {fatigueAlerts.length > 0 ? (
                  fatigueAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between bg-[#1D1D21] border border-[#2A2A2E] p-3 rounded-lg text-xs">
                      <div>
                        <p className="font-bold text-[#E0E0E1]">{alert.playerName}</p>
                        <p className="text-[10px] text-gray-400">Seduta: {alert.sessionDate} • {alert.otherNotes || alert.difficulties || 'Nessuna nota specifica'}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded font-bold text-xs">
                          RPE {alert.rpe}/10
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Carico: {alert.sessionLoad} UA</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-2 text-center">Nessun picco di sovraccarico anomalo rilevato nelle ultime sedute.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Vista Allenatore: grafici RPE medio per sessione e periodizzato (solo staff) */}
      {!isPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Trend RPE per sessione */}
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-sm font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                  RPE Medio per Sessione vs Programmato
                </h3>
                <p className="text-xs text-gray-400">Confronto tra intensità programmata dal coach e percepita dalle giocatrici</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#6B7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121214', borderColor: '#2A2A2E', borderRadius: '8px', color: '#E0E0E1', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="rpeProgrammato" name="RPE Previsto Coach" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="rpeMedioSquadra" name="RPE Effettivo Squadra" stroke="#D4AF37" strokeWidth={3} dot={{ r: 5, fill: '#D4AF37' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend RPE periodizzato per settimana */}
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-sm font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  RPE Medio Settimanale (Periodizzazione)
                </h3>
                <p className="text-xs text-gray-400">Andamento del carico percepito settimana su settimana</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" />
                  <XAxis dataKey="settimana" stroke="#6B7280" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#6B7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121214', borderColor: '#2A2A2E', borderRadius: '8px', color: '#E0E0E1', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="rpeMedioSettimanale" name="RPE Medio Settimana" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Feedbacks History Table (solo staff) */}
      {!isPlayer && (
        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl shadow-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[#E0E0E1] font-bold text-sm font-serif">Registro Completo Feedback Atlete</h3>
              <p className="text-xs text-gray-400">Tutti i punteggi RPE e i commenti sul focus registrati dalle giocatrici</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterSessionId}
                onChange={(e) => setFilterSessionId(e.target.value)}
                className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Tutte le Sessioni</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.date} - {s.title}</option>
                ))}
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value as any)}
                className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Tutti i Reparti</option>
                <option value="avanti">Avanti</option>
                <option value="trequarti">Trequarti</option>
              </select>

              <select
                value={exportRange}
                onChange={(e) => setExportRange(e.target.value as 'week' | 'season')}
                className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="week">Settimana corrente</option>
                <option value="season">Stagione intera</option>
              </select>

              <button
                id="btn-export-rpe-csv"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Esporta CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A0A0B] sticky top-0 text-gray-300 font-bold uppercase tracking-widest border-b border-[#2A2A2E]">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Giocatrice</th>
                  <th className="py-2.5 px-2 text-center">RPE</th>
                  <th className="py-2.5 px-3 text-center">Carico (UA)</th>
                  <th className="py-2.5 px-4">Cosa è andato bene</th>
                  <th className="py-2.5 px-4">Difficoltà</th>
                  <th className="py-2.5 px-4">Altre segnalazioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E]/60 text-gray-300">
                {filteredFeedbacks.map(f => (
                  <tr key={f.id} className="hover:bg-[#1D1D21]/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-400">{f.sessionDate}</td>
                    <td className="py-2.5 px-3 font-bold text-[#E0E0E1]">{f.playerName}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        f.rpe >= 8 ? 'bg-red-500/20 text-red-400' :
                        f.rpe >= 6 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {f.rpe}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#D4AF37]">{f.sessionLoad}</td>
                    <td className="py-2.5 px-4 text-gray-400 truncate max-w-xs">{f.whatWentWell || '-'}</td>
                    <td className="py-2.5 px-4 text-gray-400 truncate max-w-xs">{f.difficulties || '-'}</td>
                    <td className="py-2.5 px-4 text-gray-400 truncate max-w-xs">{f.otherNotes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
