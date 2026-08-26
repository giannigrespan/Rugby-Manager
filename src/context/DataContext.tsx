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
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';

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
  
  // Actions
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
  toggleTaskCompletion: (taskId: string, playerId: string, completed: boolean, note?: string) => Promise<void>;
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local state initialized to empty arrays by default (for clean initial publish) or loaded from localStorage if explicitly present
  const [players, setPlayers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('rugby_roster_players');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [sessions, setSessions] = useState<TrainingSession[]>(() => {
    const saved = localStorage.getItem('rugby_training_sessions');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('rugby_attendances');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [rpeFeedbacks, setRpeFeedbacks] = useState<RpeFeedback[]>(() => {
    const saved = localStorage.getItem('rugby_rpe_feedbacks');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [injuries, setInjuries] = useState<InjuryReport[]>(() => {
    const saved = localStorage.getItem('rugby_injuries');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [physioNotes, setPhysioNotes] = useState<PhysioNote[]>(() => {
    const saved = localStorage.getItem('rugby_physio_notes');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [tasks, setTasks] = useState<IndividualTask[]>(() => {
    const saved = localStorage.getItem('rugby_tasks');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [kickingSessions, setKickingSessions] = useState<KickingSession[]>(() => {
    const saved = localStorage.getItem('rugby_kicking_sessions');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [individualLogs, setIndividualLogs] = useState<IndividualTrainingLog[]>(() => {
    const saved = localStorage.getItem('rugby_individual_logs');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('rugby_notifications');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'local_fallback' | 'connecting'>('connecting');

  // Persist locally whenever state updates
  useEffect(() => {
    localStorage.setItem('rugby_roster_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('rugby_training_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('rugby_attendances', JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    localStorage.setItem('rugby_rpe_feedbacks', JSON.stringify(rpeFeedbacks));
  }, [rpeFeedbacks]);

  useEffect(() => {
    localStorage.setItem('rugby_injuries', JSON.stringify(injuries));
  }, [injuries]);

  useEffect(() => {
    localStorage.setItem('rugby_physio_notes', JSON.stringify(physioNotes));
  }, [physioNotes]);

  useEffect(() => {
    localStorage.setItem('rugby_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('rugby_kicking_sessions', JSON.stringify(kickingSessions));
  }, [kickingSessions]);

  useEffect(() => {
    localStorage.setItem('rugby_individual_logs', JSON.stringify(individualLogs));
  }, [individualLogs]);

  useEffect(() => {
    localStorage.setItem('rugby_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Firestore background sync & real-time setup for ALL collections
  useEffect(() => {
    let unsubscribePlayers: (() => void) | undefined;
    let unsubscribeSessions: (() => void) | undefined;
    let unsubscribeAttendances: (() => void) | undefined;
    let unsubscribeInjuries: (() => void) | undefined;
    let unsubscribePhysio: (() => void) | undefined;
    let unsubscribeTasks: (() => void) | undefined;
    let unsubscribeRpe: (() => void) | undefined;
    let unsubscribeKicking: (() => void) | undefined;
    let unsubscribeIndividualLogs: (() => void) | undefined;
    let unsubscribeNotifications: (() => void) | undefined;

    const setupFirestore = async () => {
      try {
        setCloudSyncStatus('connecting');

        // 1. Players Collection
        unsubscribePlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as UserProfile);
          setPlayers(fetched);
          localStorage.setItem('rugby_roster_players', JSON.stringify(fetched));
          setCloudSyncStatus('synced');
        }, (error) => {
          console.warn('Players firestore subscription fallback:', error);
          setCloudSyncStatus('local_fallback');
        });

        // 2. Training Sessions Collection
        unsubscribeSessions = onSnapshot(collection(db, 'training_sessions'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as TrainingSession);
          setSessions(fetched);
          localStorage.setItem('rugby_training_sessions', JSON.stringify(fetched));
          setCloudSyncStatus('synced');
        }, (error) => {
          console.warn('Sessions firestore subscription fallback:', error);
        });

        // 3. Attendances Collection
        unsubscribeAttendances = onSnapshot(collection(db, 'attendances'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
          setAttendances(fetched);
          localStorage.setItem('rugby_attendances', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Attendances firestore subscription fallback:', error);
        });

        // 4. Injuries Collection
        unsubscribeInjuries = onSnapshot(collection(db, 'injuries'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as InjuryReport);
          setInjuries(fetched);
          localStorage.setItem('rugby_injuries', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Injuries firestore subscription fallback:', error);
        });

        // 5. Physio Notes Collection
        unsubscribePhysio = onSnapshot(collection(db, 'physio_notes'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as PhysioNote);
          setPhysioNotes(fetched);
          localStorage.setItem('rugby_physio_notes', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Physio notes firestore subscription fallback:', error);
        });

        // 6. Tasks Collection
        unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as IndividualTask);
          setTasks(fetched);
          localStorage.setItem('rugby_tasks', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Tasks firestore subscription fallback:', error);
        });

        // 7. RPE Feedbacks Collection
        unsubscribeRpe = onSnapshot(collection(db, 'rpe_feedbacks'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as RpeFeedback);
          setRpeFeedbacks(fetched);
          localStorage.setItem('rugby_rpe_feedbacks', JSON.stringify(fetched));
        }, (error) => {
          console.warn('RPE firestore subscription fallback:', error);
        });

        // 8. Kicking Sessions Collection
        unsubscribeKicking = onSnapshot(collection(db, 'kicking_sessions'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as KickingSession);
          setKickingSessions(fetched);
          localStorage.setItem('rugby_kicking_sessions', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Kicking firestore subscription fallback:', error);
        });

        // 9. Individual Logs Collection
        unsubscribeIndividualLogs = onSnapshot(collection(db, 'individual_logs'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as IndividualTrainingLog);
          setIndividualLogs(fetched);
          localStorage.setItem('rugby_individual_logs', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Individual logs firestore subscription fallback:', error);
        });

        // 10. Push Notifications Collection
        unsubscribeNotifications = onSnapshot(collection(db, 'push_notifications'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => doc.data() as PushNotification);
          setNotifications(fetched);
          localStorage.setItem('rugby_notifications', JSON.stringify(fetched));
        }, (error) => {
          console.warn('Notifications firestore subscription fallback:', error);
        });

      } catch (err) {
        console.warn('Cloud sync error:', err);
        setCloudSyncStatus('local_fallback');
      }
    };

    setupFirestore();

    return () => {
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribeSessions) unsubscribeSessions();
      if (unsubscribeAttendances) unsubscribeAttendances();
      if (unsubscribeInjuries) unsubscribeInjuries();
      if (unsubscribePhysio) unsubscribePhysio();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeRpe) unsubscribeRpe();
      if (unsubscribeKicking) unsubscribeKicking();
      if (unsubscribeIndividualLogs) unsubscribeIndividualLogs();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, []);

  // Request browser Notification Permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Actions
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
        const attRef = doc(db, 'attendances', recordId);
        await setDoc(attRef, {
          ...target,
          status,
          staffNotes: notes !== undefined ? notes : target.staffNotes,
          lateMinutes: lateMin !== undefined ? lateMin : (status === 'late' ? 15 : 0),
          updatedAt: new Date().toISOString()
        }, { merge: true });
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
      await Promise.all(
        newRecords.map(rec => setDoc(doc(db, 'attendances', rec.id), rec, { merge: true }))
      );
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
      await setDoc(doc(db, 'training_sessions', session.id), session, { merge: true });
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
      await deleteDoc(doc(db, 'training_sessions', sessionId));
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
      await setDoc(doc(db, 'rpe_feedbacks', newId), newFeedback, { merge: true });
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
      await setDoc(doc(db, 'injuries', newId), newReport);
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
      await setDoc(doc(db, 'injuries', injury.id), updatedReport, { merge: true });
    } catch (e) {
      console.warn('Injury update error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteInjuryReport = async (id: string) => {
    setInjuries(prev => prev.filter(i => i.id !== id));
    try {
      await deleteDoc(doc(db, 'injuries', id));
    } catch (e) {
      console.warn('Delete injury cloud error:', e);
    }
  };

  const addPhysioNote = async (noteData: Omit<PhysioNote, 'id'>) => {
    const newId = `physio-${Date.now()}`;
    const newNote: PhysioNote = { ...noteData, id: newId };
    setPhysioNotes(prev => [newNote, ...prev]);
    try {
      await setDoc(doc(db, 'physio_notes', newId), newNote);
    } catch (e) {
      console.warn('Physio cloud note error:', e);
    }
  };

  const deletePhysioNote = async (id: string) => {
    setPhysioNotes(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, 'physio_notes', id));
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
      message: `Scadenza: ${newTask.dueDate}. Categoria: ${newTask.category}`,
      targetRole: 'players',
      type: 'task_assigned'
    });

    try {
      await setDoc(doc(db, 'tasks', newId), newTask);
    } catch (e) {
      console.warn('Task cloud write error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateTask = async (task: IndividualTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    try {
      await setDoc(doc(db, 'tasks', task.id), task, { merge: true });
    } catch (e) {
      console.warn('Task update error:', e);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      console.warn('Task delete error:', e);
    }
  };

  const toggleTaskCompletion = async (taskId: string, playerId: string, completed: boolean, note?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completions: {
            ...t.completions,
            [playerId]: {
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
              note: note || t.completions[playerId]?.note
            }
          }
        };
      }
      return t;
    }));

    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await setDoc(doc(db, 'tasks', taskId), {
          ...task,
          completions: {
            ...task.completions,
            [playerId]: {
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
              note: note || task.completions[playerId]?.note
            }
          }
        }, { merge: true });
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
      await setDoc(doc(db, 'kicking_sessions', newId), newKick);
    } catch (e) {
      console.warn('Kicking cloud write error:', e);
    }
  };

  const addIndividualLog = async (logData: Omit<IndividualTrainingLog, 'id'>) => {
    const newId = `ind-${Date.now()}`;
    const newLog: IndividualTrainingLog = { ...logData, id: newId };
    setIndividualLogs(prev => [newLog, ...prev]);
    try {
      await setDoc(doc(db, 'individual_logs', newId), newLog);
    } catch (e) {
      console.warn('Ind log write error:', e);
    }
  };

  const updatePlayer = async (player: UserProfile) => {
    setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
    try {
      await setDoc(doc(db, 'players', player.id), player, { merge: true });
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
      await setDoc(doc(db, 'players', newId), newPlayer);
    } catch (e) {
      console.warn('Player add error:', e);
    }
  };

  const deletePlayer = async (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    try {
      await deleteDoc(doc(db, 'players', playerId));
    } catch (e) {
      console.warn('Delete player cloud error:', e);
    }
  };

  const importRosterPlayers = async (newPlayers: UserProfile[], replaceExisting = false): Promise<number> => {
    setIsSyncing(true);
    let finalPlayers: UserProfile[] = [];
    if (replaceExisting) {
      finalPlayers = newPlayers;
      // Wipe old players in Firestore to remove fictitious/demo players completely
      try {
        const snap = await getDocs(collection(db, 'players'));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'players', d.id))));
      } catch (e) {
        console.warn('Error clearing old players from Firestore:', e);
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
    localStorage.setItem('rugby_roster_players', JSON.stringify(finalPlayers));

    // Persist all players to Firestore
    try {
      await Promise.all(
        finalPlayers.map(p => setDoc(doc(db, 'players', p.id), p, { merge: true }))
      );
    } catch (e) {
      console.warn('Batch Firestore write warning:', e);
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
      await setDoc(doc(db, 'push_notifications', newId), newNotif);
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
    localStorage.setItem('rugby_roster_players', JSON.stringify([]));
    localStorage.setItem('rugby_training_sessions', JSON.stringify([]));
    localStorage.setItem('rugby_attendances', JSON.stringify([]));
    localStorage.setItem('rugby_rpe_feedbacks', JSON.stringify([]));
    localStorage.setItem('rugby_injuries', JSON.stringify([]));
    localStorage.setItem('rugby_physio_notes', JSON.stringify([]));
    localStorage.setItem('rugby_tasks', JSON.stringify([]));
    localStorage.setItem('rugby_kicking_sessions', JSON.stringify([]));
    localStorage.setItem('rugby_individual_logs', JSON.stringify([]));
    localStorage.setItem('rugby_notifications', JSON.stringify([]));

    // 3. Clear Firestore collections in the cloud
    try {
      const collectionsToWipe = [
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
      
      for (const colName of collectionsToWipe) {
        try {
          const snap = await getDocs(collection(db, colName));
          const deletes = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
          await Promise.all(deletes);
        } catch (e) {
          console.warn(`Error wiping collection ${colName}:`, e);
        }
      }
    } catch (err) {
      console.warn('Firestore cloud wipe error:', err);
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
