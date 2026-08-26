export type UserRole = 'direttore_tecnico' | 'head_coach' | 'assistant_coach' | 'athletic_trainer' | 'physiotherapist' | 'player';

export type RugbyDepartment = 'avanti' | 'trequarti' | 'staff';

export type PlayerPosition = 
  | 'Pilone Sinistro (1)' 
  | 'Tallonatrice (2)' 
  | 'Pilone Destro (3)' 
  | 'Seconda Linea (4)' 
  | 'Seconda Linea (5)' 
  | 'Terza Linea Flanker (6)' 
  | 'Terza Linea Flanker (7)' 
  | 'Numero 8 (8)' 
  | 'Mediana di Mischia (9)' 
  | 'Mediana d\'Apertura (10)' 
  | 'Ala Sinistra (11)' 
  | 'Primo Centro (12)' 
  | 'Secondo Centro (13)' 
  | 'Ala Destra (14)' 
  | 'Estremo (15)'
  | 'Staff Tecnico';

export type HealthStatus = 'fit' | 'injured' | 'rehab_diff' | 'rest' | 'hia_protocol';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdmin?: boolean;
  jerseyNumber?: number;
  position: PlayerPosition;
  department: RugbyDepartment;
  phone?: string;
  birthDate?: string;
  medicalExpiry?: string;
  status: HealthStatus;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
  lastLogin?: string;
  tempPassword?: string;
}

export type TrainingType = 
  | 'technical_tactical' 
  | 'physical_strength' 
  | 'kicking_specialists' 
  | 'scrum_lineout' 
  | 'recovery_mobility' 
  | 'match_captain_run'
  | 'individual_rehab';

export interface TrainingSession {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  type: TrainingType;
  departmentTarget: 'all' | 'avanti' | 'trequarti' | 'kicking' | 'individual';
  primaryFocus: string;
  secondaryFocus: string;
  plannedDurationMin: number;
  plannedRpe: number; // 1-10
  intensity: 'low' | 'moderate' | 'high' | 'match_intensity';
  coachNotes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  syncToCalendar?: boolean;
  createdAt: string;
}

export type AttendanceStatus = 
  | 'present' 
  | 'absent_justified' 
  | 'absent_unjustified' 
  | 'injured_diff' 
  | 'late';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  sessionDate: string;
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  status: AttendanceStatus;
  lateMinutes?: number;
  staffNotes?: string;
  recordedBy: string;
  updatedAt: string;
}

export interface RpeFeedback {
  id: string;
  sessionId: string;
  sessionDate: string;
  playerId: string;
  playerName: string;
  rpe: number; // 1-10 (Borg CR10)
  focusRating: number; // 1-10 (Livello di concentrazione percepito)
  physicalFatigue: number; // 1-10 (Affaticamento muscolare)
  muscleSoreness: number; // 1-10 (DOMS / Dolori muscolari)
  mentalReadiness: number; // 1-10 (Prontezza mentale)
  sessionLoad: number; // sRPE = RPE * duration in min (es. 7 * 90 = 630 AU)
  notes?: string;
  submittedAt: string;
}

export interface InjuryReport {
  id: string;
  playerId: string;
  playerName: string;
  injuryDate: string;
  bodyPart: 'Caviglia' | 'Ginocchio' | 'Spalla' | 'Collo / Schiena' | 'Coscia / Ischiocrurali' | 'Polpaccio' | 'Commozione HIA' | 'Polso / Mano' | 'Altro';
  injuryType: string; // es. Distorsione II grado, Contrattura, HIA 1, etc.
  severity: 'mild' | 'moderate' | 'severe';
  rtpExpectedDate: string;
  status: 'active' | 'in_rehab' | 'cleared';
  physioNotes: string;
  treatmentPlan: string;
  hiaConcussionProtocol: boolean;
  updatedAt: string;
}

export interface PhysioNote {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  physioName: string;
  sessionType: 'Valutazione Iniziale' | 'Trattamento Manuale' | 'Differenziato Campo' | 'Controllo Pre-Gara' | 'Test RTP';
  diagnosis: string;
  treatment: string;
  exercisePlan: string;
  rtpStatus: string;
  isConfidential?: boolean;
}

export type TaskCategory = 
  | 'video_analysis' 
  | 'gym_strength' 
  | 'kicking_practice' 
  | 'mobility_recovery' 
  | 'tactical_quiz' 
  | 'nutrition_hydration';

export interface IndividualTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  assignedToType: 'all' | 'avanti' | 'trequarti' | 'individual';
  assignedPlayerIds: string[];
  dueDate: string; // YYYY-MM-DD
  frequency: 'daily' | 'weekly' | 'one_off';
  priority: 'normal' | 'high' | 'urgent';
  createdBy: string;
  createdAt: string;
  completions: Record<string, {
    completed: boolean;
    completedAt?: string;
    note?: string;
  }>;
}

export interface KickingSession {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  durationMin: number;
  totalKicks: number;
  successfulKicks: number;
  stats: {
    piazzati: { total: number; success: number };
    drop: { total: number; success: number };
    spostamento: { total: number; success: number };
    upAndUnder: { total: number; success: number };
  };
  fieldZoneSuccess?: {
    centro: number;
    destra: number;
    sinistra: number;
  };
  notes?: string;
}

export interface IndividualTrainingLog {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  title: string;
  type: 'Palestra / Forza' | 'Cardio / Aerobico' | 'Mobilità & Core' | 'Skills Passaggio' | 'Recupero Attivo';
  durationMin: number;
  perceivedEffort: number;
  exercisesDone: string;
  notes?: string;
  verifiedByCoach?: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetRole: 'all' | 'players' | 'coaches' | 'individual';
  targetPlayerId?: string;
  type: 'session_reminder' | 'task_assigned' | 'medical_alert' | 'general';
  timestamp: string;
  readBy: string[];
  actionUrl?: string;
}

export interface StaffAiReport {
  id: string;
  title: string;
  period: 'weekly' | 'monthly' | 'match_preview';
  dateRange: { start: string; end: string };
  generatedAt: string;
  overallReadiness: number; // 0-100%
  summary: string;
  workloadInsights: {
    averageRpe: number;
    totalWeeklyVolume: number;
    highRiskSpikes: string[];
    safeAthletes: number;
  };
  attendanceSummary: {
    averageAttendancePct: number;
    criticalAbsences: string[];
    topAttendees: string[];
  };
  focusAnalysis: {
    averageFocusRating: number;
    tacticalRetention: string;
    focusDropAreas: string[];
  };
  medicalOverview: {
    injuredCount: number;
    rehabCount: number;
    rtpUpcoming: string[];
  };
  tacticalRecommendations: string[];
}

export type ConfigurableSection = 
  | 'presenze' 
  | 'sessioni' 
  | 'calci' 
  | 'rpe_focus' 
  | 'infortuni' 
  | 'fisioterapia' 
  | 'individuali' 
  | 'compiti' 
  | 'rosa';

export type RolePermissionsMap = Record<UserRole, Record<ConfigurableSection, boolean>>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  direttore_tecnico: {
    presenze: true,
    sessioni: true,
    calci: true,
    rpe_focus: true,
    infortuni: true,
    fisioterapia: true,
    individuali: true,
    compiti: true,
    rosa: true
  },
  head_coach: {
    presenze: true,
    sessioni: true,
    calci: true,
    rpe_focus: true,
    infortuni: true,
    fisioterapia: true,
    individuali: true,
    compiti: true,
    rosa: true
  },
  assistant_coach: {
    presenze: true,
    sessioni: true,
    calci: true,
    rpe_focus: true,
    infortuni: true,
    fisioterapia: false,
    individuali: true,
    compiti: true,
    rosa: true
  },
  athletic_trainer: {
    presenze: true,
    sessioni: true,
    calci: false,
    rpe_focus: true,
    infortuni: true,
    fisioterapia: true,
    individuali: true,
    compiti: true,
    rosa: true
  },
  physiotherapist: {
    presenze: true,
    sessioni: false,
    calci: false,
    rpe_focus: true,
    infortuni: true,
    fisioterapia: true,
    individuali: false,
    compiti: false,
    rosa: true
  },
  player: {
    presenze: true,
    sessioni: true,
    calci: true,
    rpe_focus: true,
    infortuni: true,
    fisioterapia: false,
    individuali: true,
    compiti: true,
    rosa: true
  }
};
