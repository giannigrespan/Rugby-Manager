import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/config';
import { UserProfile, UserRole, ConfigurableSection, DEFAULT_ROLE_PERMISSIONS } from '../types';
import { 
  KeyRound, 
  ShieldCheck, 
  Search, 
  Mail, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Copy, 
  Send,
  Eye,
  EyeOff,
  FileSpreadsheet,
  UserPlus,
  Edit2,
  Trash2,
  Users,
  Shield,
  Filter,
  Crown,
  Lock,
  Unlock,
  Award,
  Sliders,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Clock,
  Target,
  HeartPulse,
  AlertTriangle,
  Stethoscope,
  Dumbbell,
  ClipboardList,
  Sparkles,
  Info
} from 'lucide-react';
import { GoogleSheetsImportModal } from './modals/GoogleSheetsImportModal';
import { StaffMemberModal } from './modals/StaffMemberModal';

interface SectionConfigItem {
  id: ConfigurableSection;
  title: string;
  category: 'Campo & Presenze' | 'Performance & Salute' | 'Organizzazione';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONFIGURABLE_SECTIONS_LIST: SectionConfigItem[] = [
  {
    id: 'presenze',
    title: 'Matrice Presenze',
    category: 'Campo & Presenze',
    description: 'Appello, convocazioni e modifiche presenze/ritardi dello staff',
    icon: Calendar
  },
  {
    id: 'sessioni',
    title: 'Gestione Sessioni',
    category: 'Campo & Presenze',
    description: 'Pianificazione allenamenti, orari e focus tattici',
    icon: Clock
  },
  {
    id: 'calci',
    title: 'Calci & Specialisti',
    category: 'Campo & Presenze',
    description: 'Statistiche e percentuali piazzati/drop trequarti',
    icon: Target
  },
  {
    id: 'rpe_focus',
    title: 'RPE & Focus Gara',
    category: 'Performance & Salute',
    description: 'Carichi interni sRPE, concentrazione e questionari post-allenamento',
    icon: HeartPulse
  },
  {
    id: 'infortuni',
    title: 'Report Infortuni / HIA',
    category: 'Performance & Salute',
    description: 'Segnalazione fastidi muscolari, protocolli commozione e RTP',
    icon: AlertTriangle
  },
  {
    id: 'fisioterapia',
    title: 'Cartella Fisioterapia',
    category: 'Performance & Salute',
    description: 'Cartelle cliniche riservate, diagnosi, terapie manuali e visite',
    icon: Stethoscope
  },
  {
    id: 'individuali',
    title: 'Allenamenti Extra',
    category: 'Performance & Salute',
    description: 'Schede palestra, carichi extra, mobilità e lavoro individuale',
    icon: Dumbbell
  },
  {
    id: 'compiti',
    title: 'Assegna Compiti & Video',
    category: 'Performance & Salute',
    description: 'Video analysis, studio tattico e quiz individuali',
    icon: ClipboardList
  },
  {
    id: 'rosa',
    title: 'Anagrafica Rosa',
    category: 'Organizzazione',
    description: 'Elenco atlete, contatti, scadenze visite mediche e ruoli',
    icon: Users
  }
];

interface RoleConfigItem {
  role: UserRole;
  label: string;
  shortLabel: string;
  subtitle: string;
  badgeColor: string;
  isAdminAlways?: boolean;
}

const ALL_ROLES_CONFIG: RoleConfigItem[] = [
  {
    role: 'direttore_tecnico',
    label: 'Direttore Tecnico / Dirigente',
    shortLabel: 'Direttore Tecnico',
    subtitle: 'Presenze, Fisioterapia e Infortuni per default — configurabile',
    badgeColor: 'bg-[#D4AF37] text-black border-[#D4AF37]'
  },
  {
    role: 'head_coach',
    label: 'Head Coach (1° Allenatore)',
    shortLabel: 'Head Coach',
    subtitle: 'Pianificazione tecnica, presenze, carichi e video analysis',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
  },
  {
    role: 'assistant_coach',
    label: 'Assistant Coach (Tecnico)',
    shortLabel: 'Ass. Coach',
    subtitle: 'Supporto tecnico, specialisti e monitoraggio sul campo',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40'
  },
  {
    role: 'athletic_trainer',
    label: 'Preparatore Atletico',
    shortLabel: 'Prep. Atletico',
    subtitle: 'Monitoraggio sRPE, carichi, palestra e recupero',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  },
  {
    role: 'physiotherapist',
    label: 'Fisioterapista / Medico',
    shortLabel: 'Fisioterapista',
    subtitle: 'Cartelle cliniche, infortuni, protocolli HIA e differenziati',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
  },
  {
    role: 'player',
    label: 'Atleta (Giocatrice Rosa)',
    shortLabel: 'Atleta',
    subtitle: 'Compilazione RPE, log individuali, compiti e visualizzazione',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
  }
];

export const UserCredentialsAdminView: React.FC = () => {
  const { players, deletePlayer } = useData();
  const { 
    currentUser, 
    staffUsers, 
    addStaffMember, 
    updateStaffMember, 
    toggleStaffAdmin,
    updateStaffRole,
    deleteStaffMember, 
    rolePermissions,
    updateRolePermission,
    resetRolePermissionsToDefault
  } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'matrix' | 'accounts'>('matrix');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'staff' | 'admins' | 'players'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [credentialsActionId, setCredentialsActionId] = useState<string | null>(null);
  
  // Modals state
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  const allUsers = [
    ...staffUsers,
    ...players
  ];

  const adminCount = staffUsers.filter(s => s.isAdmin).length;

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterType === 'staff') return u.role !== 'player';
    if (filterType === 'admins') return u.isAdmin;
    if (filterType === 'players') return u.role === 'player';
    return true;
  });

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    const nextState = !user.isAdmin;
    await toggleStaffAdmin(user.id, nextState);
    setFeedbackMessage(
      nextState 
        ? `Permessi di Amministratore assegnati a "${user.name}". Può ora configurare la matrice e gli accessi.`
        : `Permessi di Amministratore revocati per "${user.name}".`
    );
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleChangeRole = async (user: UserProfile, newRole: UserRole) => {
    await updateStaffRole(user.id, newRole);
    setFeedbackMessage(`Ruolo di "${user.name}" aggiornato a ${newRole.replace('_', ' ')}.`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleTogglePermission = async (role: UserRole, section: ConfigurableSection) => {
    const currentVal = rolePermissions[role]?.[section] ?? DEFAULT_ROLE_PERMISSIONS[role]?.[section] ?? true;
    const nextVal = !currentVal;
    await updateRolePermission(role, section, nextVal);
    const sectionName = CONFIGURABLE_SECTIONS_LIST.find(s => s.id === section)?.title || section;
    const roleName = ALL_ROLES_CONFIG.find(r => r.role === role)?.shortLabel || role;
    setFeedbackMessage(
      nextVal 
        ? `Sezione "${sectionName}" ABILITATA per il ruolo "${roleName}". Sincronizzato sul database Supabase.`
        : `Sezione "${sectionName}" DISABILITATA per il ruolo "${roleName}". Sincronizzato sul database Supabase.`
    );
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleEnableAllForRole = async (role: UserRole) => {
    for (const section of CONFIGURABLE_SECTIONS_LIST) {
      await updateRolePermission(role, section.id, true);
    }
    const roleName = ALL_ROLES_CONFIG.find(r => r.role === role)?.shortLabel || role;
    setFeedbackMessage(`Tutte le sezioni sono state ABILITATE per il ruolo "${roleName}".`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleResetDefaults = async () => {
    if (window.confirm("Vuoi ripristinare i permessi di visualizzazione predefiniti per tutti i ruoli?")) {
      await resetRolePermissionsToDefault();
      setFeedbackMessage("Matrice permessi ripristinata ai valori predefiniti del club.");
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const invokeCredentialsAction = async (user: UserProfile, action: 'create' | 'reset_password') => {
    setCredentialsActionId(user.id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-credentials', {
        body: { action, email: user.email }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFeedbackMessage(
        action === 'create'
          ? `Account creato per ${user.email}. Password temporanea: ${data.password} — comunicala tu stesso all'utente.`
          : `Password reimpostata per ${user.email}. Nuova password: ${data.password} — comunicala tu stesso all'utente.`
      );
    } catch (err: any) {
      setFeedbackMessage(`Errore: ${err.message || 'operazione non riuscita.'}`);
    } finally {
      setCredentialsActionId(null);
      setTimeout(() => setFeedbackMessage(null), 8000);
    }
  };

  const handleCreateAccount = (user: UserProfile) => invokeCredentialsAction(user, 'create');
  const handleResetPassword = (user: UserProfile) => invokeCredentialsAction(user, 'reset_password');

  const handleSaveStaff = async (staffData: Omit<UserProfile, 'id' | 'createdAt'> | UserProfile) => {
    if ('id' in staffData && staffData.id) {
      await updateStaffMember(staffData as UserProfile);
      setFeedbackMessage(`Staff "${staffData.name}" aggiornato con successo.`);
    } else {
      await addStaffMember(staffData);
      setFeedbackMessage(`Nuovo membro staff "${staffData.name}" aggiunto con successo.`);
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    const isStaff = user.role !== 'player';
    const confirmText = isStaff 
      ? `Sei sicuro di voler eliminare il membro dello staff "${user.name}" (${user.email})?`
      : `Sei sicuro di voler eliminare la giocatrice "${user.name}" (${user.email})?`;

    if (window.confirm(confirmText)) {
      if (isStaff) {
        await deleteStaffMember(user.id);
        setFeedbackMessage(`Membro staff "${user.name}" eliminato.`);
      } else {
        await deletePlayer(user.id);
        setFeedbackMessage(`Giocatrice "${user.name}" eliminata dalla rosa.`);
      }
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  return (
    <div id="user-credentials-admin-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Main Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center text-2xl font-bold shadow-md">
            <KeyRound className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Pannello Amministrazione & Permessi Ruoli</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                {adminCount} Admin Attivi • {allUsers.length} Utenti
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Configura i flag abilitativi per ruolo (chi vede cosa) e gestisci credenziali, PIN e accessi atlete/staff.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-add-staff-member"
            onClick={() => {
              setEditingStaff(null);
              setShowStaffModal(true);
            }}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Aggiungi Staff</span>
          </button>

          <button
            onClick={() => setShowSheetModal(true)}
            className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Importa Excel / Fogli</span>
          </button>

          <div className="flex items-center gap-2 bg-[#1D1D21] px-3 py-2 rounded-lg border border-[#2A2A2E] text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[#E0E0E1] font-medium hidden sm:inline">Supabase Sync Online</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2E] pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-admin-matrix"
            onClick={() => setActiveAdminTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeAdminTab === 'matrix'
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10'
                : 'bg-[#121214] text-gray-300 hover:text-white hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Matrice Permessi & Visibilità Sezioni</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeAdminTab === 'matrix' ? 'bg-black/20 text-black font-extrabold' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
            }`}>
              Flag Ruoli
            </span>
          </button>

          <button
            id="tab-admin-accounts"
            onClick={() => setActiveAdminTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeAdminTab === 'accounts'
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10'
                : 'bg-[#121214] text-gray-300 hover:text-white hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestione Account, PIN & Credenziali</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeAdminTab === 'accounts' ? 'bg-black/20 text-black font-extrabold' : 'bg-gray-800 text-gray-400'
            }`}>
              {allUsers.length}
            </span>
          </button>
        </div>

        {activeAdminTab === 'matrix' && (
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-[#D4AF37] border border-[#2A2A2E] text-xs font-semibold rounded-lg transition-colors"
            title="Ripristina permessi standard di club"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ripristina Predefiniti</span>
          </button>
        )}
      </div>

      {/* Alert feedback message if any */}
      {feedbackMessage && (
        <div className="p-4 bg-[#121214] border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xl">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: MATRICE PERMESSI RUOLI & VISIBILITA SEZIONI (FLAG ABILITATIVI) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'matrix' && (
        <div className="space-y-6">
          
          {/* Informational Guidance Banner */}
          <div className="bg-[#17171A] border border-[#D4AF37]/30 rounded-xl p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37] flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#E0E0E1] flex items-center gap-2">
                  <span>Come Funziona la Visibilità delle Sezioni per Ruolo</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold rounded-full">
                    Sincronizzazione Live Cloud
                  </span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  In questa matrice gli <strong>Admin</strong> possono abilitare o disabilitare l'accesso e la visualizzazione di ciascuna sezione del menu laterale in base al ruolo dell'utente (Head Coach, Assistant Coach, Preparatore Atletico, Fisioterapista, Atleta).
                </p>
                <ul className="text-xs text-gray-300 list-disc list-inside pt-1 space-y-0.5">
                  <li><strong className="text-[#D4AF37]">Admin:</strong> ha sempre accesso garantito al 100% delle sezioni e alla gestione credenziali.</li>
                  <li><strong className="text-cyan-400">Fisioterapia / Medico:</strong> solitamente ha visibilità riservata sulle cartelle cliniche e infortuni.</li>
                  <li><strong className="text-purple-400">Atlete:</strong> vedono solo le sezioni di loro pertinenza (es. RPE, infortuni, log allenamenti individuali, compiti).</li>
                  <li>Le modifiche ai flag hanno <strong>effetto immediato</strong> su tutti i dispositivi sincronizzati tramite Supabase.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Matrix Table */}
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#2A2A2E] bg-[#17171A]">
                    <th className="p-4 text-xs font-bold text-gray-300 uppercase tracking-wider w-[320px]">
                      Sezione Applicativa
                    </th>
                    {ALL_ROLES_CONFIG.map(rc => {
                      const isRoleAdmin = rc.isAdminAlways;
                      return (
                        <th key={rc.role} className="p-4 text-center border-l border-[#2A2A2E]/60">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rc.badgeColor}`}>
                              {rc.shortLabel}
                            </span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {rc.role === 'player' ? `${players.length} Atlete` : `${staffUsers.filter(s => s.role === rc.role).length} Staff`}
                            </span>
                            {!isRoleAdmin && (
                              <button
                                onClick={() => handleEnableAllForRole(rc.role)}
                                className="mt-1 text-[9px] text-gray-500 hover:text-[#D4AF37] underline transition-colors"
                                title="Abilita tutte le sezioni per questo ruolo"
                              >
                                Abilita tutto
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2E]/60 text-xs">
                  {CONFIGURABLE_SECTIONS_LIST.map((section) => {
                    const SectionIcon = section.icon;

                    return (
                      <tr key={section.id} className="hover:bg-[#1D1D21]/40 transition-colors">
                        {/* Section Title & Description */}
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-[#1D1D21] border border-[#2A2A2E] text-[#D4AF37] flex-shrink-0 mt-0.5">
                              <SectionIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[#E0E0E1] text-sm">{section.title}</p>
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#1D1D21] text-gray-400 border border-[#2A2A2E]">
                                  {section.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                                {section.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Permission Flag Columns */}
                        {ALL_ROLES_CONFIG.map(rc => {
                          const isRoleAdmin = rc.isAdminAlways;
                          const isEnabled = isRoleAdmin 
                            ? true 
                            : (rolePermissions[rc.role]?.[section.id] ?? DEFAULT_ROLE_PERMISSIONS[rc.role]?.[section.id] ?? true);

                          return (
                            <td key={rc.role} className="p-4 text-center border-l border-[#2A2A2E]/60 align-middle">
                              {isRoleAdmin ? (
                                <div className="inline-flex flex-col items-center gap-1 text-[#D4AF37]" title="Gli amministratori hanno accesso permanente">
                                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                                  </div>
                                  <span className="text-[9px] font-bold tracking-wider uppercase text-[#D4AF37]">
                                    Sempre ON
                                  </span>
                                </div>
                              ) : (
                                <button
                                  id={`btn-toggle-perm-${rc.role}-${section.id}`}
                                  onClick={() => handleTogglePermission(rc.role, section.id)}
                                  className={`group inline-flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all active:scale-95 ${
                                    isEnabled
                                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40 shadow-sm shadow-emerald-900/20'
                                      : 'bg-[#17171A] border-[#2A2A2E] text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                  }`}
                                  title={`Clicca per ${isEnabled ? 'disabilitare' : 'abilitare'} "${section.title}" per ${rc.label}`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    isEnabled ? 'bg-emerald-500 text-black font-bold' : 'bg-[#2A2A2E] text-gray-500'
                                  }`}>
                                    {isEnabled ? (
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold tracking-wider ${
                                    isEnabled ? 'text-emerald-400' : 'text-gray-500'
                                  }`}>
                                    {isEnabled ? 'ABILITATO' : 'NASCOSTO'}
                                  </span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer Legend */}
            <div className="p-4 bg-[#17171A] border-t border-[#2A2A2E] flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500 flex items-center justify-center text-black font-bold text-[9px]">
                    ✓
                  </div>
                  <span><strong>Abilitato:</strong> Visibile nella sidebar e navigabile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#2A2A2E] flex items-center justify-center text-gray-400 text-[9px]">
                    ✕
                  </div>
                  <span><strong>Nascosto:</strong> Rimosso dalla barra e protetto da accesso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span><strong>Admin:</strong> Privilegi massimi non revocabili</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 font-mono">
                Modifiche salvate nella tabella Supabase: <code>role_permissions</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: GESTIONE ACCOUNT, PIN & CREDENZIALI                            */}
      {/* ========================================================================= */}
      {activeAdminTab === 'accounts' && (
        <div className="space-y-6">
          
          {/* Admin Assignment Highlights Bar */}
          <div className="bg-[#17171A] border border-[#D4AF37]/30 rounded-xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37] flex-shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#E0E0E1] flex items-center gap-2">
                    <span>Membri dello Staff con Permessi Admin</span>
                    <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-[10px] font-black rounded-full">
                      {adminCount} {adminCount === 1 ? 'ADMIN ATTIVO' : 'ADMIN ATTIVI'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Gli utenti con permessi <strong>Admin</strong> possono visualizzare i PIN, invitare utenti, gestire la matrice di visibilità ed eseguire l'import da Excel.
                  </p>
                </div>
              </div>

              {/* Quick Staff Admin Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {staffUsers.map(staff => {
                  const isUserAdmin = staff.isAdmin;
                  return (
                    <div 
                      key={staff.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        isUserAdmin 
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-white' 
                          : 'bg-[#1D1D21] border-[#2A2A2E] text-gray-400'
                      }`}
                    >
                      <span className="font-semibold">{staff.name}</span>
                      <button
                        onClick={() => handleToggleAdmin(staff)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                          isUserAdmin 
                            ? 'bg-[#D4AF37] text-black hover:bg-red-500 hover:text-white' 
                            : 'bg-[#2A2A2E] text-gray-300 hover:bg-[#D4AF37] hover:text-black'
                        }`}
                        title={isUserAdmin ? "Clicca per rimuovere permessi Admin" : "Clicca per assegnare permessi Admin"}
                      >
                        <Crown className="w-2.5 h-2.5" />
                        <span>{isUserAdmin ? 'Admin: SI' : 'Rendi Admin'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls Bar: Search & Filter Tabs */}
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-[#1D1D21] px-3 py-2 rounded-lg border border-[#2A2A2E]">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome, email o ruolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'bg-[#1D1D21] text-gray-400 hover:text-white'
                }`}
              >
                Tutti ({allUsers.length})
              </button>

              <button
                onClick={() => setFilterType('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'staff'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'bg-[#1D1D21] text-gray-400 hover:text-white'
                }`}
              >
                Solo Staff ({staffUsers.length})
              </button>

              <button
                onClick={() => setFilterType('admins')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'admins'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'bg-[#1D1D21] text-gray-400 hover:text-white'
                }`}
              >
                Solo Admin ({adminCount})
              </button>

              <button
                onClick={() => setFilterType('players')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'players'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'bg-[#1D1D21] text-gray-400 hover:text-white'
                }`}
              >
                Solo Atlete ({players.length})
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A2E] bg-[#17171A] text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Utente / Nominativo</th>
                    <th className="p-3.5">Ruolo & Privilegi</th>
                    <th className="p-3.5">Email di Accesso</th>
                    <th className="p-3.5">Password Predefinita (PIN)</th>
                    <th className="p-3.5 pr-5 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2E]/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Nessun utente trovato con i filtri correnti.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isStaff = user.role !== 'player';
                      const isUserAdmin = user.isAdmin;
                      const pwd = user.tempPassword;
                      const isPasswordVisible = showPasswordMap[user.id] || false;

                      return (
                        <tr key={user.id} className="hover:bg-[#1D1D21]/50 transition-colors">
                          
                          {/* Utente info */}
                          <td className="p-3.5 pl-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isUserAdmin 
                                  ? 'bg-[#D4AF37] text-black shadow-md' 
                                  : isStaff
                                  ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E]'
                                  : 'bg-[#1D1D21] text-gray-300 border border-[#2A2A2E]'
                              }`}>
                                {isUserAdmin ? <Crown className="w-4 h-4" /> : user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-[#E0E0E1]">{user.name}</p>
                                  {isUserAdmin && (
                                    <span className="px-1.5 py-0.2 bg-[#D4AF37] text-black text-[9px] font-black rounded">
                                      ADMIN
                                    </span>
                                  )}
                                  {isStaff && !isUserAdmin && (
                                    <span className="px-1.5 py-0.2 bg-[#1D1D21] text-gray-400 border border-[#2A2A2E] text-[9px] font-bold rounded">
                                      STAFF
                                    </span>
                                  )}
                                </div>

                                {/* Ruolo selector for staff or text for player */}
                                {isStaff ? (
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                                    className="mt-1 px-1.5 py-0.5 bg-[#1D1D21] text-[10px] font-semibold text-[#D4AF37] border border-[#2A2A2E] rounded focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                                  >
                                    <option value="head_coach">Head Coach</option>
                                    <option value="assistant_coach">Assistant Coach</option>
                                    <option value="athletic_trainer">Preparatore Atletico</option>
                                    <option value="physiotherapist">Fisioterapista</option>
                                    <option value="direttore_tecnico">Direttore Tecnico / Dirigente</option>
                                  </select>
                                ) : (
                                  <span className="inline-block text-[10px] text-gray-400 mt-0.5">
                                    {user.position || 'Giocatrice'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Permessi Amministrativi (Admin switch) */}
                          <td className="p-3.5">
                            {isStaff ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleAdmin(user)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                                    isUserAdmin
                                      ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37]/30'
                                      : 'bg-[#1D1D21] border-[#2A2A2E] text-gray-400 hover:text-white hover:border-[#D4AF37]/40'
                                  }`}
                                  title={isUserAdmin ? "Rimuovi permessi Admin" : "Assegna permessi Admin"}
                                >
                                  <Crown className={`w-3.5 h-3.5 ${isUserAdmin ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                                  <span>{isUserAdmin ? 'Admin Credenziali: SI' : 'Rendi Admin'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-500 italic">Accesso Atleta</span>
                            )}
                          </td>

                          {/* Email di Accesso */}
                          <td className="p-3.5 font-mono text-gray-300">
                            <div>
                              <p>{user.email}</p>
                              {user.phone && <p className="text-[10px] text-gray-500 font-sans">{user.phone}</p>}
                            </div>
                          </td>

                          {/* Password / Pin */}
                          <td className="p-3.5">
                            {pwd ? (
                              <div className="flex items-center gap-2 font-mono bg-[#1D1D21] px-2.5 py-1.5 rounded-lg border border-[#2A2A2E] w-fit">
                                <span className="text-gray-200">{isPasswordVisible ? pwd : '••••••••••••'}</span>
                                <button
                                  onClick={() => toggleShowPassword(user.id)}
                                  className="text-gray-400 hover:text-white p-0.5"
                                  title="Mostra / Nascondi password"
                                >
                                  {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(pwd, user.id)}
                                  className="text-gray-400 hover:text-[#D4AF37] p-0.5"
                                  title="Copia password"
                                >
                                  {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-500 italic">Nessun accesso creato — usa "Crea Accesso"</span>
                            )}
                          </td>

                          {/* Azioni & Modifica */}
                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isStaff && (
                                <button
                                  onClick={() => {
                                    setEditingStaff(user);
                                    setShowStaffModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-[#1D1D21] hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#2A2A2E] hover:border-[#D4AF37]/40 transition-colors"
                                  title="Modifica dati completi e permessi"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Modifica</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleCreateAccount(user)}
                                disabled={credentialsActionId === user.id}
                                className="px-2 py-1 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#2A2A2E] transition-colors disabled:opacity-50"
                                title="Crea un accesso reale (email + password temporanea) per chi non ha un account Google"
                              >
                                <Send className={`w-3 h-3 text-[#D4AF37] ${credentialsActionId === user.id ? 'animate-spin' : ''}`} />
                                <span className="hidden lg:inline">Crea Accesso</span>
                              </button>

                              <button
                                onClick={() => handleResetPassword(user)}
                                disabled={credentialsActionId === user.id}
                                className="px-2 py-1 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#2A2A2E] transition-colors disabled:opacity-50"
                                title="Reimposta la password di un account già esistente"
                              >
                                <RefreshCw className={`w-3 h-3 text-gray-400 ${credentialsActionId === user.id ? 'animate-spin' : ''}`} />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="px-2 py-1 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-500/30 transition-colors"
                                title={isStaff ? "Elimina membro staff" : "Elimina giocatrice"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Staff Member Modal */}
      <StaffMemberModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setEditingStaff(null);
        }}
        onSave={handleSaveStaff}
        onDelete={deleteStaffMember}
        initialData={editingStaff}
      />

      {/* Google Sheets Import Modal */}
      <GoogleSheetsImportModal
        isOpen={showSheetModal}
        onClose={() => setShowSheetModal(false)}
      />

    </div>
  );
};
