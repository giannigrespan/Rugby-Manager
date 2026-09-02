import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile, PlayerPosition, RugbyDepartment, HealthStatus, UserRole } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  Bandage, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  Filter,
  X,
  FileSpreadsheet,
  Shield,
  UserPlus
} from 'lucide-react';
import { GoogleSheetsImportModal } from './modals/GoogleSheetsImportModal';
import { StaffMemberModal } from './modals/StaffMemberModal';
import { VillorbaHedgehogIcon } from './VillorbaLogo';

export const RosterDirectoryView: React.FC = () => {
  const { players, attendances, rpeFeedbacks, addPlayer, updatePlayer, deletePlayer, isSyncing } = useData();
  const { 
    currentUser, 
    staffUsers, 
    addStaffMember, 
    updateStaffMember, 
    deleteStaffMember 
  } = useAuth();
  
  const isStaff = currentUser?.role !== 'player';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<'all' | 'avanti' | 'trequarti' | 'staff'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'fit' | 'injured' | 'rehab_diff'>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<UserProfile | null>(null);

  // Form State for Player
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJersey, setFormJersey] = useState<number | ''>('');
  const [formPosition, setFormPosition] = useState<PlayerPosition>('Pilone Sinistro (1)');
  const [formDepartment, setFormDepartment] = useState<RugbyDepartment>('avanti');
  const [formPhone, setFormPhone] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formMedicalExpiry, setFormMedicalExpiry] = useState('');
  const [formStatus, setFormStatus] = useState<HealthStatus>('fit');
  const [formNotes, setFormNotes] = useState('');

  const filteredPlayers = useMemo(() => {
    if (filterDepartment === 'staff') return [];
    return players.filter(p => {
      const matchDep = filterDepartment === 'all' || p.department === filterDepartment;
      const matchStat = filterStatus === 'all' || p.status === filterStatus;
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.jerseyNumber && p.jerseyNumber.toString().includes(searchQuery));
      return matchDep && matchQuery && matchStat;
    });
  }, [players, filterDepartment, filterStatus, searchQuery]);

  const filteredStaff = useMemo(() => {
    if (filterDepartment !== 'staff' && filterDepartment !== 'all') return [];
    return staffUsers.filter(s => {
      const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [staffUsers, filterDepartment, searchQuery]);

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingPlayer) {
      await updatePlayer({
        ...editingPlayer,
        name: formName,
        email: formEmail,
        jerseyNumber: formJersey === '' ? undefined : Number(formJersey),
        position: formPosition,
        department: formDepartment,
        phone: formPhone || undefined,
        birthDate: formBirthDate || undefined,
        medicalExpiry: formMedicalExpiry || undefined,
        status: formStatus,
        notes: formNotes || undefined
      });
      setEditingPlayer(null);
    } else {
      await addPlayer({
        name: formName,
        email: formEmail,
        role: 'player',
        jerseyNumber: formJersey === '' ? undefined : Number(formJersey),
        position: formPosition,
        department: formDepartment,
        phone: formPhone || undefined,
        birthDate: formBirthDate || undefined,
        medicalExpiry: formMedicalExpiry || undefined,
        status: formStatus,
        notes: formNotes || undefined
      });
      setShowAddModal(false);
    }

    resetForm();
  };

  const handleSaveStaff = async (staffData: Omit<UserProfile, 'id' | 'createdAt'> | UserProfile) => {
    if ('id' in staffData && staffData.id) {
      await updateStaffMember(staffData as UserProfile);
    } else {
      await addStaffMember(staffData);
    }
  };

  const startEdit = (player: UserProfile) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormEmail(player.email);
    setFormJersey(player.jerseyNumber || '');
    setFormPosition(player.position);
    setFormDepartment(player.department);
    setFormPhone(player.phone || '');
    setFormBirthDate(player.birthDate || '');
    setFormMedicalExpiry(player.medicalExpiry || '');
    setFormStatus(player.status);
    setFormNotes(player.notes || '');
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormJersey('');
    setFormPosition('Pilone Sinistro (1)');
    setFormDepartment('avanti');
    setFormPhone('');
    setFormBirthDate('');
    setFormMedicalExpiry('');
    setFormStatus('fit');
    setFormNotes('');
  };

  const getPlayerStats = (playerId: string) => {
    const pAtts = attendances.filter(a => a.playerId === playerId);
    const pRpes = rpeFeedbacks.filter(f => f.playerId === playerId);
    const pct = pAtts.length ? Math.round((pAtts.filter(a => a.status === 'present' || a.status === 'late').length / pAtts.length) * 100) : 100;
    const avgRpe = pRpes.length ? (pRpes.reduce((a, b) => a + b.rpe, 0) / pRpes.length).toFixed(1) : '-';
    return { pct, avgRpe, totalSessions: pAtts.length };
  };

  return (
    <div id="roster-directory-container" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121214] border border-[#2A2A2E] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center p-2 shadow-md">
            <VillorbaHedgehogIcon className="w-8 h-8" color="#D4AF37" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[#E0E0E1] font-bold text-lg font-serif">Rosa & Staff Rugby Villorba</h2>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-full">
                {players.length} Atlete Rosa • {staffUsers.length} Staff
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Serie A Elite Femminile • Gestione atlete, staff tecnico/sanitario e visite mediche
            </p>
          </div>
        </div>

        {isStaff && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-staff-modal"
              onClick={() => { setEditingStaff(null); setShowStaffModal(true); }}
              className="px-3.5 py-2.5 bg-[#1D1D21] hover:bg-[#26262B] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuovo Staff</span>
            </button>

            <button
              id="btn-import-google-sheets"
              onClick={() => setShowSheetModal(true)}
              className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Importa Excel / Fogli</span>
            </button>

            <button
              id="btn-add-player-modal"
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Giocatrice</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca nome, ruolo o numero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-lg text-sm text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex flex-wrap items-center bg-[#1D1D21] p-1 rounded-lg border border-[#2A2A2E] text-xs gap-1">
            <button
              onClick={() => setFilterDepartment('all')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${filterDepartment === 'all' ? 'bg-[#D4AF37] text-black font-bold' : 'text-gray-400 hover:text-[#E0E0E1]'}`}
            >
              Tutti ({players.length + staffUsers.length})
            </button>
            <button
              onClick={() => setFilterDepartment('staff')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${filterDepartment === 'staff' ? 'bg-[#D4AF37] text-black font-bold' : 'text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
            >
              Staff ({staffUsers.length})
            </button>
            <button
              onClick={() => setFilterDepartment('avanti')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${filterDepartment === 'avanti' ? 'bg-[#D4AF37] text-black font-bold' : 'text-gray-400 hover:text-[#E0E0E1]'}`}
            >
              Avanti ({players.filter(p => p.department === 'avanti').length})
            </button>
            <button
              onClick={() => setFilterDepartment('trequarti')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${filterDepartment === 'trequarti' ? 'bg-[#D4AF37] text-black font-bold' : 'text-gray-400 hover:text-[#E0E0E1]'}`}
            >
              Trequarti ({players.filter(p => p.department === 'trequarti').length})
            </button>
          </div>
        </div>

        {filterDepartment !== 'staff' && (
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-[#1D1D21] text-[#E0E0E1] text-xs px-3 py-2 rounded-lg border border-[#2A2A2E] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">Tutti gli stati di salute</option>
              <option value="fit">Idonea / Al 100%</option>
              <option value="rehab_diff">Differenziato</option>
              <option value="injured">Infortunata</option>
            </select>
          </div>
        )}
      </div>

      {/* Staff Members Section (Shown when filter is 'staff' or 'all') */}
      {(filterDepartment === 'staff' || (filterDepartment === 'all' && filteredStaff.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#E0E0E1] font-serif flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <span>Staff Tecnico & Sanitario ({filteredStaff.length})</span>
            </h3>
            {isStaff && (
              <button
                onClick={() => { setEditingStaff(null); setShowStaffModal(true); }}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi Staff</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStaff.map((staff) => (
              <div 
                key={staff.id}
                className="bg-[#121214] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl p-5 shadow-xl space-y-3 transition-all hover:translate-y-[-2px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-sm shadow-md">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#E0E0E1] leading-tight font-serif">{staff.name}</h4>
                        <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded uppercase mt-0.5 ${
                          staff.role === 'head_coach' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                          staff.role === 'assistant_coach' ? 'bg-amber-500/20 text-amber-300' :
                          staff.role === 'athletic_trainer' ? 'bg-emerald-500/20 text-emerald-300' :
                          staff.role === 'physiotherapist' ? 'bg-cyan-500/20 text-cyan-300' :
                          staff.role === 'direttore_tecnico' ? 'bg-rose-500/20 text-rose-300' :
                          staff.role === 'programmatore' ? 'bg-[#D4AF37]/30 text-[#D4AF37]' :
                          'bg-[#1D1D21] text-gray-400'
                        }`}>
                          {staff.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#2A2A2E] space-y-1.5 text-[11px] text-gray-400">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </p>
                    {staff.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{staff.phone}</span>
                      </p>
                    )}
                    {staff.notes && (
                      <p className="text-[10px] text-gray-400 bg-[#1D1D21] p-2 rounded-lg border border-[#2A2A2E] italic mt-2">
                        "{staff.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {isStaff && (
                  <div className="pt-2 border-t border-[#2A2A2E] flex items-center justify-end gap-1 text-xs">
                    <button
                      onClick={() => {
                        setEditingStaff(staff);
                        setShowStaffModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#D4AF37] hover:bg-[#1D1D21] rounded-lg transition-colors"
                      title="Modifica Staff"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Eliminare ${staff.name} dallo staff?`)) {
                          deleteStaffMember(staff.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#1D1D21] rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roster Cards Grid (Players) */}
      {filterDepartment !== 'staff' && (
        <div className="space-y-3">
          {filterDepartment === 'all' && filteredStaff.length > 0 && (
            <h3 className="text-sm font-bold text-[#E0E0E1] font-serif flex items-center gap-2 pt-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>Giocatrici Rosa ({filteredPlayers.length})</span>
            </h3>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player, idx) => {
              const stats = getPlayerStats(player.id);

              return (
                <div 
                  key={player.id} 
                  className="bg-[#121214] border border-[#2A2A2E] hover:border-[#D4AF37]/50 rounded-xl p-5 shadow-xl space-y-3 transition-all hover:translate-y-[-2px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-[#1D1D21] border border-[#2A2A2E] flex items-center justify-center text-[#D4AF37] font-black text-sm shadow-md">
                          {player.jerseyNumber || (idx + 1)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#E0E0E1] leading-tight font-serif">{player.name}</h4>
                          <p className="text-[11px] text-gray-400">{player.position}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        player.status === 'fit' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        player.status === 'rehab_diff' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' :
                        'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}>
                        {player.status === 'fit' ? 'IDONEA' : player.status === 'rehab_diff' ? 'DIFF.' : 'INFORTUNIO'}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-center text-xs">
                      <div className="bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                        <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Presenze</span>
                        <span className={`font-black text-sm ${stats.pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {stats.pct}%
                        </span>
                      </div>

                      <div className="bg-[#1D1D21] p-2.5 rounded-lg border border-[#2A2A2E]">
                        <span className="text-[10px] text-gray-400 block uppercase tracking-wider">RPE Medio</span>
                        <span className="font-black text-sm text-[#D4AF37]">{stats.avgRpe}</span>
                      </div>
                    </div>

                    {/* Contact info & Medical */}
                    <div className="mt-3 pt-2 border-t border-[#2A2A2E] space-y-1 text-[11px] text-gray-400">
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="truncate">{player.email}</span>
                      </p>
                      {player.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>{player.phone}</span>
                        </p>
                      )}
                      {player.medicalExpiry && (
                        <p className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-3 h-3 text-[#D4AF37] shrink-0" />
                          <span>Visita: {player.medicalExpiry}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isStaff && (
                    <div className="pt-2 border-t border-[#2A2A2E] flex items-center justify-end gap-1 text-xs">
                      <button
                        onClick={() => startEdit(player)}
                        className="p-1.5 text-gray-400 hover:text-[#D4AF37] hover:bg-[#1D1D21] rounded-lg"
                        title="Modifica Scheda"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#1D1D21] rounded-lg"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div className="col-span-full bg-[#121214] border border-[#2A2A2E] rounded-xl p-8 text-center">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#E0E0E1] mb-1 font-serif">Nessuna giocatrice trovata</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto mb-3">
                  Nessun elemento corrisponde ai filtri impostati.
                </p>
                {isStaff && (
                  <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Nuova Giocatrice</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Player Modal */}
      {(showAddModal || editingPlayer) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[#E0E0E1] font-bold text-base font-serif flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                {editingPlayer ? `Modifica Scheda: ${editingPlayer.name}` : 'Aggiungi Nuova Giocatrice in Rosa'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingPlayer(null); }} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Nome e Cognome:</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="es. Sara Turani"
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Email Personale:</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sara.turani@rugby.it"
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">N. Maglia:</label>
                  <input
                    type="number"
                    value={formJersey}
                    onChange={(e) => setFormJersey(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="es. 1"
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Reparto:</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as RugbyDepartment)}
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="avanti">Avanti (Pack)</option>
                    <option value="trequarti">Trequarti (Backs)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Stato Idoneità:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as HealthStatus)}
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="fit">Idonea al 100%</option>
                    <option value="rehab_diff">Differenziato</option>
                    <option value="injured">Infortunata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Ruolo Tecnico Specifico:</label>
                <select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value as PlayerPosition)}
                  className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                >
                  <optgroup label="Avanti">
                    <option value="Pilone Sinistro (1)">Pilone Sinistro (1)</option>
                    <option value="Tallonatrice (2)">Tallonatrice (2)</option>
                    <option value="Pilone Destro (3)">Pilone Destro (3)</option>
                    <option value="Seconda Linea (4)">Seconda Linea (4)</option>
                    <option value="Seconda Linea (5)">Seconda Linea (5)</option>
                    <option value="Terza Linea Flanker (6)">Terza Linea Flanker (6)</option>
                    <option value="Terza Linea Flanker (7)">Terza Linea Flanker (7)</option>
                    <option value="Numero 8 (8)">Numero 8 (8)</option>
                  </optgroup>
                  <optgroup label="Trequarti">
                    <option value="Mediana di Mischia (9)">Mediana di Mischia (9)</option>
                    <option value="Mediana d'Apertura (10)">Mediana d'Apertura (10)</option>
                    <option value="Ala Sinistra (11)">Ala Sinistra (11)</option>
                    <option value="Primo Centro (12)">Primo Centro (12)</option>
                    <option value="Secondo Centro (13)">Secondo Centro (13)</option>
                    <option value="Ala Destra (14)">Ala Destra (14)</option>
                    <option value="Estremo (15)">Estremo (15)</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Telefono:</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+39 340 0000000"
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Scadenza Visita Medica:</label>
                  <input
                    type="date"
                    value={formMedicalExpiry}
                    onChange={(e) => setFormMedicalExpiry(e.target.value)}
                    className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Note Tecniche / Sanitarie:</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="es. Buona progressione in mischia, gestione carichi..."
                  className="w-full bg-[#1D1D21] border border-[#2A2A2E] text-white p-2.5 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2A2E] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPlayer(null); }}
                  className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 text-xs font-semibold rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingPlayer ? 'Salva Modifiche' : 'Aggiungi Giocatrice'}</span>
                </button>
              </div>

            </form>
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
