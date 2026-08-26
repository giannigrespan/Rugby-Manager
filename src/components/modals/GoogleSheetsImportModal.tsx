import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { 
  fetchGoogleSheetData, 
  parseExcelFile,
  parseMatrixToRoster, 
  extractSpreadsheetId, 
  ParsedSheetData 
} from '../../utils/googleSheetsService';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  RefreshCw, 
  Upload, 
  FileUp, 
  ExternalLink,
  Info,
  HelpCircle
} from 'lucide-react';

interface GoogleSheetsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsImportModal: React.FC<GoogleSheetsImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importRosterPlayers } = useData();
  const { googleAccessToken, loginWithGoogle, staffUsers, setStaffList } = useAuth();

  const DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/1mIe4FoRuzUy7NBbQVaIwvdiJH8sOXBQW/edit?gid=617044327#gid=617044327';
  
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOfficeFileError, setIsOfficeFileError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [replaceMode, setReplaceMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview_players' | 'preview_staff' | 'file_upload' | 'manual_paste'>('preview_players');
  const [manualText, setManualText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsOfficeFileError(false);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFetchFromGoogleApi = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsOfficeFileError(false);
    setSuccessMessage(null);

    try {
      let token = googleAccessToken;
      if (!token) {
        // Supabase's Google sign-in redirects the whole page to Google and
        // back, so no token is available synchronously here. The redirect
        // starts immediately; when the user lands back on this page after
        // authorizing, the token will already be cached and this button can
        // be clicked again to actually fetch the sheet.
        await loginWithGoogle();
        setErrorMessage('Verrai reindirizzato per accedere con Google. Al tuo ritorno, clicca di nuovo su "Carica da Google Sheets".');
        return;
      }

      const parsed = await fetchGoogleSheetData(sheetUrl, token);
      if (parsed.players.length === 0 && parsed.staff.length === 0) {
        throw new Error('Nessun dato valido trovato nel foglio. Verifica che le colonne contengano i nomi degli atleti o dello staff.');
      }

      setParsedData(parsed);
      setActiveTab(parsed.players.length > 0 ? 'preview_players' : 'preview_staff');
    } catch (err: any) {
      console.error('Google Sheets import error:', err);
      const msg = err.message || '';
      if (msg.includes('Office file') || msg.includes('Microsoft Excel') || msg.includes('not supported for this document')) {
        setIsOfficeFileError(true);
      }
      setErrorMessage(msg || 'Impossibile caricare i dati da Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsOfficeFileError(false);
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.players.length === 0 && parsed.staff.length === 0) {
        throw new Error('Nessuna riga valida riconosciuta nel file caricato. Verifica le colonne.');
      }
      setParsedData(parsed);
      setActiveTab(parsed.players.length > 0 ? 'preview_players' : 'preview_staff');
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante la lettura del file Excel/CSV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleParseManualText = () => {
    if (!manualText.trim()) return;
    setErrorMessage(null);
    setIsOfficeFileError(false);

    try {
      // Split lines and detect comma, semicolon or tab delimiter
      const lines = manualText.trim().split(/\r?\n/);
      const rows = lines.map(line => {
        if (line.includes('\t')) return line.split('\t');
        if (line.includes(';')) return line.split(';');
        return line.split(',');
      });

      const parsed = parseMatrixToRoster(rows, 'Dati Incollati');
      if (parsed.players.length === 0 && parsed.staff.length === 0) {
        throw new Error('Nessuna riga valida riconosciuta. Incolla una tabella con intestazioni (es. Nome, Cognome, Ruolo, Maglia, Email).');
      }

      setParsedData(parsed);
      setActiveTab(parsed.players.length > 0 ? 'preview_players' : 'preview_staff');
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore nel parsing del testo.');
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Import Players
      if (parsedData.players.length > 0) {
        await importRosterPlayers(parsedData.players, replaceMode);
      }

      // 2. Import Staff
      if (parsedData.staff.length > 0) {
        let updatedStaff: UserProfile[] = [];
        if (replaceMode) {
          updatedStaff = parsedData.staff;
        } else {
          const staffMap = new Map<string, UserProfile>(staffUsers.map(s => [s.email.toLowerCase(), s]));
          parsedData.staff.forEach(s => staffMap.set(s.email.toLowerCase(), s));
          updatedStaff = Array.from(staffMap.values());
        }
        setStaffList(updatedStaff);
      }

      setSuccessMessage(`Importazione completata! ${parsedData.players.length} atlete e ${parsedData.staff.length} membri staff salvati nel database cloud.`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante il salvataggio dei dati nel database.');
    } finally {
      setIsLoading(false);
    }
  };

  const spreadsheetId = extractSpreadsheetId(sheetUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#2A2A2E] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#E0E0E1]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2E] bg-[#17171A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#E0E0E1] font-serif">
                  Importa Rosa & Staff da Fogli Google / Excel
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                  Google Workspace & XLSX
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Sincronizzazione da URL Google Sheets, upload diretto file Excel (.xlsx) o copia-incolla tabella
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#26262B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner with Office File Action Guide */}
          {errorMessage && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="whitespace-pre-line">{errorMessage}</div>
                  
                  {isOfficeFileError && (
                    <div className="mt-3 p-3 bg-[#17171A] border border-amber-500/40 rounded-lg text-amber-200 text-xs space-y-2">
                      <div className="font-bold flex items-center gap-2 text-amber-300">
                        <HelpCircle className="w-4 h-4" />
                        <span>Come risolvere in 1 passaggio:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-gray-300 text-[11px]">
                        <li>
                          <strong className="text-white">Opzione A (Istantanea):</strong> Clicca sulla scheda <button type="button" onClick={() => setActiveTab('file_upload')} className="text-[#D4AF37] underline font-bold">Carica File Excel (.xlsx)</button> qui sotto e seleziona il tuo file salvato sul computer.
                        </li>
                        <li>
                          <strong className="text-white">Opzione B (Google Drive):</strong> Apri il file su <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">Google Drive</a>, clicca nel menu in alto su <code className="bg-black/50 px-1 py-0.5 rounded text-white">File &gt; Salva come Fogli Google</code> e riprova con l'URL generato.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Google Sheets Connection Box */}
          <div className="p-4 bg-[#17171A] border border-[#2A2A2E] rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>URL del Foglio Google Sheets</span>
              </label>

              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  <span>Apri su Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-3 py-2.5 bg-[#121214] border border-[#2A2A2E] rounded-lg text-xs text-[#E0E0E1] focus:outline-none focus:border-emerald-500 font-mono"
              />

              <button
                onClick={handleFetchFromGoogleApi}
                disabled={isLoading || !sheetUrl.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Caricamento...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Carica da Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Preview vs File Upload vs Manual Paste) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2A2E] pb-2">
            <button
              onClick={() => setActiveTab('preview_players')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'preview_players' 
                  ? 'bg-[#D4AF37] text-black' 
                  : 'text-gray-400 hover:text-white bg-[#17171A]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Atlete Identificate ({parsedData?.players.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('preview_staff')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'preview_staff' 
                  ? 'bg-[#D4AF37] text-black' 
                  : 'text-gray-400 hover:text-white bg-[#17171A]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Staff Tecnico ({parsedData?.staff.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('file_upload')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'file_upload' 
                  ? 'bg-[#2A2A2E] text-white border border-[#D4AF37]/50' 
                  : 'text-gray-400 hover:text-white bg-[#17171A]'
              }`}
            >
              <FileUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Carica File Excel (.xlsx / .csv)</span>
            </button>

            <button
              onClick={() => setActiveTab('manual_paste')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'manual_paste' 
                  ? 'bg-[#2A2A2E] text-white' 
                  : 'text-gray-400 hover:text-white bg-[#17171A]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Incolla Testo Copiato</span>
            </button>
          </div>

          {/* Tab: Direct File Upload */}
          {activeTab === 'file_upload' && (
            <div className="space-y-4 bg-[#17171A] p-5 border border-[#2A2A2E] rounded-xl">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv,.tsv"
                className="hidden"
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                    : 'border-[#2A2A2E] hover:border-emerald-500/60 hover:bg-[#1C1C20]'
                }`}
              >
                <FileUp className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-white mb-1">
                  Trascina qui il tuo file Excel (.xlsx, .xls) o CSV
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  oppure clicca per selezionarlo dal tuo computer
                </p>
                <span className="inline-block px-3 py-1 bg-[#26262B] text-gray-300 text-[11px] font-mono rounded-md">
                  Supporta .xlsx, .xls, .csv di Microsoft Excel e Google Drive
                </span>
              </div>
            </div>
          )}

          {/* Preview Content: Players */}
          {activeTab === 'preview_players' && (
            <div className="space-y-3">
              {parsedData && parsedData.players.length > 0 ? (
                <div className="border border-[#2A2A2E] rounded-xl overflow-hidden bg-[#17171A]">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#121214] text-gray-400 border-b border-[#2A2A2E] sticky top-0">
                        <tr>
                          <th className="p-2.5 font-bold">N°</th>
                          <th className="p-2.5 font-bold">Atleta</th>
                          <th className="p-2.5 font-bold">Ruolo Rugby</th>
                          <th className="p-2.5 font-bold">Reparto</th>
                          <th className="p-2.5 font-bold">Email</th>
                          <th className="p-2.5 font-bold">Telefono</th>
                          <th className="p-2.5 font-bold">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2E]">
                        {parsedData.players.map((p, idx) => (
                          <tr key={idx} className="hover:bg-[#1D1D21] transition-colors">
                            <td className="p-2.5 font-mono text-[#D4AF37] font-bold">
                              {p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}
                            </td>
                            <td className="p-2.5 font-semibold text-white">
                              {p.name}
                            </td>
                            <td className="p-2.5 text-gray-300">
                              {p.position}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.department === 'avanti' 
                                  ? 'bg-amber-500/20 text-amber-300' 
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}>
                                {p.department}
                              </span>
                            </td>
                            <td className="p-2.5 text-gray-400 font-mono text-[11px]">
                              {p.email}
                            </td>
                            <td className="p-2.5 text-gray-400 text-[11px]">
                              {p.phone || '-'}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#17171A] border border-[#2A2A2E] rounded-xl text-gray-400 text-xs">
                  <FileSpreadsheet className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-60" />
                  <p>Nessun dato atleta caricato al momento.</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Carica il file Excel o incolla i dati copiati dal foglio.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview Content: Staff */}
          {activeTab === 'preview_staff' && (
            <div className="space-y-3">
              {parsedData && parsedData.staff.length > 0 ? (
                <div className="border border-[#2A2A2E] rounded-xl overflow-hidden bg-[#17171A]">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#121214] text-gray-400 border-b border-[#2A2A2E] sticky top-0">
                        <tr>
                          <th className="p-2.5 font-bold">Membro Staff</th>
                          <th className="p-2.5 font-bold">Ruolo / Funzione</th>
                          <th className="p-2.5 font-bold">Email</th>
                          <th className="p-2.5 font-bold">Telefono</th>
                          <th className="p-2.5 font-bold">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2E]">
                        {parsedData.staff.map((s, idx) => (
                          <tr key={idx} className="hover:bg-[#1D1D21] transition-colors">
                            <td className="p-2.5 font-semibold text-white">
                              {s.name}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold rounded">
                                {s.role.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2.5 text-gray-400 font-mono text-[11px]">
                              {s.email}
                            </td>
                            <td className="p-2.5 text-gray-400 text-[11px]">
                              {s.phone || '-'}
                            </td>
                            <td className="p-2.5 text-gray-400 text-[11px]">
                              {s.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#17171A] border border-[#2A2A2E] rounded-xl text-gray-400 text-xs">
                  <ShieldCheck className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-60" />
                  <p>Nessun membro staff identificato nel file (o già incluso nella rosa atleti).</p>
                </div>
              )}
            </div>
          )}

          {/* Manual CSV Tab */}
          {activeTab === 'manual_paste' && (
            <div className="space-y-3 bg-[#17171A] p-4 border border-[#2A2A2E] rounded-xl">
              <label className="text-xs font-bold text-gray-300 block">
                Incolla righe da Google Sheets o file CSV (con intestazioni: Nome, Cognome, Ruolo, Maglia, Email):
              </label>
              <textarea
                rows={5}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Cognome, Nome, Ruolo, Maglia, Email&#10;Turani, Sara, Pilone Sinistro, 1, sara.turani@rugby.it&#10;Valenti, Marco, Head Coach, , coach@rugby.it"
                className="w-full p-3 bg-[#121214] border border-[#2A2A2E] rounded-lg text-xs font-mono text-[#E0E0E1] focus:outline-none focus:border-[#D4AF37]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseManualText}
                  disabled={!manualText.trim()}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C09F30] disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-all"
                >
                  Analizza Testo Incollato
                </button>
              </div>
            </div>
          )}

          {/* Import Settings & Strategy */}
          <div className="p-4 bg-[#17171A] border border-[#2A2A2E] rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#E0E0E1]">Strategia di Importazione</span>
              <p className="text-[11px] text-gray-400">
                Scegli se sostituire interamente la rosa attuale o unire i nuovi dati con quelli esistenti
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="import_mode"
                  checked={!replaceMode}
                  onChange={() => setReplaceMode(false)}
                  className="accent-[#D4AF37]"
                />
                <span className={!replaceMode ? 'text-[#D4AF37] font-bold' : 'text-gray-400'}>
                  Unisci / Aggiorna (Merge)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="import_mode"
                  checked={replaceMode}
                  onChange={() => setReplaceMode(true)}
                  className="accent-[#D4AF37]"
                />
                <span className={replaceMode ? 'text-red-400 font-bold' : 'text-gray-400'}>
                  Sostituisci Rosa Esistente
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2A2A2E] bg-[#17171A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>
              {parsedData 
                ? `${parsedData.players.length} Atlete e ${parsedData.staff.length} Staff pronti per il salvataggio`
                : 'In attesa di caricamento dati'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2A2A2E] hover:bg-[#35353B] text-gray-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isLoading || !parsedData || (parsedData.players.length === 0 && parsedData.staff.length === 0)}
              className="px-5 py-2 bg-[#D4AF37] hover:bg-[#C09F30] disabled:opacity-50 text-black text-xs font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvataggio Cloud...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Conferma e Salva nel Database</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
