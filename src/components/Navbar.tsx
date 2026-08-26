import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  FileText, 
  CalendarSync, 
  Bell, 
  Shield, 
  UserCheck, 
  LogIn, 
  LogOut,
  RefreshCw,
  Zap,
  Activity
} from 'lucide-react';
import { RugbyDepartment } from '../types';
import { VillorbaLogo } from './VillorbaLogo';

export type TabType = 
  | 'presenze' 
  | 'rpe_focus' 
  | 'infortuni' 
  | 'fisioterapia' 
  | 'individuali' 
  | 'calci' 
  | 'rosa' 
  | 'sessioni' 
  | 'compiti' 
  | 'credenziali';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenCalendarSync: () => void;
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCalendarSync,
  onOpenNotifications,
  onOpenAuthModal
}) => {
  const { players, injuries, physioNotes, tasks, notifications, cloudSyncStatus, isSyncing, clearAllData } = useData();
  const { currentUser, staffUsers, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const activeInjuriesCount = injuries.filter(i => i.status !== 'cleared').length;
  const activePhysioNotesCount = physioNotes.length;
  const unreadNotifsCount = notifications.filter(n => currentUser && !n.readBy.includes(currentUser.id)).length;
  const totalPlayersCount = players.length;

  return (
    <header id="main-header" className="w-full bg-[#121214] border-b border-[#2A2A2E] sticky top-0 z-40 shadow-2xl backdrop-blur-md">
      {/* Top Bar: Brand, Status, Actions, Auth */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Team Identity */}
        <div className="flex items-center gap-3">
          <VillorbaLogo size="md" colorMode="gold" showSubtitle={true} />
          <div className="hidden lg:block border-l border-[#2A2A2E] pl-3">
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span>{totalPlayersCount > 0 ? `${totalPlayersCount} Atlete in Rosa` : 'Database Pronto'}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <span className={`w-2 h-2 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-[#D4AF37]'}`}></span>
                {cloudSyncStatus === 'synced' ? 'Supabase DB Connesso' : 'Sincronizzazione Locale'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sync Calendars Button */}
          <button
            id="btn-calendar-sync-modal"
            onClick={onOpenCalendarSync}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white text-xs font-medium rounded-lg border border-[#2A2A2E] transition-colors"
          >
            <CalendarSync className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Sincronizza Calendari</span>
            <span className="sm:hidden">Calendario</span>
          </button>

          {/* Push Notifications Bell */}
          <button
            id="btn-notification-bell"
            onClick={onOpenNotifications}
            className="relative p-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] transition-colors"
            title="Centro Notifiche Push"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* User Account / Role Switcher */}
          <div className="relative">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1D1D21] hover:bg-[#26262B] border border-[#2A2A2E] rounded-lg text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-[#E0E0E1] leading-tight truncate max-w-[130px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#D4AF37] font-medium capitalize">
                      {currentUser.isAdmin ? 'Admin • ' : ''}{currentUser.role.replace('_', ' ')}
                    </p>
                  </div>
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#121214] border border-[#2A2A2E] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-[#2A2A2E] text-xs">
                      <p className="text-gray-400 font-medium">Connesso come:</p>
                      <p className="font-bold text-[#E0E0E1] truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="pt-2 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => {
                            if (window.confirm("Sei sicuro di voler svuotare tutti i dati salvati?")) {
                              clearAllData();
                            }
                            setShowRoleMenu(false);
                          }}
                          className="px-2 py-1 text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                          title="Svuota tutti i dati per iniziare da zero"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Svuota Dati</span>
                        </button>
                        <button
                          onClick={() => { logout(); setShowRoleMenu(false); }}
                          className="px-2 py-1 text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors ml-auto"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Esci</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-login-trigger"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Accedi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="w-full bg-[#0A0A0B] border-t border-[#2A2A2E] px-3 sm:px-6 py-2.5 overflow-x-auto scrollbar-thin">
        <div className="max-w-[1700px] mx-auto flex items-center gap-2 min-w-max">
          
          {/* 1. Matrice Presenze & Modifiche Staff */}
          <button
            id="tab-presenze"
            onClick={() => setActiveTab('presenze')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'presenze'
                ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                : 'bg-[#121214] text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>1. Matrice Presenze & Modifiche Staff</span>
          </button>

          {/* 2. Monitoraggio RPE & Focus */}
          <button
            id="tab-rpe-focus"
            onClick={() => setActiveTab('rpe_focus')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'rpe_focus'
                ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                : 'bg-[#121214] text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">💓</span>
            <span>2. Monitoraggio RPE & Focus</span>
          </button>

          {/* 3. Report Fastidi / Infortuni */}
          <button
            id="tab-infortuni"
            onClick={() => setActiveTab('infortuni')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'infortuni'
                ? 'bg-[#1D1D21] text-red-400 border border-red-500/80 shadow-sm'
                : 'bg-[#121214] text-red-400/80 hover:text-red-300 hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">⚠️</span>
            <span>3. Report Fastidi / Infortuni</span>
            {activeInjuriesCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-red-500/20 text-red-300 rounded-full border border-red-500/40 font-bold">
                {activeInjuriesCount}
              </span>
            )}
          </button>

          {/* 4. Note Fisioterapia & Schede Salute */}
          <button
            id="tab-fisioterapia"
            onClick={() => setActiveTab('fisioterapia')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'fisioterapia'
                ? 'bg-[#1D1D21] text-cyan-400 border border-cyan-500/80 shadow-sm'
                : 'bg-[#121214] text-cyan-400/80 hover:text-cyan-300 hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">🩺</span>
            <span>4. Note Fisioterapia & Schede Salute ({activePhysioNotesCount})</span>
          </button>

          {/* 5. Allenamenti Individuali */}
          <button
            id="tab-individuali"
            onClick={() => setActiveTab('individuali')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'individuali'
                ? 'bg-[#1D1D21] text-emerald-400 border border-emerald-500/80 shadow-sm'
                : 'bg-[#121214] text-emerald-400/80 hover:text-emerald-300 hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">🍀</span>
            <span>5. Allenamenti Individuali</span>
          </button>

          {/* 6. Calci Trequarti (45 min) */}
          <button
            id="tab-calci"
            onClick={() => setActiveTab('calci')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'calci'
                ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                : 'bg-[#121214] text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">🎯</span>
            <span>6. Calci Trequarti (45 min)</span>
          </button>

          {/* 7. Anagrafica Rosa (44) */}
          <button
            id="tab-rosa"
            onClick={() => setActiveTab('rosa')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'rosa'
                ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                : 'bg-[#121214] text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span>7. Anagrafica Rosa ({totalPlayersCount})</span>
          </button>

          {/* 8. Gestione Sessioni & Focus */}
          <button
            id="tab-sessioni"
            onClick={() => setActiveTab('sessioni')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'sessioni'
                ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                : 'bg-[#121214] text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">✏️</span>
            <span>8. Gestione Sessioni & Focus</span>
          </button>

          {/* 9. Assegna Compiti */}
          <button
            id="tab-compiti"
            onClick={() => setActiveTab('compiti')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'compiti'
                ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                : 'bg-[#121214] text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21] border border-[#2A2A2E]'
            }`}
          >
            <span className="text-base leading-none">🎯</span>
            <span>9. Assegna Compiti</span>
            {tasks.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] rounded-full border border-[#D4AF37]/40 font-bold">
                {tasks.length}
              </span>
            )}
          </button>

          {/* 10. Gestione Utenti & Credenziali */}
          <button
            id="tab-credenziali"
            onClick={() => setActiveTab('credenziali')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'credenziali'
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                : 'bg-[#121214] text-[#D4AF37] hover:bg-[#1D1D21] border border-[#D4AF37]/40'
            }`}
          >
            <span className="text-base leading-none">👤+</span>
            <span>10. Gestione Utenti & Credenziali</span>
          </button>

        </div>
      </div>
    </header>
  );
};
