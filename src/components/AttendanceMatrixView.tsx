import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/csvExport';
import { 
  AttendanceRecord, 
  AttendanceStatus, 
  TrainingSession, 
  UserProfile, 
  RugbyDepartment 
} from '../types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Bandage,
  Download,
  Check,
  Edit3,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Info,
  Lock,
  Unlock,
  CalendarClock
} from 'lucide-react';

// Monday (start) of the ISO week containing the given YYYY-MM-DD date
const getMondayOfWeek = (dateStr: string): Date => {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

// Sunday (start) of the week containing the given YYYY-MM-DD date
const getSundayOfWeek = (dateStr: string): Date => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

// Local YYYY-MM-DD (not toISOString, which shifts to UTC and can land on
// the wrong calendar day for timezones ahead of UTC like Europe/Rome)
const toDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatItDate = (d: Date): string => d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });

// e.g. "Dom 31 Ago" for a session column header
const formatColumnHeader = (dateStr: string): string => {
  const d = new Date(`${dateStr}T00:00:00`);
  const weekday = d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
  const dayMonth = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).replace('.', '');
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}`;
};

export const AttendanceMatrixView: React.FC = () => {
  const { players, sessions, attendances, updateAttendance, isSyncing, attendanceWindowOpen, setAttendanceWindowOpen } = useData();
  const { currentUser } = useAuth();

  const [selfDeclareCell, setSelfDeclareCell] = useState<{
    recordId: string;
    sessionTitle: string;
    sessionDate: string;
    currentStatus: AttendanceStatus;
    note: string;
  } | null>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<'all' | 'avanti' | 'trequarti'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // 0 = settimana corrente, -1 = precedente, +1 = successiva, ecc.
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCell, setEditingCell] = useState<{
    recordId: string;
    playerName: string;
    sessionTitle: string;
    currentStatus: AttendanceStatus;
    notes: string;
    lateMin: number;
  } | null>(null);

  const isStaff = currentUser?.role !== 'player';

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchDep = selectedDepartment === 'all' || p.department === selectedDepartment;
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.jerseyNumber && p.jerseyNumber.toString().includes(searchQuery)) ||
                         p.position.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDep && matchQuery;
    });
  }, [players, selectedDepartment, searchQuery]);

  // Active or completed sessions for columns
  const activeSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions]);

  // Matrix columns show one week at a time (Sunday to Saturday, left to
  // right), navigable with weekOffset, instead of listing every session ever
  // created.
  const weekStart = useMemo(() => {
    const d = getSundayOfWeek(new Date().toISOString().slice(0, 10));
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const currentWeekSessions = useMemo(() => {
    const sundayKey = toDateKey(weekStart);
    const saturdayKey = toDateKey(weekEnd);
    return activeSessions.filter(s => s.date >= sundayKey && s.date <= saturdayKey);
  }, [activeSessions, weekStart, weekEnd]);

  // Calculate overall attendance stats
  const stats = useMemo(() => {
    let totalP = 0;
    let totalAG = 0;
    let totalAI = 0;
    let totalDIF = 0;
    let totalRIT = 0;
    let totalRecords = attendances.length;

    attendances.forEach(a => {
      if (a.status === 'present') totalP++;
      else if (a.status === 'absent_justified') totalAG++;
      else if (a.status === 'absent_unjustified') totalAI++;
      else if (a.status === 'injured_diff') totalDIF++;
      else if (a.status === 'late') totalRIT++;
    });

    const presentRate = totalRecords > 0 ? Math.round(((totalP + totalRIT) / totalRecords) * 100) : 0;

    return { totalP, totalAG, totalAI, totalDIF, totalRIT, presentRate, totalRecords };
  }, [attendances]);

  // Helper for single player presence percentage
  const getPlayerPresencePct = (playerId: string) => {
    const playerAtts = attendances.filter(a => a.playerId === playerId);
    if (playerAtts.length === 0) return 100;
    const presentCount = playerAtts.filter(a => a.status === 'present' || a.status === 'late').length;
    return Math.round((presentCount / playerAtts.length) * 100);
  };

  const getRecord = (sessionId: string, playerId: string): AttendanceRecord | undefined => {
    return attendances.find(a => a.sessionId === sessionId && a.playerId === playerId);
  };

  const renderStatusBadge = (status: AttendanceStatus, isClickable = true) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs shadow-sm hover:bg-emerald-500/30 transition-colors">
            P
          </span>
        );
      case 'absent_justified':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs shadow-sm hover:bg-amber-500/30 transition-colors">
            AG
          </span>
        );
      case 'absent_unjustified':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs shadow-sm hover:bg-rose-500/30 transition-colors">
            AI
          </span>
        );
      case 'injured_diff':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-xs shadow-sm hover:bg-cyan-500/30 transition-colors">
            DIF
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs shadow-sm hover:bg-orange-500/30 transition-colors">
            RIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-500 text-xs">
            -
          </span>
        );
    }
  };

  // A player can self-declare only on her own row, only for sessions not
  // yet played, and only while the coaches keep the window open.
  const canSelfDeclare = (player: UserProfile, session: TrainingSession) =>
    !isStaff && currentUser?.id === player.id && session.status === 'scheduled' && attendanceWindowOpen;

  const handleCellClick = (record: AttendanceRecord | undefined, player: UserProfile, session: TrainingSession) => {
    const currentStatus = record ? record.status : (player.status === 'injured' ? 'injured_diff' : 'present');
    const recId = record ? record.id : `att-${session.id}-${player.id}`;

    if (isStaff) {
      setEditingCell({
        recordId: recId,
        playerName: player.name,
        sessionTitle: session.title,
        currentStatus,
        notes: record?.staffNotes || '',
        lateMin: record?.lateMinutes || (currentStatus === 'late' ? 15 : 0)
      });
      return;
    }

    if (canSelfDeclare(player, session)) {
      setSelfDeclareCell({
        recordId: recId,
        sessionTitle: session.title,
        sessionDate: session.date,
        currentStatus: currentStatus === 'late' || currentStatus === 'injured_diff' ? 'present' : currentStatus,
        note: record?.staffNotes || ''
      });
    }
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    await updateAttendance(editingCell.recordId, editingCell.currentStatus, editingCell.notes, editingCell.lateMin);
    setEditingCell(null);
  };

  const saveSelfDeclare = async () => {
    if (!selfDeclareCell) return;
    await updateAttendance(selfDeclareCell.recordId, selfDeclareCell.currentStatus, selfDeclareCell.note);
    setSelfDeclareCell(null);
  };

  const exportAttendanceCSV = () => {
    const headers = ['Numero', 'Nome Atleta', 'Ruolo', 'Reparto', 'Presenze %', ...activeSessions.map(s => `${s.date} - ${s.title}`)];
    const rows = filteredPlayers.map(p => {
      const pct = getPlayerPresencePct(p.id);
      const sessionValues = activeSessions.map(s => {
        const rec = getRecord(s.id, p.id);
        return rec ? rec.status.toUpperCase() : 'N/A';
      });
      return [p.jerseyNumber || '', `"${p.name}"`, `"${p.position}"`, p.department.toUpperCase(), `${pct}%`, ...sessionValues];
    });

    exportToCsv(`matrice_presenze_rugby_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const currentWeekMonday = formatItDate(getMondayOfWeek(new Date().toISOString().slice(0, 10)));

  return (
    <div id="attendance-matrix-container" className="space-y-6 animate-in fade-in duration-300">

      {/* Attendance Self-Declaration Window Banner */}
      <div className={`rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 border ${
        attendanceWindowOpen
          ? 'bg-emerald-950/30 border-emerald-500/40'
          : 'bg-rose-950/30 border-rose-500/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${attendanceWindowOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {attendanceWindowOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-[#E0E0E1] flex items-center gap-2">
              Inserimento Presenze Atlete: {attendanceWindowOpen ? 'APERTO' : 'CHIUSO'}
            </p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
              <CalendarClock className="w-3 h-3" />
              {attendanceWindowOpen
                ? `Le atlete confermano presenza/assenza alle sessioni programmate entro lunedì ${currentWeekMonday}`
                : 'Le atlete non possono più modificare la propria presenza finché lo staff non riapre la finestra'}
            </p>
          </div>
        </div>

        {isStaff && (
          <button
            id="btn-toggle-attendance-window"
            onClick={() => setAttendanceWindowOpen(!attendanceWindowOpen, currentUser?.name)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
              attendanceWindowOpen
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {attendanceWindowOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{attendanceWindowOpen ? 'Blocca Inserimento' : 'Sblocca Inserimento'}</span>
          </button>
        )}
      </div>

      {/* Header & Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Tasso Presenze</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#E0E0E1]">{stats.presentRate}%</span>
            <span className="text-xs text-[#D4AF37] font-semibold">Rosa 44</span>
          </div>
          <div className="w-full bg-[#1D1D21] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#D4AF37] h-full rounded-full transition-all" style={{ width: `${stats.presentRate}%` }}></div>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Presenti (P)
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalP}</p>
          <p className="text-xs text-gray-500 mt-1">In allenamento</p>
        </div>

        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Giustificate (AG)
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.totalAG}</p>
          <p className="text-xs text-gray-500 mt-1">Studio / lavoro</p>
        </div>

        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Ingiustif. (AI)
          </p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats.totalAI}</p>
          <p className="text-xs text-gray-500 mt-1">Non segnalate</p>
        </div>

        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1.5">
            <Bandage className="w-3.5 h-3.5 text-cyan-400" />
            Differenz. (DIF)
          </p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.totalDIF}</p>
          <p className="text-xs text-gray-500 mt-1">Rehab / Fisio</p>
        </div>

        <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            Ritardi (RIT)
          </p>
          <p className="text-2xl font-bold text-[#D4AF37] mt-1">{stats.totalRIT}</p>
          <p className="text-xs text-gray-500 mt-1">Recuperati</p>
        </div>
      </div>

      {/* Action & Filter Controls */}
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Search & Department Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-matrix-players"
              type="text"
              placeholder="Cerca per nome, maglia o ruolo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-sm text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div className="flex items-center bg-[#1D1D21] p-1 rounded-lg border border-[#2A2A2E]">
            <button
              id="filter-dep-all"
              onClick={() => setSelectedDepartment('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedDepartment === 'all'
                  ? 'bg-[#D4AF37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-[#E0E0E1]'
              }`}
            >
              Tutte le Atlete ({players.length})
            </button>
            <button
              id="filter-dep-avanti"
              onClick={() => setSelectedDepartment('avanti')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedDepartment === 'avanti'
                  ? 'bg-[#D4AF37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-[#E0E0E1]'
              }`}
            >
              Avanti ({players.filter(p => p.department === 'avanti').length})
            </button>
            <button
              id="filter-dep-trequarti"
              onClick={() => setSelectedDepartment('trequarti')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedDepartment === 'trequarti'
                  ? 'bg-[#D4AF37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-[#E0E0E1]'
              }`}
            >
              Trequarti ({players.filter(p => p.department === 'trequarti').length})
            </button>
          </div>
        </div>

        {/* Staff Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-attendance-csv"
            onClick={exportAttendanceCSV}
            className="px-3.5 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 border border-[#2A2A2E] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 px-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-300 font-semibold uppercase tracking-wider text-[11px]">Legenda:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center">P</span>
            <span>Presente</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center justify-center">AG</span>
            <span>Assente Giustificata</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center justify-center">AI</span>
            <span>Assente Ingiustificata</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold flex items-center justify-center">DIF</span>
            <span>Infortunio / Differenziato</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold flex items-center justify-center">RIT</span>
            <span>Ritardo</span>
          </span>
        </div>
        <p className="text-[11px] text-[#D4AF37] italic flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          {isStaff
            ? 'Clicca su una casella per modificare stato, note o minuti di ritardo'
            : attendanceWindowOpen
              ? 'Clicca sulle tue caselle delle sessioni programmate per confermare presenza o assenza'
              : 'Visualizzazione presenze rosa'}
        </p>
      </div>

      {/* Main Interactive Matrix Table */}
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2A2A2E] bg-[#0A0A0B] text-[11px] text-gray-400 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              id="btn-week-prev"
              onClick={() => setWeekOffset(o => o - 1)}
              title="Settimana precedente"
              className="p-1.5 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>
              {weekOffset === 0 ? 'Settimana corrente' : 'Settimana'}: <span className="text-[#D4AF37] font-semibold">{formatColumnHeader(toDateKey(weekStart))} - {formatColumnHeader(toDateKey(weekEnd))}</span>
            </span>
            <button
              id="btn-week-next"
              onClick={() => setWeekOffset(o => o + 1)}
              title="Settimana successiva"
              className="p-1.5 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {weekOffset !== 0 && (
              <button
                id="btn-week-today"
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 bg-[#1D1D21] hover:bg-[#26262B] text-[#D4AF37] text-[11px] font-semibold rounded-lg border border-[#2A2A2E] transition-colors"
              >
                Torna a Oggi
              </button>
            )}
          </div>
          {currentWeekSessions.length === 0 && (
            <span className="text-gray-500 italic">Nessuna sessione programmata questa settimana</span>
          )}
        </div>
        <div className="overflow-x-auto max-h-[700px] scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0A0A0B] sticky top-0 z-20 border-b border-[#2A2A2E]">
              <tr>
                {/* Fixed Athlete Info Column */}
                <th className="py-3.5 px-4 text-xs font-bold text-gray-300 uppercase tracking-widest sticky left-0 z-30 bg-[#0A0A0B] border-r border-[#2A2A2E] min-w-[250px] sm:min-w-[280px]">
                  Giocatrice Rosa ({filteredPlayers.length})
                </th>
                
                {/* Presence Pct Column */}
                <th className="py-3.5 px-3 text-xs font-bold text-center text-gray-300 uppercase tracking-widest border-r border-[#2A2A2E] min-w-[90px]">
                  Presenze %
                </th>

                {/* Session Columns (current week, Sunday to Saturday) */}
                {currentWeekSessions.map(session => (
                  <th key={session.id} className="py-3 px-3 text-xs font-semibold text-gray-200 border-r border-[#2A2A2E] min-w-[120px] text-center">
                    <div className="font-bold text-[#E0E0E1] text-xs">{formatColumnHeader(session.date)}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[110px]">{session.title}</div>
                    <span className={`inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold mt-0.5 ${
                      session.type === 'scrum_lineout' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                      session.type === 'kicking_specialists' ? 'bg-indigo-500/20 text-indigo-300' :
                      session.type === 'match_captain_run' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {session.type.replace('_', ' ')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#2A2A2E]/60 text-xs">
              {filteredPlayers.map((player, idx) => {
                const presencePct = getPlayerPresencePct(player.id);
                return (
                  <tr key={player.id} className="hover:bg-[#1D1D21]/60 transition-colors">
                    {/* Sticky Player Name & Position */}
                    <td className="py-2.5 px-4 sticky left-0 z-10 bg-[#121214] border-r border-[#2A2A2E]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded bg-[#1D1D21] text-[#D4AF37] font-bold text-[11px] flex items-center justify-center border border-[#2A2A2E]">
                          {player.jerseyNumber || (idx + 1)}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-[#E0E0E1] flex items-center gap-1.5">
                            <span className="truncate">{player.name}</span>
                            {player.status === 'injured' && (
                              <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] rounded font-semibold">
                                Infortunio
                              </span>
                            )}
                            {player.status === 'rehab_diff' && (
                              <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] rounded font-semibold">
                                Differenziato
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                            <span>{player.position}</span>
                            <span className="text-gray-600">•</span>
                            <span className={player.department === 'avanti' ? 'text-[#D4AF37]' : 'text-purple-400'}>
                              {player.department.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Presence Percentage with Bar */}
                    <td className="py-2.5 px-3 border-r border-[#2A2A2E] text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`font-bold text-xs ${presencePct >= 80 ? 'text-emerald-400' : presencePct >= 60 ? 'text-[#D4AF37]' : 'text-rose-400'}`}>
                          {presencePct}%
                        </span>
                        <div className="w-12 bg-[#1D1D21] h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${presencePct >= 80 ? 'bg-emerald-500' : presencePct >= 60 ? 'bg-[#D4AF37]' : 'bg-rose-500'}`}
                            style={{ width: `${presencePct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Session Presence Cells (current week) */}
                    {currentWeekSessions.map(session => {
                      const record = getRecord(session.id, player.id);
                      const status: AttendanceStatus = record 
                        ? record.status 
                        : (player.status === 'injured' ? 'injured_diff' : 'present');

                      const selfDeclareEligible = canSelfDeclare(player, session);

                      return (
                        <td
                          key={session.id}
                          onClick={() => handleCellClick(record, player, session)}
                          className={`py-2 px-2 border-r border-[#2A2A2E]/60 text-center transition-all ${
                            isStaff || selfDeclareEligible ? 'cursor-pointer hover:bg-[#D4AF37]/10' : ''
                          } ${selfDeclareEligible ? 'ring-1 ring-inset ring-[#D4AF37]/30' : ''}`}
                          title={record?.staffNotes ? `Note staff: ${record.staffNotes}` : selfDeclareEligible ? 'Clicca per confermare presenza o assenza' : undefined}
                        >
                          <div className="flex items-center justify-center relative group">
                            {renderStatusBadge(status)}
                            {record?.staffNotes && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37] ring-2 ring-[#121214]" title={record.staffNotes} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={currentWeekSessions.length + 2} className="py-12 text-center text-gray-400">
                    <p className="text-[#E0E0E1] font-bold text-sm font-serif">Nessuna atleta trovata</p>
                    <p className="text-xs text-gray-500 mt-1">Aggiungi le atlete alla rosa per visualizzare e compilare il foglio presenze.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Quick Edit Modal Popover */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between border-b border-[#2A2A2E] pb-3">
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                  Modifica Presenza Staff
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-semibold text-[#E0E0E1]">{editingCell.playerName}</span> — {editingCell.sessionTitle}
                </p>
              </div>
              <button 
                onClick={() => setEditingCell(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1D1D21]"
              >
                ✕
              </button>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Seleziona Stato Presenza:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'present', label: 'Presente (P)' },
                  { id: 'absent_justified', label: 'Ass. Giustificata (AG)' },
                  { id: 'absent_unjustified', label: 'Ass. Ingiustificata (AI)' },
                  { id: 'injured_diff', label: 'Differenziato (DIF)' },
                  { id: 'late', label: 'Ritardo (RIT)' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEditingCell({ ...editingCell, currentStatus: item.id as AttendanceStatus })}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                      editingCell.currentStatus === item.id
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                        : 'bg-[#1D1D21] text-gray-300 border-[#2A2A2E] hover:bg-[#26262B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Late Minutes input if status is 'late' */}
            {editingCell.currentStatus === 'late' && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Minuti di Ritardo:
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={editingCell.lateMin}
                  onChange={(e) => setEditingCell({ ...editingCell, lateMin: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}

            {/* Staff Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Note Staff Tecnico / Giustificazione:
              </label>
              <textarea
                rows={3}
                placeholder="es. Permesso università, lavoro, problema muscolare concordato..."
                value={editingCell.notes}
                onChange={(e) => setEditingCell({ ...editingCell, notes: e.target.value })}
                className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2A2A2E]">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 text-xs font-semibold rounded-lg border border-[#2A2A2E]"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={saveCellEdit}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Salva Modifica
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Athlete Self-Declaration Modal */}
      {selfDeclareCell && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">

            <div className="flex items-start justify-between border-b border-[#2A2A2E] pb-3">
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-base flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-[#D4AF37]" />
                  Conferma Presenza
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-semibold text-[#E0E0E1]">{selfDeclareCell.sessionTitle}</span> — {selfDeclareCell.sessionDate}
                </p>
              </div>
              <button
                onClick={() => setSelfDeclareCell(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1D1D21]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Ci sarai?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'present', label: 'Presente' },
                  { id: 'absent_justified', label: 'Assente Giustificata' },
                  { id: 'absent_unjustified', label: 'Assente Non Giustificata' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelfDeclareCell({ ...selfDeclareCell, currentStatus: item.id as AttendanceStatus })}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all text-left ${
                      selfDeclareCell.currentStatus === item.id
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                        : 'bg-[#1D1D21] text-gray-300 border-[#2A2A2E] hover:bg-[#26262B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {selfDeclareCell.currentStatus === 'absent_justified' && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Motivo dell'assenza (facoltativo):
                </label>
                <textarea
                  rows={2}
                  placeholder="es. Università, lavoro, motivi personali..."
                  value={selfDeclareCell.note}
                  onChange={(e) => setSelfDeclareCell({ ...selfDeclareCell, note: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2A2A2E]">
              <button
                type="button"
                onClick={() => setSelfDeclareCell(null)}
                className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 text-xs font-semibold rounded-lg border border-[#2A2A2E]"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={saveSelfDeclare}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Conferma
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
