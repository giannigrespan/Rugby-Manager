import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { exportToCsv } from '../utils/csvExport';
import { AttendanceStatus, RugbyDepartment, UserProfile } from '../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bandage,
  Clock,
  FileSpreadsheet,
  ShieldQuestion
} from 'lucide-react';

const toDateKey = (d: Date): string => d.toISOString().slice(0, 10);

const formatItDateFull = (dateStr: string): string =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

const STATUS_META: Record<AttendanceStatus, { label: string; short: string; badgeClass: string; icon: React.ElementType; barClass: string }> = {
  present: { label: 'Presente', short: 'P', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, barClass: 'bg-emerald-500' },
  late: { label: 'Ritardo', short: 'RIT', badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock, barClass: 'bg-orange-500' },
  absent_justified: { label: 'Ass. Giustificata', short: 'AG', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle, barClass: 'bg-amber-500' },
  absent_unjustified: { label: 'Ass. Ingiustificata', short: 'AI', badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: XCircle, barClass: 'bg-rose-500' },
  injured_diff: { label: 'Differenziato', short: 'DIF', badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Bandage, barClass: 'bg-cyan-500' }
};

const NOT_RECORDED = { label: 'Non Registrata', short: '-', badgeClass: 'bg-slate-800 text-slate-500 border-[#2A2A2E]', icon: ShieldQuestion, barClass: 'bg-slate-600' };

interface DepartmentGroupProps {
  title: string;
  accentClass: string;
  players: UserProfile[];
  getStatus: (playerId: string) => AttendanceStatus | undefined;
}

const DepartmentGroup: React.FC<DepartmentGroupProps> = ({ title, accentClass, players, getStatus }) => {
  const counts = useMemo(() => {
    const c: Record<AttendanceStatus | 'not_recorded', number> = {
      present: 0, late: 0, absent_justified: 0, absent_unjustified: 0, injured_diff: 0, not_recorded: 0
    };
    players.forEach(p => {
      const status = getStatus(p.id);
      if (status) c[status]++;
      else c.not_recorded++;
    });
    return c;
  }, [players, getStatus]);

  const presentTotal = counts.present + counts.late;
  const rate = players.length > 0 ? Math.round((presentTotal / players.length) * 100) : 0;

  return (
    <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl shadow-xl overflow-hidden">
      <div className={`px-5 py-4 border-b border-[#2A2A2E] flex items-center justify-between ${accentClass}`}>
        <div>
          <h3 className="text-sm font-bold text-[#E0E0E1] uppercase tracking-widest">{title}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{players.length} atlete in reparto</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#E0E0E1]">{rate}%</span>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">presenti</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-4 border-b border-[#2A2A2E]/60">
        {(Object.keys(STATUS_META) as AttendanceStatus[]).map(status => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <div key={status} className="flex flex-col items-center justify-center bg-[#1D1D21] rounded-lg py-2.5 border border-[#2A2A2E]">
              <Icon className={`w-3.5 h-3.5 mb-1 ${meta.badgeClass.split(' ')[1]}`} />
              <span className="text-lg font-bold text-[#E0E0E1] leading-none">{counts[status]}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">{meta.short}</span>
            </div>
          );
        })}
      </div>

      <div className="divide-y divide-[#2A2A2E]/60 max-h-[420px] overflow-y-auto scrollbar-thin">
        {players.length === 0 && (
          <p className="text-center text-xs text-gray-500 py-8">Nessuna atleta in questo reparto.</p>
        )}
        {players.map((p, idx) => {
          const status = getStatus(p.id);
          const meta = status ? STATUS_META[status] : NOT_RECORDED;
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded bg-[#1D1D21] text-[#D4AF37] font-bold text-[11px] flex items-center justify-center border border-[#2A2A2E] flex-shrink-0">
                  {p.jerseyNumber || (idx + 1)}
                </span>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#E0E0E1] truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{p.position}</p>
                </div>
              </div>
              <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg border font-bold text-[10px] flex-shrink-0 ${meta.badgeClass}`}>
                {meta.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DailyAttendanceSummaryView: React.FC = () => {
  const { players, sessions, attendances } = useData();

  const sessionDatesSorted = useMemo(
    () => Array.from(new Set(sessions.map(s => s.date))).sort(),
    [sessions]
  );

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = toDateKey(new Date());
    if (sessionDatesSorted.includes(today)) return today;
    const pastDates = sessionDatesSorted.filter(d => d <= today);
    return pastDates.length > 0 ? pastDates[pastDates.length - 1] : (sessionDatesSorted[sessionDatesSorted.length - 1] || today);
  });

  const daySessions = useMemo(
    () => sessions.filter(s => s.date === selectedDate).sort((a, b) => a.title.localeCompare(b.title)),
    [sessions, selectedDate]
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');

  const dayAttendances = useMemo(() => {
    const sessionIds = new Set(daySessions.map(s => s.id));
    return attendances.filter(a => sessionIds.has(a.sessionId) && (selectedSessionId === 'all' || a.sessionId === selectedSessionId));
  }, [attendances, daySessions, selectedSessionId]);

  // If multiple sessions per day for a player, keep the most restrictive/last-recorded status
  const getStatusForPlayer = useMemo(() => {
    const map = new Map<string, { status: AttendanceStatus; updatedAt: string }>();
    dayAttendances.forEach(a => {
      const existing = map.get(a.playerId);
      if (!existing || new Date(a.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        map.set(a.playerId, { status: a.status, updatedAt: a.updatedAt });
      }
    });
    return (playerId: string) => map.get(playerId)?.status;
  }, [dayAttendances]);

  const departmentPlayers = (dep: RugbyDepartment) => players.filter(p => p.department === dep);

  const goToDate = (offsetDays: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(toDateKey(d));
    setSelectedSessionId('all');
  };

  const exportSummaryCSV = () => {
    const headers = ['Reparto', 'Numero', 'Nome Atleta', 'Ruolo', 'Stato'];
    const rows: (string | number)[][] = [];
    (['avanti', 'trequarti'] as RugbyDepartment[]).forEach(dep => {
      departmentPlayers(dep).forEach(p => {
        const status = getStatusForPlayer(p.id);
        rows.push([dep.toUpperCase(), p.jerseyNumber || '', `"${p.name}"`, `"${p.position}"`, status ? STATUS_META[status].label : NOT_RECORDED.label]);
      });
    });
    exportToCsv(`riepilogo_presenze_${selectedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Date & Session Navigation */}
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            id="btn-prev-day"
            onClick={() => goToDate(-1)}
            className="p-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-[#D4AF37] rounded-lg border border-[#2A2A2E] transition-colors"
            title="Giorno precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
            <input
              id="input-summary-date"
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedSessionId('all'); }}
              className="bg-[#1D1D21] border border-[#2A2A2E] rounded-lg px-3 py-1.5 text-xs text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
            />
            <span className="text-xs text-gray-400 capitalize hidden sm:inline">{formatItDateFull(selectedDate)}</span>
          </div>

          <button
            id="btn-next-day"
            onClick={() => goToDate(1)}
            className="p-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-[#D4AF37] rounded-lg border border-[#2A2A2E] transition-colors"
            title="Giorno successivo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {daySessions.length > 0 && (
            <select
              id="select-summary-session"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-2 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">Tutte le sessioni ({daySessions.length})</option>
              {daySessions.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          )}

          <button
            id="btn-export-summary-csv"
            onClick={exportSummaryCSV}
            className="px-3.5 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 border border-[#2A2A2E] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>

      {daySessions.length === 0 ? (
        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-12 text-center shadow-xl">
          <p className="text-[#E0E0E1] font-bold text-sm font-serif">Nessuna sessione programmata in questa data</p>
          <p className="text-xs text-gray-500 mt-1">Seleziona un'altra data o pianifica una sessione in Gestione Sessioni.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentGroup
            title="Avanti"
            accentClass="bg-[#D4AF37]/5"
            players={departmentPlayers('avanti')}
            getStatus={getStatusForPlayer}
          />
          <DepartmentGroup
            title="Trequarti"
            accentClass="bg-purple-500/5"
            players={departmentPlayers('trequarti')}
            getStatus={getStatusForPlayer}
          />
        </div>
      )}
    </div>
  );
};
