import { UserProfile, TrainingSession, AttendanceRecord, RpeFeedback, InjuryReport, PhysioNote, IndividualTask, KickingSession, IndividualTrainingLog } from '../types';

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'staff-gianni-grespan',
    email: 'gianni.grespan@gmail.com',
    name: 'Gianni Grespan (Admin & Sviluppatore)',
    role: 'sviluppatore',
    isAdmin: true,
    position: 'Staff Tecnico',
    department: 'staff',
    phone: '+39 340 0000000',
    status: 'fit',
    createdAt: '2026-01-01T08:00:00Z',
    notes: 'Responsabile e Amministratore Rugby Villorba'
  }
];

// Full 44 Players Roster matching the requested "(44)" badge
export const INITIAL_PLAYERS: UserProfile[] = [
  // AVANTI - Prime Linee (Piloni & Tallonatrici)
  { id: 'p-01', email: 'sara.turani@rugbyteam.it', name: 'Sara Turani', role: 'player', jerseyNumber: 1, position: 'Pilone Sinistro (1)', department: 'avanti', phone: '+39 348 101001', birthDate: '1997-04-12', medicalExpiry: '2027-02-15', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-02', email: 'vittoria.vecchini@rugbyteam.it', name: 'Vittoria Vecchini', role: 'player', jerseyNumber: 2, position: 'Tallonatrice (2)', department: 'avanti', phone: '+39 348 101002', birthDate: '2000-01-13', medicalExpiry: '2026-11-20', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-03', email: 'lucia.gai@rugbyteam.it', name: 'Lucia Gai', role: 'player', jerseyNumber: 3, position: 'Pilone Destro (3)', department: 'avanti', phone: '+39 348 101003', birthDate: '1991-05-03', medicalExpiry: '2026-10-12', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-04', email: 'silvia.turani@rugbyteam.it', name: 'Silvia Turani', role: 'player', jerseyNumber: 16, position: 'Pilone Sinistro (1)', department: 'avanti', phone: '+39 348 101004', birthDate: '1995-07-27', medicalExpiry: '2027-01-10', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-05', email: 'laura.gurioli@rugbyteam.it', name: 'Laura Gurioli', role: 'player', jerseyNumber: 17, position: 'Tallonatrice (2)', department: 'avanti', phone: '+39 348 101005', birthDate: '1998-02-02', medicalExpiry: '2026-09-30', status: 'rehab_diff', createdAt: '2026-01-15' },
  { id: 'p-06', email: 'alessia.maris@rugbyteam.it', name: 'Alessia Maris', role: 'player', jerseyNumber: 18, position: 'Pilone Destro (3)', department: 'avanti', phone: '+39 348 101006', birthDate: '2001-09-14', medicalExpiry: '2027-03-01', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-07', email: 'chiara.stefanin@rugbyteam.it', name: 'Chiara Stefanin', role: 'player', jerseyNumber: 26, position: 'Pilone Sinistro (1)', department: 'avanti', phone: '+39 348 101007', birthDate: '2002-11-05', medicalExpiry: '2026-12-05', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-08', email: 'giulia.barbini@rugbyteam.it', name: 'Giulia Barbini', role: 'player', jerseyNumber: 27, position: 'Tallonatrice (2)', department: 'avanti', phone: '+39 348 101008', birthDate: '2003-03-18', medicalExpiry: '2027-04-10', status: 'fit', createdAt: '2026-01-15' },

  // AVANTI - Seconde Linee
  { id: 'p-09', email: 'valeria.fedrighi@rugbyteam.it', name: 'Valeria Fedrighi', role: 'player', jerseyNumber: 4, position: 'Seconda Linea (4)', department: 'avanti', phone: '+39 348 101009', birthDate: '1992-09-05', medicalExpiry: '2026-11-15', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-10', email: 'giordana.duca@rugbyteam.it', name: 'Giordana Duca', role: 'player', jerseyNumber: 5, position: 'Seconda Linea (5)', department: 'avanti', phone: '+39 348 101010', birthDate: '1992-09-28', medicalExpiry: '2026-10-25', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-11', email: 'sara.sevegnani@rugbyteam.it', name: 'Sara Seye', role: 'player', jerseyNumber: 19, position: 'Seconda Linea (4)', department: 'avanti', phone: '+39 348 101011', birthDate: '2000-08-26', medicalExpiry: '2027-01-18', status: 'injured', createdAt: '2026-01-15' },
  { id: 'p-12', email: 'margaux.cassaghi@rugbyteam.it', name: 'Margaux Cassaghi', role: 'player', jerseyNumber: 20, position: 'Seconda Linea (5)', department: 'avanti', phone: '+39 348 101012', birthDate: '2001-04-19', medicalExpiry: '2027-02-28', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-13', email: 'alice.frangipani@rugbyteam.it', name: 'Alice Frangipani', role: 'player', jerseyNumber: 28, position: 'Seconda Linea (4)', department: 'avanti', phone: '+39 348 101013', birthDate: '2003-07-14', medicalExpiry: '2026-08-30', status: 'fit', createdAt: '2026-01-15' },

  // AVANTI - Terze Linee (Flankers & N.8)
  { id: 'p-14', email: 'beatrice.veronese@rugbyteam.it', name: 'Beatrice Veronese', role: 'player', jerseyNumber: 6, position: 'Terza Linea Flanker (6)', department: 'avanti', phone: '+39 348 101014', birthDate: '1996-03-11', medicalExpiry: '2026-12-14', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-15', email: 'francesca.sgorbini@rugbyteam.it', name: 'Francesca Sgorbini', role: 'player', jerseyNumber: 7, position: 'Terza Linea Flanker (7)', department: 'avanti', phone: '+39 348 101015', birthDate: '2001-01-07', medicalExpiry: '2027-01-20', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-16', email: 'elisa.giordano@rugbyteam.it', name: 'Elisa Giordano (Capitano)', role: 'player', jerseyNumber: 8, position: 'Numero 8 (8)', department: 'avanti', phone: '+39 348 101016', birthDate: '1990-11-01', medicalExpiry: '2026-11-01', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-17', email: 'isabella.locatelli@rugbyteam.it', name: 'Isabella Locatelli', role: 'player', jerseyNumber: 21, position: 'Terza Linea Flanker (6)', department: 'avanti', phone: '+39 348 101017', birthDate: '1994-10-23', medicalExpiry: '2026-10-10', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-18', email: 'alessandra.frison@rugbyteam.it', name: 'Alessandra Frison', role: 'player', jerseyNumber: 22, position: 'Numero 8 (8)', department: 'avanti', phone: '+39 348 101018', birthDate: '1999-06-15', medicalExpiry: '2027-05-15', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-19', email: 'elena.ervini@rugbyteam.it', name: 'Elena Ervini', role: 'player', jerseyNumber: 29, position: 'Terza Linea Flanker (7)', department: 'avanti', phone: '+39 348 101019', birthDate: '2002-12-08', medicalExpiry: '2027-02-10', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-20', email: 'gemma.tonellotto@rugbyteam.it', name: 'Gemma Tonellotto', role: 'player', jerseyNumber: 30, position: 'Terza Linea Flanker (6)', department: 'avanti', phone: '+39 348 101020', birthDate: '2003-05-22', medicalExpiry: '2026-09-12', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-21', email: 'martina.farina@rugbyteam.it', name: 'Martina Farina', role: 'player', jerseyNumber: 31, position: 'Numero 8 (8)', department: 'avanti', phone: '+39 348 101021', birthDate: '2001-08-30', medicalExpiry: '2027-03-22', status: 'rehab_diff', createdAt: '2026-01-15' },

  // TREQUARTI - Mediane di Mischia (9)
  { id: 'p-22', email: 'sofia.stefan@rugbyteam.it', name: 'Sofia Stefan', role: 'player', jerseyNumber: 9, position: 'Mediana di Mischia (9)', department: 'trequarti', phone: '+39 348 101022', birthDate: '1992-05-12', medicalExpiry: '2026-11-30', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-23', email: 'sara.barattin@rugbyteam.it', name: 'Sara Barattin', role: 'player', jerseyNumber: 23, position: 'Mediana di Mischia (9)', department: 'trequarti', phone: '+39 348 101023', birthDate: '1986-09-11', medicalExpiry: '2026-10-18', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-24', email: 'nicole.mastrangelo@rugbyteam.it', name: 'Nicole Mastrangelo', role: 'player', jerseyNumber: 32, position: 'Mediana di Mischia (9)', department: 'trequarti', phone: '+39 348 101024', birthDate: '2003-02-14', medicalExpiry: '2027-01-15', status: 'fit', createdAt: '2026-01-15' },

  // TREQUARTI - Mediane d'Apertura (10) - Kicking Specialists
  { id: 'p-25', email: 'veronica.madia@rugbyteam.it', name: 'Veronica Madia', role: 'player', jerseyNumber: 10, position: 'Mediana d\'Apertura (10)', department: 'trequarti', phone: '+39 348 101025', birthDate: '1995-01-16', medicalExpiry: '2026-12-01', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-26', email: 'michela.sillari@rugbyteam.it', name: 'Michela Sillari', role: 'player', jerseyNumber: 24, position: 'Mediana d\'Apertura (10)', department: 'trequarti', phone: '+39 348 101026', birthDate: '1993-02-23', medicalExpiry: '2026-10-05', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-27', email: 'emma.stecca@rugbyteam.it', name: 'Emma Stecca', role: 'player', jerseyNumber: 33, position: 'Mediana d\'Apertura (10)', department: 'trequarti', phone: '+39 348 101027', birthDate: '2002-09-10', medicalExpiry: '2027-04-18', status: 'fit', createdAt: '2026-01-15' },

  // TREQUARTI - Centri (12 & 13)
  { id: 'p-28', email: 'beatrice.rigoni@rugbyteam.it', name: 'Beatrice Rigoni', role: 'player', jerseyNumber: 12, position: 'Primo Centro (12)', department: 'trequarti', phone: '+39 348 101028', birthDate: '1995-08-01', medicalExpiry: '2026-11-12', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-29', email: 'alyssa.dinca@rugbyteam.it', name: 'Alyssa D\'Incà', role: 'player', jerseyNumber: 13, position: 'Secondo Centro (13)', department: 'trequarti', phone: '+39 348 101029', birthDate: '2002-03-23', medicalExpiry: '2027-03-14', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-30', email: 'sara.mannini@rugbyteam.it', name: 'Sara Mannini', role: 'player', jerseyNumber: 34, position: 'Primo Centro (12)', department: 'trequarti', phone: '+39 348 101030', birthDate: '2005-08-28', medicalExpiry: '2027-02-20', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-31', email: 'natascia.agostinelli@rugbyteam.it', name: 'Natascia Agostinelli', role: 'player', jerseyNumber: 35, position: 'Secondo Centro (13)', department: 'trequarti', phone: '+39 348 101031', birthDate: '2000-04-17', medicalExpiry: '2026-09-18', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-32', email: 'gaia.buso@rugbyteam.it', name: 'Gaia Buso', role: 'player', jerseyNumber: 36, position: 'Primo Centro (12)', department: 'trequarti', phone: '+39 348 101032', birthDate: '2004-10-12', medicalExpiry: '2026-12-22', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-33', email: 'clara.moro@rugbyteam.it', name: 'Clara Moro', role: 'player', jerseyNumber: 37, position: 'Secondo Centro (13)', department: 'trequarti', phone: '+39 348 101033', birthDate: '2003-06-30', medicalExpiry: '2027-01-05', status: 'fit', createdAt: '2026-01-15' },

  // TREQUARTI - Ali (11 & 14)
  { id: 'p-34', email: 'aura.muzzo@rugbyteam.it', name: 'Aura Muzzo', role: 'player', jerseyNumber: 11, position: 'Ala Sinistra (11)', department: 'trequarti', phone: '+39 348 101034', birthDate: '1997-04-12', medicalExpiry: '2026-10-15', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-35', email: 'sofia.roolfi@rugbyteam.it', name: 'Sofia Rolfi', role: 'player', jerseyNumber: 14, position: 'Ala Destra (14)', department: 'trequarti', phone: '+39 348 101035', birthDate: '2001-09-24', medicalExpiry: '2027-02-12', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-36', email: 'maria.magatti@rugbyteam.it', name: 'Maria Magatti', role: 'player', jerseyNumber: 25, position: 'Ala Sinistra (11)', department: 'trequarti', phone: '+39 348 101036', birthDate: '1992-08-21', medicalExpiry: '2026-11-25', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-37', email: 'chiara.capomaggi@rugbyteam.it', name: 'Chiara Capomaggi', role: 'player', jerseyNumber: 38, position: 'Ala Destra (14)', department: 'trequarti', phone: '+39 348 101037', birthDate: '1997-04-29', medicalExpiry: '2026-08-20', status: 'injured', createdAt: '2026-01-15' },
  { id: 'p-38', email: 'francesca.granzotto@rugbyteam.it', name: 'Francesca Granzotto', role: 'player', jerseyNumber: 39, position: 'Ala Sinistra (11)', department: 'trequarti', phone: '+39 348 101038', birthDate: '2002-03-22', medicalExpiry: '2027-04-05', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-39', email: 'eleonora.capello@rugbyteam.it', name: 'Eleonora Capello', role: 'player', jerseyNumber: 40, position: 'Ala Destra (14)', department: 'trequarti', phone: '+39 348 101039', birthDate: '2003-12-19', medicalExpiry: '2027-03-30', status: 'fit', createdAt: '2026-01-15' },

  // TREQUARTI - Estremi (15)
  { id: 'p-40', email: 'vittoria.ostuni@rugbyteam.it', name: 'Vittoria Ostuni Minuzzi', role: 'player', jerseyNumber: 15, position: 'Estremo (15)', department: 'trequarti', phone: '+39 348 101040', birthDate: '2001-12-06', medicalExpiry: '2026-12-10', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-41', email: 'manuela.furlan@rugbyteam.it', name: 'Manuela Furlan', role: 'player', jerseyNumber: 41, position: 'Estremo (15)', department: 'trequarti', phone: '+39 348 101041', birthDate: '1988-06-30', medicalExpiry: '2026-09-15', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-42', email: 'camilla.sarasso@rugbyteam.it', name: 'Camilla Sarasso', role: 'player', jerseyNumber: 42, position: 'Estremo (15)', department: 'trequarti', phone: '+39 348 101042', birthDate: '2002-05-18', medicalExpiry: '2027-01-25', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-43', email: 'greta.copat@rugbyteam.it', name: 'Greta Copat', role: 'player', jerseyNumber: 43, position: 'Ala Sinistra (11)', department: 'trequarti', phone: '+39 348 101043', birthDate: '2004-01-14', medicalExpiry: '2027-05-01', status: 'fit', createdAt: '2026-01-15' },
  { id: 'p-44', email: 'matilde.romano@rugbyteam.it', name: 'Matilde Romano', role: 'player', jerseyNumber: 44, position: 'Tallonatrice (2)', department: 'avanti', phone: '+39 348 101044', birthDate: '2005-02-10', medicalExpiry: '2027-02-14', status: 'fit', createdAt: '2026-01-15' }
];

export const INITIAL_SESSIONS: TrainingSession[] = [
  {
    id: 's-01',
    title: 'Martedì: Fisico & Set Pieces (Mischia/Touche)',
    date: '2026-08-18',
    time: '19:00',
    endTime: '20:45',
    location: 'Campo Principale 1 & Palestra',
    type: 'scrum_lineout',
    departmentTarget: 'all',
    primaryFocus: 'Stabilità ingaggio in mischia e tempi di salto in touche',
    secondaryFocus: 'Forza massimale squat & trazioni + Mobilità spalla',
    plannedDurationMin: 105,
    plannedRpe: 8,
    intensity: 'high',
    coachNotes: 'Separazione Avanti (ingaggi + blocchi touche) e Trequarti (linee di corsa con Veronica Madia)',
    status: 'completed',
    createdAt: '2026-08-10'
  },
  {
    id: 's-02',
    title: 'Giovedì: Tecnico-Tattico & Difesa di Salita',
    date: '2026-08-20',
    time: '19:30',
    endTime: '21:00',
    location: 'Campo Principale 1',
    type: 'technical_tactical',
    departmentTarget: 'all',
    primaryFocus: 'Connessione linea difensiva su prima fase e riposizionamento rapido',
    secondaryFocus: 'Velocità di uscita del pallone da ruck < 2.5 secondi',
    plannedDurationMin: 90,
    plannedRpe: 7,
    intensity: 'high',
    coachNotes: 'Focus su placcaggio basso e contesa ruck legale senza falli',
    status: 'completed',
    createdAt: '2026-08-10'
  },
  {
    id: 's-03',
    title: 'Venerdì: Calci Trequarti & Captain\'s Run',
    date: '2026-08-21',
    time: '18:30',
    endTime: '19:45',
    location: 'Campo 2 & Area Pali',
    type: 'kicking_specialists',
    departmentTarget: 'trequarti',
    primaryFocus: 'Routine calci di piazzato da varie posizioni & box kick del 9',
    secondaryFocus: 'Ripasso chiamate tattiche e lanci di gioco',
    plannedDurationMin: 75,
    plannedRpe: 5,
    intensity: 'moderate',
    coachNotes: 'Sessione di rifinitura e precisione balistica per Sillari, Madia e Stefan',
    status: 'completed',
    createdAt: '2026-08-10'
  },
  {
    id: 's-04',
    title: 'Martedì: Attacco Strutturato & Transizioni',
    date: '2026-08-25',
    time: '19:00',
    endTime: '20:30',
    location: 'Campo Principale 1',
    type: 'technical_tactical',
    departmentTarget: 'all',
    primaryFocus: 'Gestione corridoio 15m e attacco 1-3-3-1',
    secondaryFocus: 'Duelli 1v1 ed offload prima del contatto',
    plannedDurationMin: 90,
    plannedRpe: 8,
    intensity: 'high',
    coachNotes: 'Test del nuovo pattern offensivo con cambio d\'angolo dei centri',
    status: 'in_progress',
    createdAt: '2026-08-20'
  },
  {
    id: 's-05',
    title: 'Giovedì: Speed, Agility & Breakdown War',
    date: '2026-08-27',
    time: '19:30',
    endTime: '21:00',
    location: 'Campo Principale 1',
    type: 'physical_strength',
    departmentTarget: 'all',
    primaryFocus: 'Efficacia nel jackal e pulizia aggressiva del breakdown',
    secondaryFocus: 'Sprint ripetuti 20m con cambi di direzione',
    plannedDurationMin: 90,
    plannedRpe: 9,
    intensity: 'match_intensity',
    coachNotes: 'Ultima seduta ad alta intensità prima del test match domenicale',
    status: 'scheduled',
    createdAt: '2026-08-20'
  },
  {
    id: 's-06',
    title: 'Sabato: Team Walk-Through & Rifinitura',
    date: '2026-08-29',
    time: '10:30',
    endTime: '11:45',
    location: 'Stadio Comunale Rugby',
    type: 'match_captain_run',
    departmentTarget: 'all',
    primaryFocus: 'Chiarezza mentale sui dettagli e timing delle rimesse laterali',
    secondaryFocus: 'Attivazione neuromuscolare leggera & stretching dinamico',
    plannedDurationMin: 75,
    plannedRpe: 4,
    intensity: 'low',
    coachNotes: 'Captain\'s run guidato da Elisa Giordano e staff',
    status: 'scheduled',
    createdAt: '2026-08-20'
  }
];

export const INITIAL_INJURIES: InjuryReport[] = [
  {
    id: 'inj-01',
    playerId: 'p-11',
    playerName: 'Sara Seye',
    injuryDate: '2026-08-12',
    bodyPart: 'Caviglia',
    injuryType: 'Distorsione tibio-tarsica II grado con edema',
    severity: 'moderate',
    rtpExpectedDate: '2026-09-08',
    status: 'in_rehab',
    physioNotes: 'Buon recupero articolare, iniziata propriocezione su tavoletta Freeman. Niente corsa impattante.',
    treatmentPlan: 'Laserterapia + rinforzo peronei + lavoro cardio in piscina/bike',
    hiaConcussionProtocol: false,
    updatedAt: '2026-08-22'
  },
  {
    id: 'inj-02',
    playerId: 'p-37',
    playerName: 'Chiara Capomaggi',
    injuryDate: '2026-08-16',
    bodyPart: 'Spalla',
    injuryType: 'Sindrome da impingement spalla destra post-placcaggio',
    severity: 'moderate',
    rtpExpectedDate: '2026-09-02',
    status: 'in_rehab',
    physioNotes: 'Dolore in abduzione oltre 90°. Stop ai contatti e placcaggi, ok corsa e skills con palla leggera.',
    treatmentPlan: 'Tecarterapia, rinforzo cuffia dei rotatori e deltoide posteriore',
    hiaConcussionProtocol: false,
    updatedAt: '2026-08-24'
  },
  {
    id: 'inj-03',
    playerId: 'p-05',
    playerName: 'Laura Gurioli',
    injuryDate: '2026-08-20',
    bodyPart: 'Coscia / Ischiocrurali',
    injuryType: 'Elongazione bicipite femorale sinistro',
    severity: 'mild',
    rtpExpectedDate: '2026-08-30',
    status: 'in_rehab',
    physioNotes: 'Sensazione di tiramento durante sprint. Ecografia negativa per lesioni strutturali.',
    treatmentPlan: 'Massoterapia decontratturante, stretching eccentrico leggero (Nordic hamstring progressivo)',
    hiaConcussionProtocol: false,
    updatedAt: '2026-08-23'
  }
];

export const INITIAL_PHYSIO_NOTES: PhysioNote[] = [
  {
    id: 'physio-01',
    playerId: 'p-11',
    playerName: 'Sara Seye',
    date: '2026-08-24',
    physioName: 'Dr. Roberto Ferri',
    healthStatus: 'recupero_fisioterapia',
    sessionType: 'Trattamento Manuale',
    diagnosis: 'Distorsione caviglia dx (fase sub-acuta)',
    treatment: 'Drenaggio linfatico, mobilizzazione passiva dell\'articolazione sotto-astragalica, bendaggio funzionale.',
    exercisePlan: 'Esercizi isometrici con elastico, calf raise bilaterale, 25min cyclette a 80rpm.',
    rtpStatus: 'Fase 2 di 5: Lavoro differenziato in palestra',
    isConfidential: false
  },
  {
    id: 'physio-02',
    playerId: 'p-28',
    playerName: 'Beatrice Rigoni',
    date: '2026-08-23',
    physioName: 'Dr. Roberto Ferri',
    healthStatus: 'idoneo_limitazioni',
    sessionType: 'Controllo Pre-Gara',
    diagnosis: 'Lieve contrattura trapezio superiore dx',
    treatment: 'Trigger point release, applicazione kinesiotaping decompressivo.',
    exercisePlan: 'Mobilità rachide cervicale prima dell\'attivazione.',
    rtpStatus: 'Idonea al 100% per allenamento e gara',
    isConfidential: false
  }
];

export const INITIAL_TASKS: IndividualTask[] = [
  {
    id: 't-01',
    title: 'Analisi Video: Schemi Touche e Difesa Drive Avversario',
    description: 'Visionare i 4 clip caricati nella cartella video su Hudl. Rispondere alle domande sulle chiamate di lettura a zona.',
    category: 'video_analysis',
    assignedToType: 'avanti',
    assignedPlayerIds: INITIAL_PLAYERS.filter(p => p.department === 'avanti').map(p => p.id),
    dueDate: '2026-08-28',
    frequency: 'weekly',
    priority: 'high',
    createdBy: 'Marco Valenti (Head Coach)',
    createdAt: '2026-08-22',
    completions: {
      'p-01': { completed: true, completedAt: '2026-08-23T14:30:00Z', note: 'Visti i clip, chiaro il movimento sul primo blocco' },
      'p-02': { completed: true, completedAt: '2026-08-24T10:15:00Z', note: 'Analizzato il timing del lancio sul secondo saltatore' },
      'p-09': { completed: true, completedAt: '2026-08-23T19:00:00Z' },
      'p-16': { completed: true, completedAt: '2026-08-24T18:45:00Z', note: 'Pronta a chiamare le varianti in mischia' }
    }
  },
  {
    id: 't-02',
    title: 'Sessione Extra: 30 Calci Piazzati da Posizioni Angolate',
    description: 'Completare la scheda calci registrando le percentuali di successo da lato sinistro e destro a 35 metri.',
    category: 'kicking_practice',
    assignedToType: 'individual',
    assignedPlayerIds: ['p-25', 'p-26', 'p-27', 'p-40'],
    dueDate: '2026-08-27',
    frequency: 'daily',
    priority: 'high',
    createdBy: 'Marco Valenti (Head Coach)',
    createdAt: '2026-08-24',
    completions: {
      'p-26': { completed: true, completedAt: '2026-08-24T18:00:00Z', note: '27/30 realizzati (90%) - ottimo feeling col vento' }
    }
  },
  {
    id: 't-03',
    title: 'Mobilità Anche, Caviglie e Core Stability Pre-Workout',
    description: 'Eseguire i 15 minuti del protocollo World Rugby Activate Livello 3 prima di entrare in palestra.',
    category: 'mobility_recovery',
    assignedToType: 'all',
    assignedPlayerIds: INITIAL_PLAYERS.map(p => p.id),
    dueDate: '2026-08-26',
    frequency: 'daily',
    priority: 'normal',
    createdBy: 'Elena D\'Ambrosio (Prep. Atletico)',
    createdAt: '2026-08-24',
    completions: {
      'p-01': { completed: true, completedAt: '2026-08-25T08:00:00Z' },
      'p-22': { completed: true, completedAt: '2026-08-25T08:30:00Z' },
      'p-28': { completed: true, completedAt: '2026-08-25T07:45:00Z' }
    }
  },
  {
    id: 't-04',
    title: 'Check Idratazione & Nutrizione Pre-Gara',
    description: 'Compilare il log giornaliero sull\'assunzione di carboidrati e idratazione minima di 3 litri d\'acqua.',
    category: 'nutrition_hydration',
    assignedToType: 'all',
    assignedPlayerIds: INITIAL_PLAYERS.map(p => p.id),
    dueDate: '2026-08-29',
    frequency: 'weekly',
    priority: 'normal',
    createdBy: 'Elena D\'Ambrosio (Prep. Atletico)',
    createdAt: '2026-08-24',
    completions: {}
  }
];

export const INITIAL_KICKING_SESSIONS: KickingSession[] = [
  {
    id: 'kick-01',
    playerId: 'p-26',
    playerName: 'Michela Sillari',
    date: '2026-08-21',
    durationMin: 45,
    totalKicks: 40,
    successfulKicks: 36,
    stats: {
      piazzati: { total: 25, success: 23 },
      drop: { total: 5, success: 4 },
      spostamento: { total: 6, success: 6 },
      upAndUnder: { total: 4, success: 3 }
    },
    fieldZoneSuccess: {
      centro: 95,
      destra: 88,
      sinistra: 85
    },
    notes: 'Ottima traiettoria e impatto palla. Calci da 40m a bersaglio.'
  },
  {
    id: 'kick-02',
    playerId: 'p-25',
    playerName: 'Veronica Madia',
    date: '2026-08-21',
    durationMin: 45,
    totalKicks: 35,
    successfulKicks: 30,
    stats: {
      piazzati: { total: 15, success: 13 },
      drop: { total: 8, success: 7 },
      spostamento: { total: 8, success: 7 },
      upAndUnder: { total: 4, success: 3 }
    },
    fieldZoneSuccess: {
      centro: 90,
      destra: 82,
      sinistra: 86
    },
    notes: 'Focus speciale sui calci di liberazione nei 22m e 50-22 rule.'
  },
  {
    id: 'kick-03',
    playerId: 'p-22',
    playerName: 'Sofia Stefan',
    date: '2026-08-21',
    durationMin: 35,
    totalKicks: 25,
    successfulKicks: 22,
    stats: {
      piazzati: { total: 5, success: 4 },
      drop: { total: 2, success: 2 },
      spostamento: { total: 8, success: 7 },
      upAndUnder: { total: 10, success: 9 }
    },
    fieldZoneSuccess: {
      centro: 92,
      destra: 85,
      sinistra: 88
    },
    notes: 'Box kick con tempo di permanenza palla in aria > 4.2 secondi. Precisione millimetrica.'
  }
];

export const INITIAL_INDIVIDUAL_LOGS: IndividualTrainingLog[] = [
  {
    id: 'ind-01',
    playerId: 'p-16',
    playerName: 'Elisa Giordano',
    date: '2026-08-24',
    title: 'Upper Body Power & Core',
    type: 'Palestra / Forza',
    durationMin: 55,
    perceivedEffort: 8,
    exercisesDone: 'Panca piana 4x6 @ 75kg, Rematore con bilanciere 4x8 @ 70kg, Pallof press 3x12',
    notes: 'Ottima esplosività, nessun fastidio alla schiena.',
    verifiedByCoach: true
  },
  {
    id: 'ind-02',
    playerId: 'p-28',
    playerName: 'Beatrice Rigoni',
    date: '2026-08-24',
    title: 'Footwork & Speed Agility',
    type: 'Skills Passaggio',
    durationMin: 40,
    perceivedEffort: 7,
    exercisesDone: 'Ladder drills, cambi di direzione a 45° con ricezione passaggi tesi, sprint 15m resistiti',
    notes: 'Reattività ottima nei cambi di passo.',
    verifiedByCoach: true
  }
];

// Generate comprehensive attendance and RPE history for the past sessions
export function generateInitialAttendances(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const completedSessions = INITIAL_SESSIONS.filter(s => s.status === 'completed' || s.status === 'in_progress');

  completedSessions.forEach(session => {
    INITIAL_PLAYERS.forEach(player => {
      let status: AttendanceRecord['status'] = 'present';
      let staffNotes = '';

      if (player.status === 'injured') {
        status = 'injured_diff';
        staffNotes = 'Infortunata - Lavoro riabilitativo con staff medico';
      } else if (player.status === 'rehab_diff') {
        status = 'injured_diff';
        staffNotes = 'Differenziato - No contatto';
      } else {
        // Realistic small variation
        const rand = (player.id.charCodeAt(2) + session.id.charCodeAt(2)) % 10;
        if (rand === 9) {
          status = 'absent_justified';
          staffNotes = 'Permesso universitario/lavorativo concordato';
        } else if (rand === 8 && session.id === 's-01') {
          status = 'late';
          staffNotes = 'Ritardo 15 min per traffico autostradale';
        }
      }

      records.push({
        id: `att-${session.id}-${player.id}`,
        sessionId: session.id,
        sessionDate: session.date,
        playerId: player.id,
        playerName: player.name,
        jerseyNumber: player.jerseyNumber,
        status,
        lateMinutes: status === 'late' ? 15 : 0,
        staffNotes,
        recordedBy: 'Marco Valenti (Head Coach)',
        updatedAt: '2026-08-25T01:00:00Z'
      });
    });
  });

  return records;
}

export function generateInitialRpeFeedback(): RpeFeedback[] {
  const feedbacks: RpeFeedback[] = [];
  const completedSessions = INITIAL_SESSIONS.filter(s => s.status === 'completed');

  completedSessions.forEach(session => {
    INITIAL_PLAYERS.slice(0, 32).forEach(player => {
      if (player.status === 'injured') return;
      
      const baseRpe = session.plannedRpe;
      const variation = ((player.id.charCodeAt(2) + session.id.charCodeAt(2)) % 3) - 1;
      const finalRpe = Math.min(10, Math.max(4, baseRpe + variation));
      const focus = Math.min(10, Math.max(6, 8 + ((player.id.charCodeAt(2) % 3) - 1)));
      const fatigue = Math.min(10, Math.max(3, finalRpe + ((player.id.charCodeAt(3) % 3) - 1)));
      const soreness = Math.min(10, Math.max(2, 6 + ((player.id.charCodeAt(2) % 3) - 1)));
      const readiness = Math.min(10, Math.max(5, 10 - Math.floor(fatigue / 2)));
      const sessionLoad = finalRpe * session.plannedDurationMin;

      feedbacks.push({
        id: `rpe-${session.id}-${player.id}`,
        sessionId: session.id,
        sessionDate: session.date,
        playerId: player.id,
        playerName: player.name,
        rpe: finalRpe,
        focusRating: focus,
        physicalFatigue: fatigue,
        muscleSoreness: soreness,
        mentalReadiness: readiness,
        sessionLoad,
        notes: finalRpe >= 8 ? 'Intensità alta sulle mischie e contatti ravvicinati' : 'Buona reattività e ritmo elevato',
        submittedAt: `${session.date}T21:30:00Z`
      });
    });
  });

  return feedbacks;
}
