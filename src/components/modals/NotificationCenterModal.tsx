import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, 
  Send, 
  CheckCheck, 
  Trash2, 
  Calendar, 
  Target, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  ShieldAlert,
  Smartphone
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ isOpen, onClose }) => {
  const { notifications, sendPushNotification, markNotificationAsRead, deleteNotification, sessions, isSyncing } = useData();
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role !== 'player';

  const [showSendForm, setShowSendForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'avanti' | 'trequarti'>('all');
  const [category, setCategory] = useState<'session_reminder' | 'task_assigned' | 'medical_expiry' | 'urgent_announcement'>('session_reminder');
  const [sentAlert, setSentAlert] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    await sendPushNotification(title, message, targetType, category);
    setTitle('');
    setMessage('');
    setShowSendForm(false);
    setSentAlert(true);
    setTimeout(() => setSentAlert(false), 3000);
  };

  const sendQuickSessionReminder = async () => {
    const next = sessions.find(s => s.status === 'scheduled') || sessions[0];
    if (!next) return;

    await sendPushNotification(
      `🏉 Promemoria Allenamento: ${next.title}`,
      `Appuntamento oggi alle ${next.time} presso ${next.location}. Focus: ${next.primaryFocus}. Confermate la presenza!`,
      'all',
      'session_reminder'
    );

    setSentAlert(true);
    setTimeout(() => setSentAlert(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#121214] border border-[#2A2A2E] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1D1D21] text-[#D4AF37] border border-[#2A2A2E] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[#E0E0E1] font-bold text-base font-serif">Centro Notifiche Push</h3>
                <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-bold rounded-full">
                  {notifications.filter(n => !n.read).length} Nuove
                </span>
              </div>
              <p className="text-xs text-gray-400">Avvisi prossimi allenamenti, video analisi e scadenze mediche</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>

        {/* Success Alert */}
        {sentAlert && (
          <div className="p-3 bg-[#121214] border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Notifica Push inviata istantaneamente a tutta la squadra!</span>
          </div>
        )}

        {/* Body Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          
          {/* Quick Staff Broadcast Actions */}
          {isStaff && !showSendForm && (
            <div className="bg-[#1D1D21] border border-[#2A2A2E] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E0E0E1] font-serif">Azioni Rapide Notifiche Staff:</span>
                <button
                  onClick={() => setShowSendForm(true)}
                  className="px-2.5 py-1 bg-[#D4AF37] hover:bg-[#C09F30] text-black rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Nuova Notifica Custom</span>
                </button>
              </div>

              <button
                onClick={sendQuickSessionReminder}
                disabled={isSyncing}
                className="w-full py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>Invia Push "Promemoria Prossimo Allenamento" alle 44 Atlete</span>
              </button>
            </div>
          )}

          {/* New Custom Notification Form */}
          {showSendForm && isStaff && (
            <form onSubmit={handleSend} className="bg-[#1D1D21] border border-[#D4AF37]/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-2">
                <h4 className="font-bold text-[#E0E0E1] font-serif flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Componi Nuova Notifica Push
                </h4>
                <button type="button" onClick={() => setShowSendForm(false)} className="text-gray-400 hover:text-white text-xs">Annulla</button>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Titolo:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Cambio orario allenamento giovedì..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Messaggio:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="es. Si avvisano le atlete che la seduta inizierà alle 19:30 causa pioggia..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Destinatari:</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">Tutta la Squadra</option>
                    <option value="avanti">Solo Avanti</option>
                    <option value="trequarti">Solo Trequarti</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1 uppercase tracking-wider text-[11px]">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#121214] border border-[#2A2A2E] rounded-lg text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="session_reminder">Promemoria Allenamento</option>
                    <option value="task_assigned">Nuovo Compito Video/Gym</option>
                    <option value="medical_expiry">Scadenza Visita Medica</option>
                    <option value="urgent_announcement">Avviso Urgente Staff</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#C09F30] text-black font-bold rounded-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Invia Notifica Push</span>
              </button>
            </form>
          )}

          {/* Notifications Feed */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider font-serif">
              Cronologia Notifiche Ricevute ({notifications.length})
            </h4>

            {notifications.map(notif => (
              <div 
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
                  notif.read ? 'bg-[#1D1D21]/60 border-[#2A2A2E] text-gray-400' : 'bg-[#1D1D21] border-[#D4AF37]/40 text-gray-200 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${notif.read ? 'bg-gray-600' : 'bg-[#D4AF37] animate-pulse'}`} />
                    <h5 className={`font-bold text-xs font-serif ${notif.read ? 'text-gray-300' : 'text-[#E0E0E1]'}`}>{notif.title}</h5>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-gray-300 pl-4">{notif.message}</p>

                <div className="pt-2 flex items-center justify-between pl-4 text-[11px]">
                  <span className="text-gray-400 font-medium">Destinatari: {notif.targetType.toUpperCase()}</span>

                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="text-[#D4AF37] hover:text-[#C09F30] font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Segna letta</span>
                      </button>
                    )}
                    {isStaff && (
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                <p>Nessuna notifica presente</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2A2A2E]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1D1D21] hover:bg-[#26262B] text-gray-300 font-semibold rounded-lg text-xs border border-[#2A2A2E]"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
