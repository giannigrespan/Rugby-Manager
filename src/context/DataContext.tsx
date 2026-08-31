import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  TrainingSession,
  AttendanceRecord,
  RpeFeedback,
  InjuryReport,
  PhysioNote,
  IndividualTask,
  KickingSession,
  IndividualTrainingLog,
  PushNotification,
  StaffAiReport
} from '../types';
import { supabase } from '../supabase/config';

interface DataContextType {
  players: UserProfile[];
  sessions: TrainingSession[];
  attendances: AttendanceRecord[];
  rpeFeedbacks: RpeFeedback[];
  injuries: InjuryReport[];
  physioNotes: PhysioNote[];
  tasks: IndividualTask[];
  kickingSessions: KickingSession[];
  individualLogs: IndividualTrainingLog[];
  notifications: PushNotification[];
  isSyncing: boolean;
  cloudSyncStatus: 'synced' | 'local_fallback' | 'connecting';
  attendanceWindowOpen: boolean;

  // Actions
  setAttendanceWindowOpen: (isOpen: boolean, updatedBy?: string) => Promise<void>;
  updateAttendance: (recordId: string, status: AttendanceRecord['status'], notes?: string, lateMin?: number) => Promise<void>;
  bulkMarkSessionAttendance: (sessionId: string, status: AttendanceRecord['status'], department?: string) => Promise<void>;
  addOrUpdateSession: (session: TrainingSession) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  submitRpeFeedback: (feedback: Omit<RpeFeedback, 'id' | 'submittedAt'>) => Promise<void>;
  addInjuryReport: (injury: Omit<InjuryReport, 'id' | 'updatedAt'>) => Promise<void>;
  updateInjuryReport: (injury: InjuryReport) => Promise<void>;
  deleteInjuryReport: (id: string) => Promise<void>;
  addPhysioNote: (note: Omit<PhysioNote, 'id'>) => Promise<void>;
  deletePhysioNote: (id: string) => Promise<void>;
  createTask: (task: Omit<IndividualTask, 'id' | 'createdAt' | 'completions'>) => Promise<void>;
  updateTask: (task: IndividualTask) => Promise<void>;
  toggleTaskCompletion: (taskId: string, playerId: string, completed: boolean, note?: string, progress?: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addKickingSession: (session: Omit<KickingSession, 'id'>) => Promise<void>;
  addIndividualLog: (log: Omit<IndividualTrainingLog, 'id'>) => Promise<void>;
  updatePlayer: (player: UserProfile) => Promise<void>;
  addPlayer: (player: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  importRosterPlayers: (newPlayers: UserProfile[], replaceExisting?: boolean) => Promise<number>;
  sendPushNotification: (notification: Omit<PushNotification, 'id' | 'timestamp' | 'readBy'>) => Promise<void>;
  markNotificationRead: (notificationId: string, userId: string) => void;
  resetAllDataToDefault: () => void;
  clearAllData: () => Promise<void>;
  exportToIcsFile: (sessionsList?: TrainingSession[], fileName?: string) => void;
  generateGoogleCalendarUrl: (session: TrainingSession) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Maps each Supabase table to the localStorage key used for the offline cache
const TABLE_STORAGE_KEYS: Record<string, string> = {
  players: 'rugby_roster_players',
  training_sessions: 'rugby_training_sessions',
  attendances: 'rugby_attendances',
  rpe_feedbacks: 'rugby_rpe_feedbacks',
  injuries: 'rugby_injuries',
  physio_notes: 'rugby_physio_notes',
  tasks: 'rugby_tasks',
  kicking_sessions: 'rugby_kicking_sessions',
  individual_logs: 'rugby_individual_logs',
  push_notifications: 'rugby_notifications'
};

const loadFromLocalStorage = <T,>(key: string): T[] => {
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Deletes every row of a table (used for "replace everything" style resets)
const deleteAllRows = async (table: string) => {
  const { error } = await supabase.from(table).delete().neq('id', '');
  if (error) throw error;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local state initialized to empty arrays by default (for clean initial publish) or loaded from localStorage if explicitly present
  const [players, setPlayers] = useState<UserProfile[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.players));
  const [sessions, setSessions] = useState<TrainingSession[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.training_sessions));
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.attendances));
  const [rpeFeedbacks, setRpeFeedbacks] = useState<RpeFeedback[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.rpe_feedbacks));
  const [injuries, setInjuries] = useState<InjuryReport[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.injuries));
  const [physioNotes, setPhysioNotes] = useState<PhysioNote[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.physio_notes));
  const [tasks, setTasks] = useState<IndividualTask[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.tasks));
  const [kickingSessions, setKickingSessions] = useState<KickingSession[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.kicking_sessions));
  const [individualLogs, setIndividualLogs] = useState<IndividualTrainingLog[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.individual_logs));
  const [notifications, setNotifications] = useState<PushNotification[]>(() => loadFromLocalStorage(TABLE_STORAGE_KEYS.push_notifications));

  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'local_fallback' | 'connecting'>('connecting');
  const [attendanceWindowOpen, setAttendanceWindowOpenState] = useState<boolean>(true);

  // Persist locally whenever state updates
  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.players, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.training_sessions, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.attendances, JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.rpe_feedbacks, JSON.stringify(rpeFeedbacks));
  }, [rpeFeedbacks]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.injuries, JSON.stringify(injuries));
  }, [injuries]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.physio_notes, JSON.stringify(physioNotes));
  }, [physioNotes]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.kicking_sessions, JSON.stringify(kickingSessions));
  }, [kickingSessions]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.individual_logs, JSON.stringify(individualLogs));
  }, [individualLogs]);

  useEffect(() => {
    localStorage.setItem(TABLE_STORAGE_KEYS.push_notifications, JSON.stringify(notifications));
  }, [notifications]);

  // Supabase background sync & real-time setup for ALL tables
  useEffect(() => {
    setCloudSyncStatus('connecting');

    // Generic helper: load a table's rows, keep local state + storage in sync,
    // then subscribe to Postgres changes and reload on every change.
    const watchTable = <T,>(table: string, setState: (rows: T[]) => void, markSyncedOnLoad = true) => {
      const load = async () => {
        // Order by id for a stable, repeatable ordering: without it Postgres
        // can return rows in a different order on each refetch, making the
        // UI (cards/rows) visibly reshuffle every time a realtime event fires.
        const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
        if (error) {
          console.warn(`${table} Supabase subscription fallback:`, error);
          setCloudSyncStatus(prev => (prev === 'synced' ? prev : 'local_fallback'));
          return;
        }
        const rows = (data || []) as T[];
        setState(rows);
        localStorage.setItem(TABLE_STORAGE_KEYS[table], JSON.stringify(rows));
        if (markSyncedOnLoad) setCloudSyncStatus('synced');
      };

      load();

      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const unsubscribers = [
      watchTable<UserProfile>('players', setPlayers),
      watchTable<TrainingSession>('training_sessions', setSessions),
      watchTable<AttendanceRecord>('attendances', setAttendances),
      watchTable<InjuryReport>('injuries', setInjuries),
      watchTable<PhysioNote>('physio_notes', setPhysioNotes),
      watchTable<IndividualTask>('tasks', setTasks),
      watchTable<RpeFeedback>('rpe_feedbacks', setRpeFeedbacks),
      watchTable<KickingSession>('kicking_sessions', setKickingSessions),
      watchTable<IndividualTrainingLog>('individual_logs', setIndividualLogs),
      watchTable<PushNotification>('push_notifications', setNotifications)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Supabase sync for the global attendance self-declaration switch
  useEffect(() => {
    const loadAttendanceWindow = async () => {
      const { data, error } = await supabase
        .from('attendance_window')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      if (error) {
        console.warn('Attendance window Supabase read warning:', error);
        return;
      }
      if (data) {
        setAttendanceWindowOpenState(Boolean(data.isOpen));
      } else {
        await supabase
          .from('attendance_window')
          .upsert({ id: 'default', isOpen: true, updatedAt: new Date().toISOString() })
          .then(({ error: upsertError }) => {
            if (upsertError) console.warn('Attendance window bootstrap warning:', upsertError);
          });
      }
    };

    loadAttendanceWindow();

    const channel = supabase
      .channel('attendance_window-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_window' }, () => loadAttendanceWindow())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Request browser Notification Permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Actions
  const setAttendanceWindowOpen = async (isOpen: boolean, updatedBy?: string) => {
    setAttendanceWindowOpenState(isOpen);
    const { error } = await supabase
      .from('attendance_window')
      .upsert({ id: 'default', isOpen, updatedAt: new Date().toISOString(), updatedBy });
    if (error) console.warn('Attendance window update error:', error);
  };

  const updateAttendance = async (recordId: string, status: AttendanceRecord['status'], notes?: string, lateMin?: number) => {
    setIsSyncing(true);
    setAttendances(prev => prev.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          status,
          staffNotes: notes !== undefined ? notes : rec.staffNotes,
          lateMinutes: lateMin !== undefined ? lateMin : (status === 'late' ? 15 : 0),
          updatedAt: new Date().toISOString()
        };
      }
      return rec;
    }));

    try {
      const target = attendances.find(a => a.id === recordId);
      if (target) {
        const updated = {
          ...target,
          status,
          staffNotes: notes !== undefined ? notes : target.staffNotes,
          lateMinutes: lateMin !== undefined ? lateMin : (status === 'late' ? 15 : 0),
          updatedAt: new Date().toISOString()
        };
        const { error } = await supabase.from('attendances').upsert(updated);
        if (error) throw error;
      }
    } catch (e) {
      console.warn('Attendance cloud write error, stored locally:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const bulkMarkSessionAttendance = async (sessionId: string, status: AttendanceRecord['status'], department?: string) => {
    setIsSyncing(true);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const filteredPlayers = department && department !== 'all'
      ? players.filter(p => p.department === department)
      : players;

    const newRecords: AttendanceRecord[] = [];

    setAttendances(prev => {
      const updated = [...prev];
      filteredPlayers.forEach(player => {
        const existingIdx = updated.findIndex(a => a.sessionId === sessionId && a.playerId === player.id);
        const record: AttendanceRecord = {
          id: existingIdx >= 0 ? updated[existingIdx].id : `att-${sessionId}-${player.id}`,
          sessionId,
          sessionDate: session.date,
          playerId: player.id,
          playerName: player.name,
          jerseyNumber: player.jerseyNumber,
          status,
          lateMinutes: status === 'late' ? 15 : 0,
          staffNotes: existingIdx >= 0 ? updated[existingIdx].staffNotes : '',
          recordedBy: 'Staff Tecnico',
          updatedAt: new Date().toISOString()
        };

        if (existingIdx >= 0) {
          updated[existingIdx] = record;
        } else {
          updated.push(record);
        }
        newRecords.push(record);
      });
      return updated;
    });

    // Cloud persist all records
    try {
      const { error } = await supabase.from('attendances').upsert(newRecords);
      if (error) throw error;
    } catch (e) {
      console.warn('Bulk attendance cloud error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addOrUpdateSession = async (session: TrainingSession) => {
    setIsSyncing(true);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = session;
        return updated;
      }
      return [session, ...prev];
    });

    // Ensure attendance records exist for this session
    setAttendances(prev => {
      const existingForSession = prev.filter(a => a.sessionId === session.id);
      if (existingForSession.length === 0) {
        const generated: AttendanceRecord[] = players.map(p => ({
          id: `att-${session.id}-${p.id}`,
          sessionId: session.id,
          sessionDate: session.date,
          playerId: p.id,
          playerName: p.name,
          jerseyNumber: p.jerseyNumber,
          status: p.status === 'injured' ? 'injured_diff' : 'present',
          lateMinutes: 0,
          staffNotes: p.status === 'injured' ? 'Infortunata in recupero' : '',
          recordedBy: 'Staff Tecnico',
          updatedAt: new Date().toISOString()
        }));
        return [...prev, ...generated];
      }
      return prev;
    });

    // Send push notification if scheduled
    if (session.status === 'scheduled') {
      sendPushNotification({
        title: `Nuovo Allenamento: ${session.title}`,
        message: `${session.date} alle ${session.time} @ ${session.location}. Focus: ${session.primaryFocus}`,
        targetRole: 'all',
        type: 'session_reminder'
      });
    }

    try {
      const { error } = await supabase.from('training_sessions').upsert(session);
      if (error) throw error;
    } catch (e) {
      console.warn('Session write to cloud error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setAttendances(prev => prev.filter(a => a.sessionId !== sessionId));
    setRpeFeedbacks(prev => prev.filter(r => r.sessionId !== sessionId));
    try {
      const { error } = await supabase.from('training_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    } catch (e) {
      console.warn('Delete session cloud error:', e);
    }
  };

  const submitRpeFeedback = async (feedbackData: Omit<RpeFeedback, 'id' | 'submittedAt'>) => {
    setIsSyncing(true);
    const newId = `rpe-${feedbackData.sessionId}-${feedbackData.playerId}`;
    const newFeedback: RpeFeedback = {
      ...feedbackData,
      id: newId,
      submittedAt: new Date().toISOString()
    };

    setRpeFeedbacks(prev => {
      const idx = prev.findIndex(f => f.sessionId === feedbackData.sessionId && f.playerId === feedbackData.playerId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newFeedback;
        return updated;
      }
      return [newFeedback, ...prev];
    });

    try {
      const { error } = await supabase.from('rpe_feedbacks').upsert(newFeedback);
      if (error) throw error;
    } catch (e) {
      console.warn('RPE cloud write error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addInjuryReport = async (injuryData: Omit<InjuryReport, 'id' | 'updatedAt'>) => {
    setIsSyncing(true);
    const newId = `inj-${Date.now()}`;
    const newReport: InjuryReport = {
      ...injuryData,
      id: newId,
      updatedAt: new Date().toISOString()
    };

    setInjuries(prev => [newReport, ...prev]);

    // Update player status in roster
    setPlayers(prev => prev.map(p => {
      if (p.id === injuryData.playerId) {
        return {
          ...p,
          status: injuryData.severity === 'severe' ? 'injured' : 'rehab_diff'
        };
      }
      return p;
    }));

    sendPushNotification({
      title: `⚠️ Segnalazione Fastidio/Infortunio: ${injuryData.playerName}`,
      message: `${injuryData.bodyPart} - ${injuryData.injuryType} (${injuryData.severity.toUpperCase()}). RTP stimato: ${injuryData.rtpExpectedDate}`,
      targetRole: 'coaches',
      type: 'medical_alert'
    });

    try {
      const { error } = await supabase.from('injuries').upsert(newReport);
      if (error) throw error;
    } catch (e) {
      console.warn('Injury cloud write error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateInjuryReport = async (injury: InjuryReport) => {
    setIsSyncing(true);
    const updatedReport = { ...injury, updatedAt: new Date().toISOString() };
    setInjuries(prev => prev.map(i => i.id === injury.id ? updatedReport : i));

    if (injury.status === 'cleared') {
      setPlayers(prev => prev.map(p => p.id === injury.playerId ? { ...p, status: 'fit' } : p));
    }

    try {
      const { error } = await supabase.from('injuries').upsert(updatedReport);
      if (error) throw error;
    } catch (e) {
      console.warn('Injury update error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteInjuryReport = async (id: string) => {
    setInjuries(prev => prev.filter(i => i.id !== id));
    try {
      const { error } = await supabase.from('injuries').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Delete injury cloud error:', e);
    }
  };

  const addPhysioNote = async (noteData: Omit<PhysioNote, 'id'>) => {
    const newId = `physio-${Date.now()}`;
    const newNote: PhysioNote = { ...noteData, id: newId };
    setPhysioNotes(prev => [newNote, ...prev]);
    try {
      const { error } = await supabase.from('physio_notes').upsert(newNote);
      if (error) throw error;
    } catch (e) {
      console.warn('Physio cloud note error:', e);
    }
  };

  const deletePhysioNote = async (id: string) => {
    setPhysioNotes(prev => prev.filter(n => n.id !== id));
    try {
      const { error } = await supabase.from('physio_notes').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Delete physio note cloud error:', e);
    }
  };

  const createTask = async (taskData: Omit<IndividualTask, 'id' | 'createdAt' | 'completions'>) => {
    setIsSyncing(true);
    const newId = `task-${Date.now()}`;
    const newTask: IndividualTask = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString(),
      completions: {}
    };

    setTasks(prev => [newTask, ...prev]);

    sendPushNotification({
      title: `🎯 Nuovo Compito Assegnato: ${newTask.title}`,
      message: `Scadenza: ${newTask.dueDate}.`,
      targetRole: 'players',
      type: 'task_assigned'
    });

    try {
      const { error } = await supabase.from('tasks').upsert(newTask);
      if (error) throw error;
    } catch (e) {
      console.warn('Task cloud write error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateTask = async (task: IndividualTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    try {
      const { error } = await supabase.from('tasks').upsert(task);
      if (error) throw error;
    } catch (e) {
      console.warn('Task update error:', e);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    } catch (e) {
      console.warn('Task delete error:', e);
    }
  };

  const toggleTaskCompletion = async (taskId: string, playerId: string, completed: boolean, note?: string, progress?: number) => {
    let updatedTask: IndividualTask | undefined;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = {
          ...t,
          completions: {
            ...t.completions,
            [playerId]: {
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
              note: note || t.completions[playerId]?.note,
              progress: progress !== undefined ? progress : t.completions[playerId]?.progress
            }
          }
        };
        return updatedTask;
      }
      return t;
    }));

    try {
      if (updatedTask) {
        const { error } = await supabase.from('tasks').upsert(updatedTask);
        if (error) throw error;
      }
    } catch (e) {
      console.warn('Task toggle error:', e);
    }
  };

  const addKickingSession = async (kickData: Omit<KickingSession, 'id'>) => {
    const newId = `kick-${Date.now()}`;
    const newKick: KickingSession = { ...kickData, id: newId };
    setKickingSessions(prev => [newKick, ...prev]);
    try {
      const { error } = await supabase.from('kicking_sessions').upsert(newKick);
      if (error) throw error;
    } catch (e) {
      console.warn('Kicking cloud write error:', e);
    }
  };

  const addIndividualLog = async (logData: Omit<IndividualTrainingLog, 'id'>) => {
    const newId = `ind-${Date.now()}`;
    const newLog: IndividualTrainingLog = { ...logData, id: newId };
    setIndividualLogs(prev => [newLog, ...prev]);
    try {
      const { error } = await supabase.from('individual_logs').upsert(newLog);
      if (error) throw error;
    } catch (e) {
      console.warn('Ind log write error:', e);
    }
  };

  const updatePlayer = async (player: UserProfile) => {
    setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
    try {
      const { error } = await supabase.from('players').upsert(player);
      if (error) throw error;
    } catch (e) {
      console.warn('Player update error:', e);
    }
  };

  const addPlayer = async (playerData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newId = `p-${Date.now().toString().slice(-4)}`;
    const newPlayer: UserProfile = {
      ...playerData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setPlayers(prev => [...prev, newPlayer]);
    try {
      const { error } = await supabase.from('players').upsert(newPlayer);
      if (error) throw error;
    } catch (e) {
      console.warn('Player add error:', e);
    }
  };

  const deletePlayer = async (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    try {
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) throw error;
    } catch (e) {
      console.warn('Delete player cloud error:', e);
    }
  };

  const importRosterPlayers = async (newPlayers: UserProfile[], replaceExisting = false): Promise<number> => {
    setIsSyncing(true);
    let finalPlayers: UserProfile[] = [];
    if (replaceExisting) {
      finalPlayers = newPlayers;
      // Wipe old players in Supabase to remove fictitious/demo players completely
      try {
        await deleteAllRows('players');
      } catch (e) {
        console.warn('Error clearing old players from Supabase:', e);
      }
    } else {
      // Merge by email / name
      const existingMap = new Map<string, UserProfile>(players.map(p => [p.email.toLowerCase(), p]));
      newPlayers.forEach(np => {
        existingMap.set(np.email.toLowerCase(), np);
      });
      finalPlayers = Array.from(existingMap.values());
    }

    setPlayers(finalPlayers);
    localStorage.setItem(TABLE_STORAGE_KEYS.players, JSON.stringify(finalPlayers));

    // Persist all players to Supabase
    try {
      const { error } = await supabase.from('players').upsert(finalPlayers);
      if (error) throw error;
    } catch (e) {
      console.warn('Batch Supabase write warning:', e);
    } finally {
      setIsSyncing(false);
    }

    return finalPlayers.length;
  };

  const sendPushNotification = async (notifData: Omit<PushNotification, 'id' | 'timestamp' | 'readBy'>) => {
    const newId = `notif-${Date.now()}`;
    const newNotif: PushNotification = {
      ...notifData,
      id: newId,
      timestamp: new Date().toISOString(),
      readBy: []
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Trigger Native Browser Web Notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } catch (e) {
        console.log('Web notification trigger info:', e);
      }
    }

    try {
      const { error } = await supabase.from('push_notifications').upsert(newNotif);
      if (error) throw error;
    } catch (e) {
      console.warn('Notif cloud write error:', e);
    }
  };

  const markNotificationRead = (notificationId: string, userId: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId && !n.readBy.includes(userId)) {
        return { ...n, readBy: [...n.readBy, userId] };
      }
      return n;
    }));
  };

  const clearAllData = async () => {
    setIsSyncing(true);
    // 1. Reset all React state to empty arrays
    setPlayers([]);
    setSessions([]);
    setAttendances([]);
    setRpeFeedbacks([]);
    setInjuries([]);
    setPhysioNotes([]);
    setTasks([]);
    setKickingSessions([]);
    setIndividualLogs([]);
    setNotifications([]);

    // 2. Overwrite localStorage keys with empty arrays
    Object.values(TABLE_STORAGE_KEYS).forEach(key => {
      localStorage.setItem(key, JSON.stringify([]));
    });

    // 3. Clear Supabase tables in the cloud
    try {
      const tablesToWipe = [
        'training_sessions',
        'attendances',
        'rpe_feedbacks',
        'injuries',
        'physio_notes',
        'tasks',
        'kicking_sessions',
        'individual_logs',
        'players',
        'push_notifications'
      ];

      for (const table of tablesToWipe) {
        try {
          await deleteAllRows(table);
        } catch (e) {
          console.warn(`Error wiping table ${table}:`, e);
        }
      }
    } catch (err) {
      console.warn('Supabase cloud wipe error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetAllDataToDefault = () => {
    clearAllData();
  };

  // Sincronizzazione iCal (.ics) per calendari esterni (Google Calendar, Outlook, Apple Calendar)
  const exportToIcsFile = (sessionsList: TrainingSession[] = sessions, fileName = 'calendario-allenamenti-rugby.ics') => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rugby Team Manager//IT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Allenamenti Rugby Prima Squadra',
      'X-WR-TIMEZONE:Europe/Rome'
    ];

    sessionsList.forEach(session => {
      const dateParts = session.date.replace(/-/g, '');
      const timeParts = (session.time || '19:00').replace(':', '') + '00';
      const endTimeParts = (session.endTime || '20:30').replace(':', '') + '00';
      const dtStart = `${dateParts}T${timeParts}`;
      const dtEnd = `${dateParts}T${endTimeParts}`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:session-${session.id}@rugbyteammanager.it`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:Rugby: ${session.title}`,
        `DESCRIPTION:Focus Primario: ${session.primaryFocus}\\nFocus Secondario: ${session.secondaryFocus}\\nIntensità: ${session.intensity.toUpperCase()}\\nNote Staff: ${session.coachNotes || 'Nessuna'}`,
        `LOCATION:${session.location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateGoogleCalendarUrl = (session: TrainingSession): string => {
    const startDate = session.date.replace(/-/g, '');
    const startTime = (session.time || '19:00').replace(':', '') + '00';
    const endTime = (session.endTime || '20:30').replace(':', '') + '00';
    const dates = `${startDate}T${startTime}/${startDate}T${endTime}`;

    const title = encodeURIComponent(`Rugby: ${session.title}`);
    const details = encodeURIComponent(
      `Focus Primario: ${session.primaryFocus}\nFocus Secondario: ${session.secondaryFocus}\nTarget: ${session.departmentTarget.toUpperCase()}\nRPE Previsto: ${session.plannedRpe}/10\nNote: ${session.coachNotes || ''}`
    );
    const location = encodeURIComponent(session.location);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  return (
    <DataContext.Provider value={{
      players,
      sessions,
      attendances,
      rpeFeedbacks,
      injuries,
      physioNotes,
      tasks,
      kickingSessions,
      individualLogs,
      notifications,
      isSyncing,
      cloudSyncStatus,
      attendanceWindowOpen,
      setAttendanceWindowOpen,
      updateAttendance,
      bulkMarkSessionAttendance,
      addOrUpdateSession,
      deleteSession,
      submitRpeFeedback,
      addInjuryReport,
      updateInjuryReport,
      deleteInjuryReport,
      addPhysioNote,
      deletePhysioNote,
      createTask,
      updateTask,
      toggleTaskCompletion,
      deleteTask,
      addKickingSession,
      addIndividualLog,
      updatePlayer,
      addPlayer,
      deletePlayer,
      importRosterPlayers,
      sendPushNotification,
      markNotificationRead,
      resetAllDataToDefault,
      clearAllData,
      exportToIcsFile,
      generateGoogleCalendarUrl
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
