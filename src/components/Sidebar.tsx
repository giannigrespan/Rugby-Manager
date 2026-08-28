import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth, canAccessCredentialsPanel } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  CalendarSync, 
  Bell, 
  Shield, 
  UserCheck, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Zap, 
  Activity, 
  HeartPulse, 
  AlertTriangle, 
  Stethoscope, 
  Dumbbell, 
  Target, 
  KeyRound, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Clock, 
  ClipboardList,
  Crown 
} from 'lucide-react';

import { VillorbaLogo, VillorbaHedgehogIcon } from './VillorbaLogo';

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
  | 'credenziali'
  | 'privacy'
  | 'terms';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenCalendarSync: () => void;
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCalendarSync,
  onOpenNotifications,
  onOpenAuthModal,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const { players, injuries, physioNotes, tasks, notifications, cloudSyncStatus, clearAllData } = useData();
  const { currentUser, staffUsers, logout, isSectionVisibleForUser } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const activeInjuriesCount = injuries.filter(i => i.status !== 'cleared').length;
  const activePhysioNotesCount = physioNotes.length;
  const unreadNotifsCount = notifications.filter(n => currentUser && !n.readBy.includes(currentUser.id)).length;
  const totalPlayersCount = players.length;

  const isAdmin = !!currentUser?.isAdmin;

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const rawNavGroups = [
    {
      groupTitle: 'CAMPO & PRESENZE',
      items: [
        {
          id: 'presenze' as TabType,
          label: 'Matrice Presenze',
          subtitle: 'Appello & modifiche staff',
          icon: Calendar,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'sessioni' as TabType,
          label: 'Gestione Sessioni',
          subtitle: 'Pianificazione & focus',
          icon: Clock,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'calci' as TabType,
          label: 'Calci & Specialisti',
          subtitle: 'Piazzati & drop trequarti',
          icon: Target,
          badge: null,
          badgeColor: ''
        }
      ]
    },
    {
      groupTitle: 'PERFORMANCE & BENESSERE',
      items: [
        {
          id: 'rpe_focus' as TabType,
          label: 'RPE & Focus Gara',
          subtitle: 'Carico interno & feedback',
          icon: HeartPulse,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'infortuni' as TabType,
          label: 'Report Infortuni / HIA',
          subtitle: 'Fastidi & disponibilità',
          icon: AlertTriangle,
          badge: activeInjuriesCount > 0 ? activeInjuriesCount : null,
          badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40'
        },
        {
          id: 'fisioterapia' as TabType,
          label: 'Cartella Fisioterapia',
          subtitle: 'Trattamenti & visite',
          icon: Stethoscope,
          badge: activePhysioNotesCount > 0 ? activePhysioNotesCount : null,
          badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
        },
        {
          id: 'individuali' as TabType,
          label: 'Allenamenti Extra',
          subtitle: 'Palestra, mobilità & gym',
          icon: Dumbbell,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'compiti' as TabType,
          label: 'Assegna Compiti',
          subtitle: 'Video analysis & schede',
          icon: ClipboardList,
          badge: tasks.length > 0 ? tasks.length : null,
          badgeColor: 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
        }
      ]
    },
    {
      groupTitle: 'ROSA & AMMINISTRAZIONE',
      items: [
        {
          id: 'rosa' as TabType,
          label: 'Anagrafica Rosa',
          subtitle: `${totalPlayersCount} atlete registrate`,
          icon: Users,
          badge: totalPlayersCount > 0 ? totalPlayersCount : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
        },
        {
          id: 'credenziali' as TabType,
          label: 'Permessi & Accessi',
          subtitle: 'Matrice ruoli e credenziali',
          icon: KeyRound,
          badge: null,
          badgeColor: ''
        }
      ]
    }
  ];

  // Filter items by role permissions
  const navGroups = rawNavGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.id === 'credenziali') {
        return canAccessCredentialsPanel(currentUser);
      }
      return isSectionVisibleForUser(item.id as any, currentUser);
    })
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#121214] border-r border-[#2A2A2E] flex flex-col transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#2A2A2E] flex items-center justify-between">
          {isCollapsed && !isMobileOpen ? (
            <div className="w-full flex justify-center">
              <div 
                className="w-11 h-11 bg-[#1D1D21] border border-[#D4AF37]/40 rounded-xl shadow-lg shadow-black/40 flex items-center justify-center p-1.5 cursor-pointer hover:border-[#D4AF37] transition-all"
                title="Rugby Villorba - Serie A Elite Femminile"
                onClick={() => setIsCollapsed(false)}
              >
                <VillorbaHedgehogIcon className="w-7 h-7" color="#D4AF37" />
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <VillorbaLogo size="md" colorMode="gold" showSubtitle={true} />
            </div>
          )}

          {/* Close button on mobile */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1D1D21] ml-2"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse toggle on desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-[#D4AF37] hover:bg-[#1D1D21] transition-colors ml-2"
            title={isCollapsed ? "Espandi menu laterale" : "Comprimi menu laterale"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sync Status Banner */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-2 bg-[#0A0A0B]/60 border-b border-[#2A2A2E] flex items-center justify-between text-[11px]">
            <span className="text-gray-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-[#D4AF37]'}`}></span>
              <span className="truncate">{cloudSyncStatus === 'synced' ? 'Supabase DB Online' : 'Sincronizzazione'}</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {totalPlayersCount > 0 ? `${totalPlayersCount} atlete` : 'Rosa vuota'}
            </span>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="p-3 border-b border-[#2A2A2E] space-y-2">
          {/* Quick Actions Row */}
          <div className={`grid ${isCollapsed && !isMobileOpen ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-2'}`}>
            <button
              id="btn-sidebar-calendar"
              onClick={onOpenCalendarSync}
              className={`flex items-center gap-1.5 px-2.5 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors ${
                isCollapsed && !isMobileOpen ? 'justify-center' : ''
              }`}
              title="Sincronizza Calendari (.ics, Google)"
            >
              <CalendarSync className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className="truncate">Calendario</span>}
            </button>

            <button
              id="btn-sidebar-notifs"
              onClick={onOpenNotifications}
              className={`relative flex items-center gap-1.5 px-2.5 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] text-xs font-medium transition-colors ${
                isCollapsed && !isMobileOpen ? 'justify-center' : ''
              }`}
              title="Notifiche & Broadcast Squadra"
            >
              <Bell className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className="truncate">Notifiche</span>}
              {unreadNotifsCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-red-500 text-white font-bold rounded-full">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>

          {/* Clear Data Button (for Admin) */}
          <button
            onClick={() => {
              if (window.confirm("Sei sicuro di voler svuotare tutti i dati (rosa, sessioni, presenze, infortuni) per iniziare da zero?")) {
                clearAllData();
              }
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 bg-[#1D1D21] hover:bg-red-950/40 text-gray-400 hover:text-red-400 rounded-lg border border-[#2A2A2E] hover:border-red-500/40 text-xs font-medium transition-colors ${
              isCollapsed && !isMobileOpen ? 'justify-center' : ''
            }`}
            title="Svuota tutti i dati per iniziare da zero"
          >
            <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Svuota Dati (Reset)</span>}
          </button>
        </div>

        {/* Navigation Tabs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <p className="px-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase font-sans">
                  {group.groupTitle}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37] font-semibold shadow-md shadow-black/40'
                        : 'text-gray-400 hover:text-[#E0E0E1] hover:bg-[#1D1D21]/60 border border-transparent'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                    {(!isCollapsed || isMobileOpen) && (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs truncate font-medium">{item.label}</span>
                          {item.badge !== null && (
                            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Account / Role Switcher Footer */}
        <div className="p-3 border-t border-[#2A2A2E] bg-[#0A0A0B]/40 relative">
          {currentUser ? (
            <div>
              <button
                id="btn-sidebar-user"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`w-full flex items-center gap-2.5 p-2 bg-[#1D1D21] hover:bg-[#26262B] border border-[#2A2A2E] rounded-xl text-left transition-colors ${
                  isCollapsed && !isMobileOpen ? 'justify-center p-2' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-[#E0E0E1] truncate">
                        {currentUser.name}
                      </p>
                      {currentUser.isAdmin && (
                        <Crown className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#D4AF37] font-medium capitalize truncate">
                      {currentUser.isAdmin ? 'Admin • ' : ''}
                      {currentUser.role.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </button>

              {/* User menu dropdown */}
              {showRoleMenu && (
                <div className={`absolute bottom-full mb-2 bg-[#121214] border border-[#2A2A2E] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 ${
                  isCollapsed && !isMobileOpen ? 'left-full ml-2 w-64' : 'left-3 right-3'
                }`}>
                  <div className="p-1 pb-2 border-b border-[#2A2A2E] text-xs">
                    <p className="text-gray-400 font-medium">Connesso come:</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="font-bold text-[#E0E0E1] truncate">{currentUser.name}</p>
                      {currentUser.isAdmin && (
                        <span className="px-1.5 py-0.5 bg-[#D4AF37] text-black text-[9px] font-black rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-[#D4AF37] mt-1 font-semibold uppercase tracking-wider">
                      Ruolo: {currentUser.role.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => { logout(); setShowRoleMenu(false); }}
                      className="w-full px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnetti (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-sidebar-login"
              onClick={onOpenAuthModal}
              className={`w-full flex items-center gap-2 px-3 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-xl shadow-md transition-colors ${
                isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''
              }`}
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>Accedi all'App</span>}
            </button>
          )}

          {/* Legal / Policy links in sidebar */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="mt-2 pt-2 border-t border-[#2A2A2E]/60 flex items-center justify-center gap-3 text-[10px] text-gray-500">
              <button
                onClick={() => handleSelectTab('privacy')}
                className={`hover:text-[#D4AF37] transition-colors ${activeTab === 'privacy' ? 'text-[#D4AF37] font-bold' : ''}`}
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectTab('terms')}
                className={`hover:text-[#D4AF37] transition-colors ${activeTab === 'terms' ? 'text-[#D4AF37] font-bold' : ''}`}
              >
                Termini d'Uso
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
