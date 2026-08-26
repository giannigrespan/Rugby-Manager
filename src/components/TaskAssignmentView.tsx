import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { IndividualTask, TaskCategory } from '../types';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Video, 
  Dumbbell, 
  Crosshair, 
  Flame, 
  Activity, 
  Apple, 
  Trash2, 
  Users, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TaskAssignmentView: React.FC = () => {
  const { players, tasks, createTask, toggleTaskCompletion, deleteTask, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role !== 'player';
  const currentUserId = currentUser?.id || 'p-16';

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('video_analysis');
  const [assignedToType, setAssignedToType] = useState<IndividualTask['assignedToType']>('all');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<IndividualTask['frequency']>('weekly');
  const [priority, setPriority] = useState<IndividualTask['priority']>('high');

  const [completionNote, setCompletionNote] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetIds: string[] = [];
    if (assignedToType === 'all') {
      targetIds = players.map(p => p.id);
    } else if (assignedToType === 'avanti') {
      targetIds = players.filter(p => p.department === 'avanti').map(p => p.id);
    } else if (assignedToType === 'trequarti') {
      targetIds = players.filter(p => p.department === 'trequarti').map(p => p.id);
    } else {
      targetIds = selectedPlayerIds;
    }

    await createTask({
      title,
      description,
      category,
      assignedToType,
      assignedPlayerIds: targetIds,
      dueDate,
      frequency,
      priority,
      createdBy: currentUser?.name || 'Staff Tecnico'
    });

    setShowModal(false);
    setTitle('');
    setDescription('');
    setSelectedPlayerIds([]);
  };

  const handleToggle = async (task: IndividualTask, isCompleted: boolean) => {
    if (!isCompleted) {
      // Trigger confetti celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }

    await toggleTaskCompletion(task.id, currentUserId, !isCompleted, completionNote || undefined);
    setCompletingTaskId(null);
    setCompletionNote('');
  };

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'video_analysis': return <Video className="w-4 h-4 text-[#D4AF37]" />;
      case 'gym_strength': return <Dumbbell className="w-4 h-4 text-[#D4AF37]" />;
      case 'kicking_practice': return <Crosshair className="w-4 h-4 text-[#D4AF37]" />;
      case 'mobility_recovery': return <Flame className="w-4 h-4 text-[#D4AF37]" />;
      case 'nutrition_hydration': return <Apple className="w-4 h-4 text-[#D4AF37]" />;
      default: return <Target className="w-4 h-4 text-[#D4AF37]" />;
    }
  };

  return (
    <div id="task-assignment-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center text-2xl font-bold">
            <Target className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Assegna Compiti & Checklist Individuali</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                {tasks.length} Compiti Attivi
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Video analisi schemi di gioco, routine palestra, prevenzione, idratazione e lavoro tecnico mirato
            </p>
          </div>
        </div>

        {isStaff && (
          <button
            id="btn-create-task-modal"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Compito (Staff)</span>
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {tasks.map(task => {
          const isUserAssigned = task.assignedPlayerIds.includes(currentUserId);
          const isUserCompleted = !!task.completions?.[currentUserId]?.completed;
          const completedCount = Object.values(task.completions || {}).filter((c: any) => c?.completed).length;
          const totalAssigned = task.assignedPlayerIds.length || 1;
          const pct = Math.round((completedCount / totalAssigned) * 100);

          return (
            <div 
              key={task.id} 
              className={`bg-[#121214] border rounded-xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between ${
                isUserCompleted ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-[#2A2A2E] hover:border-[#D4AF37]/40'
              }`}
            >
              <div className="space-y-3">
                {/* Badge Category & Priority */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#1D1D21] border border-[#2A2A2E]">
                      {getCategoryIcon(task.category)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      {task.category.replace('_', ' ')}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                    task.priority === 'high' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#E0E0E1] font-serif">{task.title}</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{task.description}</p>
                </div>

                {/* Target & Deadline */}
                <div className="flex items-center justify-between text-xs text-gray-400 bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Target: <strong className="text-[#E0E0E1] uppercase">{task.assignedToType}</strong> ({task.assignedPlayerIds.length} atlete)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#D4AF37] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Scadenza: {task.dueDate}
                  </span>
                </div>

                {/* Completion Progress Bar for Staff */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Completamento Squadra:</span>
                    <span className="font-bold text-[#D4AF37]">{completedCount} su {totalAssigned} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#1D1D21] h-2 rounded-full overflow-hidden border border-[#2A2A2E]">
                    <div 
                      className="bg-gradient-to-r from-[#D4AF37] to-emerald-500 h-full rounded-full transition-all" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Player Check-Off Action & Staff controls */}
              <div className="pt-3 border-t border-[#2A2A2E] flex items-center justify-between gap-3">
                {isUserAssigned ? (
                  <button
                    onClick={() => handleToggle(task, isUserCompleted)}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                      isUserCompleted 
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                        : 'bg-[#D4AF37] hover:bg-[#C09F30] text-black shadow-md'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isUserCompleted ? 'text-emerald-400' : 'text-black'}`} />
                    <span>{isUserCompleted ? 'Completato ✅ (Clicca per annullare)' : 'Segna come Completato'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 italic">Compito non assegnato al tuo profilo attuale</span>
                )}

                {isStaff && (
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1D1D21] rounded-lg transition-colors"
                    title="Elimina compito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#121214] border border-[#2A2A2E] rounded-xl">
            <Target className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-[#E0E0E1] font-bold text-base font-serif">Nessun Compito Assegnato</p>
            <p className="text-xs text-gray-400">Assegna compiti video, schede palestra o obiettivi individuali alle atlete.</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                Assegna Nuovo Compito alla Squadra / Atlete
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Titolo Compito:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Analisi Video Touche & Chiamate Tattiche..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Descrizione & Istruzioni Dettagliate:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="es. Guardare i 4 clip su Hudl e rispondere al questionario sui tempi di salto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="video_analysis">Analisi Video</option>
                    <option value="gym_strength">Forza & Palestra</option>
                    <option value="kicking_practice">Esercizi Calci</option>
                    <option value="mobility_recovery">Mobilità & Recupero</option>
                    <option value="nutrition_hydration">Nutrizione & Idratazione</option>
                    <option value="tactical_quiz">Quiz Tattico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Destinatari:</label>
                  <select
                    value={assignedToType}
                    onChange={(e) => setAssignedToType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">Tutta la Squadra (44)</option>
                    <option value="avanti">Solo Reparto Avanti</option>
                    <option value="trequarti">Solo Reparto Trequarti</option>
                    <option value="individual">Atlete Selezionate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Data di Scadenza:</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Priorità:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="normal">Normale</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
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
                  Crea e Notifica Squadra
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
