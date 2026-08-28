import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { ShieldCheck, X, Check, Trash2, Mail, Phone, User, Award, FileText, KeyRound, ShieldAlert } from 'lucide-react';

interface StaffMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Omit<UserProfile, 'id' | 'createdAt'> | UserProfile) => Promise<void>;
  onDelete?: (staffId: string) => Promise<void>;
  initialData?: UserProfile | null;
}

export const StaffMemberModal: React.FC<StaffMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('head_coach');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || 'head_coach');
      setIsAdmin(initialData.isAdmin ?? false);
      setPhone(initialData.phone || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setEmail('');
      setRole('head_coach');
      setIsAdmin(false);
      setPhone('');
      setNotes('');
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Inserisci il nome e cognome del membro dello staff.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Inserisci un indirizzo email valido.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (initialData) {
        await onSave({
          ...initialData,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          isAdmin,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          position: 'Staff Tecnico',
          department: 'staff',
          status: 'fit'
        });
      } else {
        await onSave({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          isAdmin,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          position: 'Staff Tecnico',
          department: 'staff',
          status: 'fit'
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Errore durante il salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    if (window.confirm(`Sei sicuro di voler eliminare "${initialData.name}" dallo staff?`)) {
      setIsSaving(true);
      try {
        await onDelete(initialData.id);
        onClose();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Errore durante l\'eliminazione.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="staff-member-modal"
        className="bg-[#121214] border border-[#2A2A2E] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#2A2A2E] flex items-center justify-between bg-[#17171A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E0E0E1] font-serif">
                {initialData ? 'Modifica Membro Staff' : 'Aggiungi Nuovo Membro Staff'}
              </h3>
              <p className="text-xs text-gray-400">
                Staff Tecnico, Sanitario e Amministrazione Rugby Villorba
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2A2A2E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Nome e Cognome */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Nome e Cognome *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Gianni Grespan"
              className="w-full px-3.5 py-2.5 bg-[#1D1D21] border border-[#2A2A2E] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
          </div>

          {/* Ruolo Staff */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ruolo / Incarico Operativo *</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 bg-[#1D1D21] border border-[#2A2A2E] rounded-xl text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
            >
              <option value="head_coach">Head Coach / Primo Allenatore</option>
              <option value="assistant_coach">Assistant Coach / All. Avanti o Trequarti</option>
              <option value="athletic_trainer">Preparatore Atletico / S&C Trainer</option>
              <option value="physiotherapist">Fisioterapista / Medico Sanitario</option>
              <option value="direttore_tecnico">Direttore Tecnico / Dirigente</option>
            </select>
          </div>

          {/* Admin Credentials Manager Toggle */}
          <div className="p-3.5 bg-[#1D1D21] border border-[#2A2A2E] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#2A2A2E] text-gray-400'}`}>
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Permessi di Amministratore (Admin)</span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-bold rounded">
                        ATTIVO
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Abilita la gestione credenziali, password e modifiche anagrafiche
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2A2A2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
              </label>
            </div>

            {isAdmin && (
              <p className="text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/20">
                ✓ Questo utente potrà accedere alla scheda <strong>"10. Accessi & Credenziali"</strong>, creare nuovi account staff/atlete, modificare ruoli e importare file Excel/Google Sheets.
              </p>
            )}
          </div>

          {/* Email di Accesso */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Email di Accesso (Google Auth o Password) *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="es. nome.cognome@rugbyvillorba.it oppure gmail"
              className="w-full px-3.5 py-2.5 bg-[#1D1D21] border border-[#2A2A2E] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] font-mono transition-all"
            />
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Telefono / Cellulare (Opzionale)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39 340 1234567"
              className="w-full px-3.5 py-2.5 bg-[#1D1D21] border border-[#2A2A2E] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
          </div>

          {/* Note / Competenze */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Note & Incarichi Specifici</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Coordinamento touche, monitoraggio GPS, protocolli HIA..."
              className="w-full px-3.5 py-2 bg-[#1D1D21] border border-[#2A2A2E] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#2A2A2E] flex items-center justify-between gap-3">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Elimina</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 text-xs font-semibold rounded-xl border border-[#2A2A2E] transition-all"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-[#D4AF37] hover:bg-[#C09F30] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Salvataggio...' : (initialData ? 'Salva Modifiche' : 'Crea Membro Staff')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

