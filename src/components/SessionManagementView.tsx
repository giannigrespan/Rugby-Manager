import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { TrainingSession, TrainingType } from '../types';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Target, 
  Activity, 
  CalendarSync, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Share2
} from 'lucide-react';

export const SessionManagementView: React.FC = () => {
  const { sessions, addOrUpdateSession, deleteSession, generateGoogleCalendarUrl, exportToIcsFile, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role !== 'player';

  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [location, setLocation] = useState('Campo Principale 1');
  const [type, setType] = useState<TrainingType>('technical_tactical');
  const [departmentTarget, setDepartmentTarget] = useState<TrainingSession['departmentTarget']>('all');
  const [primaryFocus, setPrimaryFocus] = useState('');
  const [secondaryFocus, setSecondaryFocus] = useState('');
  const [plannedDurationMin, setPlannedDurationMin] = useState(90);
  const [plannedRpe, setPlannedRpe] = useState(7);
  const [intensity, setIntensity] = useState<TrainingSession['intensity']>('high');
  const [coachNotes, setCoachNotes] = useState('');
  const [status, setStatus] = useState<TrainingSession['status']>('scheduled');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;

    const newSession: TrainingSession = {
      id: editingSession ? editingSession.id : `s-${Date.now()}`,
      title,
      date,
      time,
      endTime,
      location,
      type,
      departmentTarget,
      primaryFocus,
      secondaryFocus,
      plannedDurationMin,
      plannedRpe,
      intensity,
      coachNotes: coachNotes.trim() ? coachNotes : undefined,
      status,
      createdAt: editingSession ? editingSession.createdAt : new Date().toISOString()
    };

    await addOrUpdateSession(newSession);
    setShowModal(false);
    setEditingSession(null);
    resetForm();
  };

  const startEdit = (s: TrainingSession) => {
    setEditingSession(s);
    setTitle(s.title);
    setDate(s.date);
    setTime(s.time);
    setEndTime(s.endTime);
    setLocation(s.location);
    setType(s.type);
    setDepartmentTarget(s.departmentTarget);
    setPrimaryFocus(s.primaryFocus);
    setSecondaryFocus(s.secondaryFocus);
    setPlannedDurationMin(s.plannedDurationMin);
    setPlannedRpe(s.plannedRpe);
    setIntensity(s.intensity);
    setCoachNotes(s.coachNotes || '');
    setStatus(s.status);
    setShowModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('19:00');
    setEndTime('20:30');
    setLocation('Campo Principale 1');
    setType('technical_tactical');
    setDepartmentTarget('all');
    setPrimaryFocus('');
    setSecondaryFocus('');
    setPlannedDurationMin(90);
    setPlannedRpe(7);
    setIntensity('high');
    setCoachNotes('');
    setStatus('scheduled');
  };

  return (
    <div id="session-management-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center text-2xl font-bold">
            <Calendar className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Gestione Sessioni & Focus Tattico</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                {sessions.length} Allenamenti
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Pianificazione calendario allenamenti, definizione focus primario/secondario, RPE previsto ed export verso calendari esterni
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToIcsFile(sessions)}
            className="px-3.5 py-2.5 bg-[#1D1D21] hover:bg-[#26262B] text-[#E0E0E1] text-xs font-semibold rounded-lg border border-[#2A2A2E] flex items-center gap-1.5 transition-colors"
          >
            <CalendarSync className="w-4 h-4 text-[#D4AF37]" />
            <span>Scarica Calendario Completo (.ICS)</span>
          </button>

          {isStaff && (
            <button
              id="btn-create-new-session"
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Programma Nuovo Allenamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Sessions Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.map(s => {
          const googleCalUrl = generateGoogleCalendarUrl(s);

          return (
            <div 
              key={s.id} 
              className={`bg-[#121214] border rounded-xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between ${
                s.status === 'in_progress' ? 'border-[#D4AF37] shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40' :
                s.status === 'completed' ? 'border-[#2A2A2E]' :
                'border-[#2A2A2E] hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge & Date */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      s.status === 'completed' ? 'bg-[#1D1D21] text-gray-400 border-[#2A2A2E]' :
                      s.status === 'in_progress' ? 'bg-[#D4AF37]/30 text-[#D4AF37] border-[#D4AF37] animate-pulse' :
                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {s.status === 'completed' ? 'COMPLETATO' : s.status === 'in_progress' ? 'IN CORSO' : 'PROGRAMMATO'}
                    </span>

                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-[#1D1D21] px-2 py-0.5 rounded border border-[#2A2A2E]">
                      {s.departmentTarget.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-xs font-black text-[#D4AF37] bg-[#1D1D21] border border-[#2A2A2E] px-2 py-0.5 rounded-lg">
                    RPE Previsto {s.plannedRpe}/10
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#E0E0E1] leading-snug font-serif">{s.title}</h3>

                {/* Meta details */}
                <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] space-y-1.5 text-xs text-gray-300">
                  <div className="flex items-center gap-3 text-gray-300">
                    <span className="flex items-center gap-1.5 font-bold text-[#E0E0E1]">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {s.date}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {s.time} - {s.endTime} ({s.plannedDurationMin} min)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{s.location}</span>
                  </div>
                </div>

                {/* Primary & Secondary Focus */}
                <div className="space-y-2 text-xs">
                  <div className="bg-[#1D1D21] border border-[#2A2A2E] p-2.5 rounded-lg">
                    <span className="font-bold text-[#D4AF37] block text-[11px] uppercase tracking-wider">Focus Primario:</span>
                    <p className="text-[#E0E0E1] mt-0.5">{s.primaryFocus}</p>
                  </div>

                  {s.secondaryFocus && (
                    <div className="bg-[#1D1D21] border border-[#2A2A2E] p-2.5 rounded-lg">
                      <span className="font-bold text-gray-400 block text-[11px] uppercase tracking-wider">Focus Secondario:</span>
                      <p className="text-gray-300 mt-0.5">{s.secondaryFocus}</p>
                    </div>
                  )}
                </div>

                {s.coachNotes && (
                  <p className="text-xs text-gray-400 italic">"{s.coachNotes}"</p>
                )}
              </div>

              {/* Action Buttons: Calendar Sync + Edit */}
              <div className="pt-3 border-t border-[#2A2A2E] flex items-center justify-between gap-2 text-xs">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-[#1D1D21] hover:bg-[#26262B] text-[#D4AF37] hover:text-[#C09F30] border border-[#2A2A2E] rounded-lg flex items-center gap-1 font-semibold transition-all"
                  title="Aggiungi questo singolo allenamento al tuo Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Calendar</span>
                </a>

                {isStaff && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(s)}
                      className="p-1.5 text-gray-400 hover:text-[#D4AF37] hover:bg-[#1D1D21] rounded-lg"
                      title="Modifica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#1D1D21] rounded-lg"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="col-span-full bg-[#121214] border border-[#2A2A2E] rounded-xl p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#E0E0E1] mb-1 font-serif">Nessuna sessione di allenamento</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
              Non ci sono ancora allenamenti programmati. Crea la prima seduta per pianificare focus, orari e sincronizzazione con Google Calendar / iCal.
            </p>
            {isStaff && (
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pianifica Primo Allenamento</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                {editingSession ? 'Modifica Sessione di Allenamento' : 'Programma Nuovo Allenamento Rugby'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Titolo Seduta:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Martedì: Mischia, Touche & Contrattacco..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Data:</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Inizio (Ora):</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Fine (Ora):</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Luogo / Campo:</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Tipologia Allenamento:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="technical_tactical">Tecnico - Tattico</option>
                    <option value="physical_strength">Fisico / Forza & Speed</option>
                    <option value="scrum_lineout">Mischia Ordinata & Touche</option>
                    <option value="kicking_specialists">Calci Trequarti</option>
                    <option value="recovery_mobility">Recupero & Mobilità</option>
                    <option value="match_captain_run">Captain's Run / Partita</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Reparto Target:</label>
                  <select
                    value={departmentTarget}
                    onChange={(e) => setDepartmentTarget(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">Tutta la Squadra</option>
                    <option value="avanti">Solo Avanti</option>
                    <option value="trequarti">Solo Trequarti</option>
                    <option value="kicking">Specialisti Calci</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">RPE Previsto (1-10):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={plannedRpe}
                    onChange={(e) => setPlannedRpe(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Stato Sessione:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="scheduled">Programmata</option>
                    <option value="in_progress">In Corso</option>
                    <option value="completed">Completata</option>
                    <option value="cancelled">Annullata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Focus Primario:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Difesa di salita aggressiva e placcaggio doppio..."
                  value={primaryFocus}
                  onChange={(e) => setPrimaryFocus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Focus Secondario:</label>
                <input
                  type="text"
                  placeholder="es. Velocità di riposizionamento nei canali 15m..."
                  value={secondaryFocus}
                  onChange={(e) => setSecondaryFocus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Note Staff / Attrezzatura Richiesta:</label>
                <textarea
                  rows={2}
                  placeholder="es. Portare scudi pesanti per ingaggi e palloni da fango..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
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
                  Salva Allenamento
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
