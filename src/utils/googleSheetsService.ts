import { UserProfile, PlayerPosition, RugbyDepartment, HealthStatus, UserRole } from '../types';
import * as XLSX from 'xlsx';

export interface ParsedSheetData {
  players: UserProfile[];
  staff: UserProfile[];
  sheetTitle: string;
  totalRows: number;
}

export function extractSpreadsheetId(inputUrlOrId: string): string {
  const trimmed = inputUrlOrId.trim();
  // If it's already a pure ID
  if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) {
    return trimmed;
  }
  // Match standard docs.google.com/spreadsheets/d/<ID>
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

// Smart position & department classifier for Rugby
export function detectRugbyRoleAndPosition(
  rawRole: string, 
  rawPosition: string, 
  rawDept?: string
): { 
  role: UserRole; 
  position: PlayerPosition; 
  department: RugbyDepartment;
} {
  const combined = `${rawRole || ''} ${rawPosition || ''} ${rawDept || ''}`.toLowerCase();

  // Check for Staff first
  if (combined.includes('head coach') || combined.includes('allenatore capo') || combined.includes('tecnico capo') || combined.includes('direttore tecnico')) {
    return { role: 'head_coach', position: 'Staff Tecnico', department: 'staff' };
  }
  if (combined.includes('assist') || combined.includes('vice') || combined.includes('skills')) {
    return { role: 'assistant_coach', position: 'Staff Tecnico', department: 'staff' };
  }
  if (combined.includes('prep') || combined.includes('atlet') || combined.includes('s&c') || combined.includes('strength')) {
    return { role: 'athletic_trainer', position: 'Staff Tecnico', department: 'staff' };
  }
  if (combined.includes('fisio') || combined.includes('physio') || combined.includes('mass') || combined.includes('medic') || combined.includes('dottor')) {
    return { role: 'physiotherapist', position: 'Staff Tecnico', department: 'staff' };
  }
  if (combined.includes('admin') || combined.includes('dirigente') || combined.includes('direttore') || combined.includes('manager') || combined.includes('team manager') || combined.includes('staff')) {
    return { role: 'direttore_tecnico', position: 'Staff Tecnico', department: 'staff' };
  }

  // Rugby Players Classification
  if (combined.includes('pilone sin') || combined.includes('prop loose') || combined.includes('(1)') || combined.includes(' 1 ') || combined === '1' || combined.startsWith('pilone 1')) {
    return { role: 'player', position: 'Pilone Sinistro (1)', department: 'avanti' };
  }
  if (combined.includes('tallon') || combined.includes('hooker') || combined.includes('(2)') || combined.includes(' 2 ') || combined === '2') {
    return { role: 'player', position: 'Tallonatrice (2)', department: 'avanti' };
  }
  if (combined.includes('pilone des') || combined.includes('prop tight') || combined.includes('(3)') || combined.includes(' 3 ') || combined === '3' || combined.startsWith('pilone 3')) {
    return { role: 'player', position: 'Pilone Destro (3)', department: 'avanti' };
  }
  if (combined.includes('seconda') || combined.includes('lock') || combined.includes('4') || combined.includes('5')) {
    const is5 = combined.includes('5');
    return { role: 'player', position: is5 ? 'Seconda Linea (5)' : 'Seconda Linea (4)', department: 'avanti' };
  }
  if (combined.includes('flanker') || combined.includes('terza linea fl') || combined.includes('6') || combined.includes('7')) {
    const is7 = combined.includes('7');
    return { role: 'player', position: is7 ? 'Terza Linea Flanker (7)' : 'Terza Linea Flanker (6)', department: 'avanti' };
  }
  if (combined.includes('numero 8') || combined.includes('n.8') || combined.includes('n 8') || combined.includes('no.8') || combined === '8') {
    return { role: 'player', position: 'Numero 8 (8)', department: 'avanti' };
  }
  if (combined.includes('mediana di mischia') || combined.includes('scrum half') || combined.includes('(9)') || combined.includes(' 9 ') || combined === '9') {
    return { role: 'player', position: 'Mediana di Mischia (9)', department: 'trequarti' };
  }
  if (combined.includes('apertura') || combined.includes('fly half') || combined.includes('(10)') || combined.includes(' 10 ') || combined === '10') {
    return { role: 'player', position: 'Mediana d\'Apertura (10)', department: 'trequarti' };
  }
  if (combined.includes('ala sin') || combined.includes('wing left') || combined.includes('(11)') || combined.includes(' 11 ') || combined === '11') {
    return { role: 'player', position: 'Ala Sinistra (11)', department: 'trequarti' };
  }
  if (combined.includes('primo centro') || combined.includes('inside centre') || combined.includes('(12)') || combined.includes(' 12 ') || combined === '12') {
    return { role: 'player', position: 'Primo Centro (12)', department: 'trequarti' };
  }
  if (combined.includes('secondo centro') || combined.includes('outside centre') || combined.includes('(13)') || combined.includes(' 13 ') || combined === '13') {
    return { role: 'player', position: 'Secondo Centro (13)', department: 'trequarti' };
  }
  if (combined.includes('ala des') || combined.includes('wing right') || combined.includes('(14)') || combined.includes(' 14 ') || combined === '14') {
    return { role: 'player', position: 'Ala Destra (14)', department: 'trequarti' };
  }
  if (combined.includes('estremo') || combined.includes('full back') || combined.includes('(15)') || combined.includes(' 15 ') || combined === '15') {
    return { role: 'player', position: 'Estremo (15)', department: 'trequarti' };
  }

  // Generic avanti vs trequarti fallback
  if (combined.includes('avanti') || combined.includes('forwards') || combined.includes('pack')) {
    return { role: 'player', position: 'Pilone Sinistro (1)', department: 'avanti' };
  }
  if (combined.includes('trequarti') || combined.includes('backs')) {
    return { role: 'player', position: 'Primo Centro (12)', department: 'trequarti' };
  }

  // Default player fallback
  return { role: 'player', position: 'Primo Centro (12)', department: 'trequarti' };
}

// Convert table matrix 2D array (from Google Sheets API or CSV) to UserProfile array
export function parseMatrixToRoster(rows: string[][], sheetTitle: string = 'Foglio'): ParsedSheetData {
  if (!rows || rows.length === 0) {
    return { players: [], staff: [], sheetTitle, totalRows: 0 };
  }

  // Clean empty rows
  const cleanRows = rows.filter(r => r && r.some(cell => cell && String(cell).trim().length > 0));
  if (cleanRows.length === 0) {
    return { players: [], staff: [], sheetTitle, totalRows: 0 };
  }

  // Find header row (row that contains terms like "nome", "cognome", "ruolo", "maglia", etc.)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(5, cleanRows.length); i++) {
    const line = cleanRows[i].map(c => String(c).toLowerCase()).join(' ');
    if (line.includes('nome') || line.includes('cognome') || line.includes('atleta') || line.includes('giocatrice') || line.includes('ruolo') || line.includes('player')) {
      headerIndex = i;
      break;
    }
  }

  const headers = cleanRows[headerIndex].map(h => String(h).trim().toLowerCase());
  const dataRows = cleanRows.slice(headerIndex + 1);

  // Column index finders
  const findCol = (keywords: string[]): number => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const nameCol = findCol(['nome', 'atleta', 'nominativo', 'giocatrice', 'cognome e nome', 'name', 'full name']);
  const surnameCol = findCol(['cognome', 'surname', 'last name']);
  const jerseyCol = findCol(['maglia', 'numero', 'n.', 'jersey', 'num', 'n°']);
  const roleCol = findCol(['ruolo', 'mansione', 'role', 'tipo']);
  const posCol = findCol(['posizione', 'specifica', 'position', 'pos']);
  const deptCol = findCol(['reparto', 'sezione', 'department', 'linea']);
  const emailCol = findCol(['email', 'e-mail', 'mail', 'posta']);
  const phoneCol = findCol(['telefono', 'cell', 'cellulare', 'tel', 'phone', 'mobile']);
  const birthCol = findCol(['nascita', 'data nascita', 'nato il', 'birth', 'dob']);
  const medCol = findCol(['medica', 'visita', 'scadenza', 'certificato', 'medical']);
  const statusCol = findCol(['stato', 'salute', 'condizione', 'status', 'idoneita', 'idoneità']);
  const notesCol = findCol(['note', 'commenti', 'osservazioni', 'notes']);

  const players: UserProfile[] = [];
  const staff: UserProfile[] = [];

  dataRows.forEach((row, idx) => {
    // Extract full name
    let fullName = '';
    if (nameCol !== -1 && surnameCol !== -1 && nameCol !== surnameCol) {
      const namePart = row[nameCol]?.trim() || '';
      const surPart = row[surnameCol]?.trim() || '';
      fullName = `${surPart} ${namePart}`.trim() || `${namePart}`.trim();
    } else if (nameCol !== -1) {
      fullName = row[nameCol]?.trim() || '';
    } else {
      // If no explicit header, try the first non-empty cell
      fullName = row.find(c => c && String(c).trim().length > 1)?.trim() || `Utente ${idx + 1}`;
    }

    if (!fullName || fullName.toLowerCase().includes('totale') || fullName.toLowerCase().includes('firma')) {
      return;
    }

    const rawRole = roleCol !== -1 ? row[roleCol]?.trim() || '' : '';
    const rawPos = posCol !== -1 ? row[posCol]?.trim() || '' : '';
    const rawDept = deptCol !== -1 ? row[deptCol]?.trim() || '' : '';

    const { role, position, department } = detectRugbyRoleAndPosition(rawRole, rawPos, rawDept);

    // Jersey number
    let jerseyNumber: number | undefined;
    if (jerseyCol !== -1 && row[jerseyCol]) {
      const parsedNum = parseInt(String(row[jerseyCol]).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 100) {
        jerseyNumber = parsedNum;
      }
    }

    // Email
    let email = '';
    if (emailCol !== -1 && row[emailCol]?.includes('@')) {
      email = row[emailCol].trim().toLowerCase();
    } else {
      const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
      email = `${cleanName}@rugbyteam.it`;
    }

    // Phone
    const phone = phoneCol !== -1 && row[phoneCol] ? String(row[phoneCol]).trim() : undefined;
    
    // Dates
    const birthDate = birthCol !== -1 && row[birthCol] ? String(row[birthCol]).trim() : undefined;
    const medicalExpiry = medCol !== -1 && row[medCol] ? String(row[medCol]).trim() : undefined;
    
    // Status
    let status: HealthStatus = 'fit';
    if (statusCol !== -1 && row[statusCol]) {
      const s = String(row[statusCol]).toLowerCase();
      if (s.includes('infortun') || s.includes('stop') || s.includes('no')) status = 'injured';
      else if (s.includes('diff') || s.includes('rehab') || s.includes('recupero')) status = 'rehab_diff';
      else if (s.includes('riposo') || s.includes('rest')) status = 'rest';
      else if (s.includes('hia') || s.includes('concussion')) status = 'hia_protocol';
    }

    const notes = notesCol !== -1 && row[notesCol] ? String(row[notesCol]).trim() : undefined;

    const userProfile: UserProfile = {
      id: role === 'player' ? `p-sheet-${idx + 1}-${Date.now().toString().slice(-4)}` : `staff-sheet-${idx + 1}`,
      name: fullName,
      email,
      role,
      jerseyNumber: role === 'player' ? jerseyNumber : undefined,
      position,
      department,
      phone,
      birthDate,
      medicalExpiry,
      status,
      notes,
      createdAt: new Date().toISOString()
    };

    if (role === 'player') {
      players.push(userProfile);
    } else {
      staff.push(userProfile);
    }
  });

  return {
    players,
    staff,
    sheetTitle,
    totalRows: dataRows.length
  };
}

// Parse Excel buffer (XLSX, XLS, CSV) directly
export function parseExcelBuffer(buffer: ArrayBuffer | Uint8Array, fallbackTitle: string = 'Foglio Excel'): ParsedSheetData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Nessun foglio trovato nel file Excel.');
  }

  // Find preferred sheet or use first
  let targetSheetName = workbook.SheetNames[0];
  const foundSmart = workbook.SheetNames.find(name => {
    const t = name.toLowerCase();
    return t.includes('rosa') || t.includes('atlet') || t.includes('giocatric') || t.includes('squadra') || t.includes('staff');
  });
  if (foundSmart) {
    targetSheetName = foundSmart;
  }

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    throw new Error(`Foglio "${targetSheetName}" non trovato nel file Excel.`);
  }

  // Convert worksheet to 2D array of string cells
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  const rows: string[][] = rawData.map(r => r.map(c => (c !== null && c !== undefined ? String(c).trim() : '')));

  return parseMatrixToRoster(rows, targetSheetName || fallbackTitle);
}

// Parse user uploaded File object (Excel .xlsx, .xls, .csv, .tsv)
export async function parseExcelFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('Impossibile leggere i dati del file selezionato.');
        }
        const parsed = parseExcelBuffer(buffer, file.name.replace(/\.[^/.]+$/, ''));
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Errore durante la lettura del file dal disco.'));
    reader.readAsArrayBuffer(file);
  });
}

// Fetch spreadsheet data from Google Sheets API v4 using OAuth accessToken
export async function fetchGoogleSheetData(
  spreadsheetId: string, 
  accessToken: string
): Promise<ParsedSheetData> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    throw new Error('ID Foglio Google non valido.');
  }

  // 1. Attempt standard Google Sheets API v4
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`;
  const metaRes = await fetch(metaUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!metaRes.ok) {
    const errData = await metaRes.json().catch(() => ({}));
    const rawErrMsg: string = errData?.error?.message || '';

    // Handle "Office file" (e.g. .xlsx file uploaded to Google Drive)
    if (rawErrMsg.toLowerCase().includes('office file') || rawErrMsg.toLowerCase().includes('not supported for this document')) {
      // Try to download raw file via Google Drive API v3 alt=media
      try {
        const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cleanId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        if (driveRes.ok) {
          const arrayBuffer = await driveRes.arrayBuffer();
          return parseExcelBuffer(arrayBuffer, 'Foglio Excel Drive');
        }
      } catch (driveErr) {
        console.warn('Drive fallback error:', driveErr);
      }

      throw new Error(
        'Il file su Google Drive è memorizzato nel formato Microsoft Excel (.xlsx).\n' +
        '👉 Soluzione 1 (Consigliata): Apri il file su Google Drive, clicca su "File" > "Salva come Fogli Google" e riprova.\n' +
        '👉 Soluzione 2: Trascina o seleziona direttamente il file .xlsx nella scheda "Carica File Excel" qui sotto.'
      );
    }

    if (metaRes.status === 401 || metaRes.status === 403) {
      throw new Error('Permesso non sufficiente o token Google scaduto. Effettua nuovamente l\'accesso con Google.');
    }

    throw new Error(rawErrMsg || `Errore lettura foglio Google (Status: ${metaRes.status})`);
  }

  const metaJson = await metaRes.json();
  const sheets = metaJson.sheets || [];
  if (sheets.length === 0) {
    throw new Error('Nessun foglio trovato nel documento Google Sheet.');
  }

  // Prefer first sheet or sheet with "rosa", "atleti", "squadra", "staff"
  let targetSheet = sheets[0];
  const foundSmartSheet = sheets.find((s: any) => {
    const t = s.properties?.title?.toLowerCase() || '';
    return t.includes('rosa') || t.includes('atlet') || t.includes('giocatric') || t.includes('squadra') || t.includes('staff');
  });
  if (foundSmartSheet) {
    targetSheet = foundSmartSheet;
  }

  const sheetTitle = targetSheet.properties?.title || 'Sheet1';

  // 2. Fetch sheet values
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetTitle)}!A1:Z100?valueRenderOption=FORMATTED_VALUE`;
  const valuesRes = await fetch(valuesUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!valuesRes.ok) {
    const valErr = await valuesRes.json().catch(() => ({}));
    throw new Error(valErr?.error?.message || 'Impossibile leggere le celle dal foglio di calcolo.');
  }

  const valuesJson = await valuesRes.json();
  const rawValues: string[][] = valuesJson.values || [];

  return parseMatrixToRoster(rawValues, sheetTitle);
}
