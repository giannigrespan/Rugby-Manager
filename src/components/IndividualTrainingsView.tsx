import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { IndividualTrainingLog } from '../types';
import { exportToCsv } from '../utils/csvExport';
import {
  Dumbbell,
  Plus,
  CheckCircle,
  Flame,
  Clock,
  Award,
  User,
  Calendar,
  Activity,
  ShieldCheck,
  Download
} from 'lucide-react';

export const IndividualTrainingsView: React.FC = () => {
  const { players, individualLogs, addIndividualLog, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isPlayer = currentUser?.role === 'player';
  const defaultPlayerId = isPlayer ? currentUser.id : players[0]?.id || '';

  const [showModal, setShowModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(defaultPlayerId);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IndividualTrainingLog['type']>('Palestra / Forza');
  const [durationMin, setDurationMin] = useState(45);
  const [perceivedEffort, setPerceivedEffort] = useState(7);
  const [exercisesDone, setExercisesDone] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player || !title.trim()) return;

    await addIndividualLog({
      playerId: player.id,
      playerName: player.name,
      date: new Date().toISOString().slice(0, 10),
      title,
      type,
      durationMin,
      perceivedEffort,
      exercisesDone,
      notes: notes.trim() ? notes : undefined,
      verifiedByCoach: currentUser?.role !== 'player'
    });

    setShowModal(false);
    setTitle('');
    setExercisesDone('');
    setNotes('');
  };

  const handleExportCsv = () => {
    exportToCsv(
      `sedute_individuali_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Data', 'Atleta', 'Tipo', 'Durata (min)', 'RPE', 'Esercizi', 'Note', 'Verificato'],
      individualLogs.map(log => [
        log.date,
        `"${log.playerName}"`,
        `"${log.type}"`,
        log.durationMin,
        log.perceivedEffort,
        `"${log.exercisesDone.replace(/"/g, "'")}"`,
        `"${(log.notes || '').replace(/"/g, "'")}"`,
        log.verifiedByCoach ? 'Sì' : 'No'
      ])
    );
  };

  return (
    <div id="individual-trainings-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center text-2xl font-bold">
            <Dumbbell className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Allenamenti Individuali & Schede Palestra</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                {individualLogs.length} Registrati
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Lavoro extra personalizzato: potenziamento in palestra, mobilità articolare, velocità e recupero attivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-individual-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Esporta CSV</span>
          </button>
          <button
            id="btn-log-individual-session"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registra Allenamento Individuale</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {individualLogs.map(log => (
          <div key={log.id} className="bg-[#121214] border border-[#2A2A2E] hover:border-[#D4AF37]/40 rounded-xl p-5 shadow-xl space-y-3 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#1D1D21] px-2 py-0.5 rounded border border-[#2A2A2E]">
                  {log.type}
                </span>
                <h3 className="text-base font-bold text-[#E0E0E1] mt-1 font-serif">{log.title}</h3>
                <p className="text-xs font-semibold text-gray-300 mt-0.5">{log.playerName}</p>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-[#D4AF37] bg-[#1D1D21] border border-[#2A2A2E] px-2 py-0.5 rounded-lg">
                  RPE {log.perceivedEffort}/10
                </span>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-gray-500" />
                  {log.durationMin} min
                </p>
              </div>
            </div>

            <div className="bg-[#1D1D21] p-3 rounded-lg border border-[#2A2A2E] text-xs">
              <span className="font-bold text-[#E0E0E1] block mb-1 uppercase tracking-wider text-[11px]">Esercizi e Carichi:</span>
              <p className="text-gray-300">{log.exercisesDone}</p>
            </div>

            {log.notes && (
              <p className="text-xs text-gray-400 italic">"{log.notes}"</p>
            )}

            <div className="pt-2 border-t border-[#2A2A2E] flex items-center justify-between text-xs text-gray-400">
              <span>{log.date}</span>
              {log.verifiedByCoach ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  Verificato dal Preparatore
                </span>
              ) : (
                <span className="text-[#D4AF37]/80">In attesa di verifica coach</span>
              )}
            </div>
          </div>
        ))}

        {individualLogs.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#121214] border border-[#2A2A2E] rounded-xl">
            <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-[#E0E0E1] font-bold text-base font-serif">Nessun Allenamento Individuale Registrato</p>
            <p className="text-xs text-gray-400">Le atlete e lo staff possono registrare qui sessioni extra in palestra o mobilità.</p>
          </div>
        )}
      </div>

      {/* Modal to log session */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <div>
                <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#D4AF37]" />
                  Registra Seduta Individuale
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Data: {new Date().toLocaleDateString('it-IT')} (registrata automaticamente)
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Atleta:</label>
                <select
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Tipo Allenamento:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Palestra / Forza">Palestra / Forza</option>
                    <option value="Cardio / Aerobico">Cardio / Aerobico</option>
                    <option value="Mobilità & Core">Mobilità & Core</option>
                    <option value="Skills Passaggio">Skills Passaggio</option>
                    <option value="Recupero Attivo">Recupero Attivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Durata (minuti):</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={durationMin}
                    onChange={(e) => setDurationMin(parseInt(e.target.value) || 45)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Titolo Seduta:</label>
                <input
                  type="text"
                  placeholder="es. Forza arti inferiori - Squat & Stacchi..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">
                  <span>Sforzo Percepito (RPE):</span>
                  <span className="text-[#D4AF37] font-bold">{perceivedEffort} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={perceivedEffort}
                  onChange={(e) => setPerceivedEffort(parseInt(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Esercizi Svolti & Serie/Carichi:</label>
                <textarea
                  rows={3}
                  placeholder="es. Back Squat 4x5 @ 90kg, Trap bar deadlift 3x6 @ 110kg, Box jumps 3x5..."
                  value={exercisesDone}
                  onChange={(e) => setExercisesDone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Note & Sensazioni:</label>
                <input
                  type="text"
                  placeholder="es. Ottimo feeling sul bilanciere, nessun fastidio..."
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
