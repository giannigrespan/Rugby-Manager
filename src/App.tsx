import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar, TabType } from './components/Sidebar';
import { AttendanceMatrixView } from './components/AttendanceMatrixView';
import { RpeAndFocusView } from './components/RpeAndFocusView';
import { InjuryReportView } from './components/InjuryReportView';
import { PhysioNotesView } from './components/PhysioNotesView';
import { IndividualTrainingsView } from './components/IndividualTrainingsView';
import { KickingSpecialistsView } from './components/KickingSpecialistsView';
import { RosterDirectoryView } from './components/RosterDirectoryView';
import { SessionManagementView } from './components/SessionManagementView';
import { TaskAssignmentView } from './components/TaskAssignmentView';
import { UserCredentialsAdminView } from './components/UserCredentialsAdminView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
import { CalendarSyncModal } from './components/modals/CalendarSyncModal';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { AuthModal } from './components/modals/AuthModal';
import { VillorbaHedgehogIcon } from './components/VillorbaLogo';
import { Menu, Bell, LogIn, CalendarSync, Shield, FileText } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('presenze');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modals state
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { notifications, cloudSyncStatus, players } = useData();
  const { currentUser } = useAuth();
  const unreadNotifsCount = notifications.filter(n => currentUser && !n.readBy.includes(currentUser.id)).length;

  // Handle URL query parameters or hash for direct OAuth verification links (e.g. ?page=privacy or #/privacy)
  useEffect(() => {
    const handleUrlRoute = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      if (pageParam === 'privacy' || hash === '#/privacy' || hash === '#privacy' || pathname === '/privacy') {
        setActiveTab('privacy');
      } else if (pageParam === 'terms' || hash === '#/terms' || hash === '#terms' || pathname === '/terms' || pageParam === 'tos') {
        setActiveTab('terms');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'privacy') {
      window.history.pushState({}, '', '?page=privacy');
    } else if (tab === 'terms') {
      window.history.pushState({}, '', '?page=terms');
    } else {
      if (window.location.search.includes('page=privacy') || window.location.search.includes('page=terms')) {
        window.history.pushState({}, '', window.location.pathname);
      }
    }
  };

  const getTabHeading = () => {
    switch (activeTab) {
      case 'presenze': return '1. Matrice Presenze & Modifiche Staff';
      case 'rpe_focus': return '2. Monitoraggio RPE & Focus Gara';
      case 'infortuni': return '3. Report Fastidi & Infortuni / HIA';
      case 'fisioterapia': return '4. Note Fisioterapia & Cartelle Cliniche';
      case 'individuali': return '5. Allenamenti Individuali & Mobilità';
      case 'calci': return '6. Sessioni Calci Trequarti (45 min)';
      case 'rosa': return '7. Anagrafica Rosa Completa';
      case 'sessioni': return '8. Gestione & Pianificazione Sessioni';
      case 'compiti': return '9. Assegnazione Compiti & Video Analysis';
      case 'credenziali': return '10. Gestione Credenziali & Accessi Atlete';
      case 'privacy': return 'Norme sulla Privacy & Protezione Dati (GDPR)';
      case 'terms': return 'Termini di Servizio & Condizioni di Utilizzo';
      default: return 'Rugby Elite Manager';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E1] flex font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* Lateral Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Workspace Column */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        
        {/* Top Header Bar for Mobile & Quick Status */}
        <header className="sticky top-0 z-30 bg-[#121214]/95 backdrop-blur-md border-b border-[#2A2A2E] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="btn-open-mobile-menu"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] transition-colors"
              title="Apri menu laterale"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Villorba Logo Icon Badge in Header */}
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-[#1D1D21] border border-[#D4AF37]/30 p-1 flex-shrink-0">
              <VillorbaHedgehogIcon className="w-6 h-6" color="#D4AF37" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#E0E0E1] font-serif tracking-tight flex items-center gap-2">
                <span>{getTabHeading()}</span>
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="hidden sm:inline font-semibold text-gray-300">Villorba Rugby</span>
                <span className="hidden sm:inline text-gray-600">•</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}></span>
                  {cloudSyncStatus === 'synced' ? 'Firestore Sincronizzato' : 'Locale'}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">{players.length} Atlete</span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Top Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCalendarSyncOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white text-xs font-medium rounded-lg border border-[#2A2A2E] transition-colors"
            >
              <CalendarSync className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Calendario</span>
            </button>

            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 hover:text-white rounded-lg border border-[#2A2A2E] transition-colors"
              title="Notifiche"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {!currentUser && (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Accedi</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1700px] w-full mx-auto">
          {activeTab === 'presenze' && <AttendanceMatrixView />}
          {activeTab === 'rpe_focus' && <RpeAndFocusView />}
          {activeTab === 'infortuni' && <InjuryReportView />}
          {activeTab === 'fisioterapia' && <PhysioNotesView />}
          {activeTab === 'individuali' && <IndividualTrainingsView />}
          {activeTab === 'calci' && <KickingSpecialistsView />}
          {activeTab === 'rosa' && <RosterDirectoryView />}
          {activeTab === 'sessioni' && <SessionManagementView />}
          {activeTab === 'compiti' && <TaskAssignmentView />}
          {activeTab === 'credenziali' && <UserCredentialsAdminView />}
          {activeTab === 'privacy' && <PrivacyPolicyView onBack={() => navigateToTab('presenze')} />}
          {activeTab === 'terms' && <TermsOfServiceView onBack={() => navigateToTab('presenze')} />}
        </main>

        {/* Footer with Legal & Privacy Links */}
        <footer className="border-t border-[#2A2A2E] bg-[#121214] py-4 px-6 text-xs text-gray-400 mt-auto">
          <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#E0E0E1] tracking-tight">RUGBY VILLORBA TEAM MANAGER</span>
              <span className="text-[#D4AF37]">•</span>
              <span className="text-gray-400">Serie A Elite Femminile</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-gray-400">
              <button
                id="link-footer-privacy"
                onClick={() => navigateToTab('privacy')}
                className={`hover:text-[#D4AF37] transition-colors flex items-center gap-1 ${
                  activeTab === 'privacy' ? 'text-[#D4AF37] font-bold underline' : ''
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Norme sulla Privacy</span>
              </button>
              
              <span>•</span>
              
              <button
                id="link-footer-terms"
                onClick={() => navigateToTab('terms')}
                className={`hover:text-[#D4AF37] transition-colors flex items-center gap-1 ${
                  activeTab === 'terms' ? 'text-[#D4AF37] font-bold underline' : ''
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Termini di Servizio</span>
              </button>

              <span className="hidden sm:inline">•</span>
              <span className="text-gray-500 hidden sm:inline">Google API Limited Use Compliant</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Modals */}
      <CalendarSyncModal 
        isOpen={isCalendarSyncOpen} 
        onClose={() => setIsCalendarSyncOpen(false)} 
      />

      <NotificationCenterModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
