-- Seeds the real Villorba roster (staff + players) sourced from the club's
-- Google Sheet, replacing the placeholder demo data that only ever lived in
-- src/data/seedData.ts / localStorage.
--
-- Role mapping notes:
--  - "Direttore Sportivo" (Zizzola) maps to 'direttore_tecnico', the
--    dedicated full-access role added in 0003_rename_admin_role.sql.
--  - Everyone marked "[merged] Tutto" in the sheet (full visibility) gets
--    "isAdmin" = true, which makes isSectionVisibleForUser() bypass the
--    per-role permission matrix regardless of their assigned role.
--  - Generic Italian position names (e.g. "Pilone", "Ala", "Centro") don't
--    specify left/right or which back-row slot, so they're mapped to one
--    concrete PlayerPosition value (see mapping below) - adjust per player
--    later from the Rosa view if a more specific slot is needed.
--    Pilone -> Pilone Sinistro (1) | Tallonatore -> Tallonatrice (2)
--    Seconda Linea -> Seconda Linea (4) | Terza Linea -> Terza Linea Flanker (6)
--    Mediano di Mischia -> Mediana di Mischia (9) | Apertura -> Mediana d'Apertura (10)
--    Ala -> Ala Sinistra (11) | Centro -> Primo Centro (12) | Estremo -> Estremo (15)

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

insert into public.staff_users (id, email, name, role, "isAdmin", position, department, status, "createdAt")
values
  ('staff-001', 'fedezizzo10@gmail.com', 'Federico Zizzola', 'direttore_tecnico', true, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-002', 'stefano.tonetto1969@gmail.com', 'Stefano Tonetto', 'head_coach', true, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-003', 'alberto.tonetto@gmail.com', 'Alberto Tonetto', 'assistant_coach', true, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-004', 'federico.l.maso@gmail.com', 'Federico Maso', 'assistant_coach', true, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-005', 'marcogeraci82@gmail.com', 'Marco Geraci', 'assistant_coach', true, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-006', 'serenachiavaroli@gmail.com', 'Serena Chiavaroli', 'athletic_trainer', false, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-007', 'mariamagatti92@gmail.com', 'Maria Magatti', 'athletic_trainer', false, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-008', 'defranceschipaola22@gmail.com', 'Paola De Franceschi', 'physiotherapist', false, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z'),
  ('staff-009', 'leonardo.pin.00@gmail.com', 'Leonardo Pin', 'physiotherapist', false, 'Staff Tecnico', 'staff', 'fit', '2026-08-26T00:00:00.000Z')
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  "isAdmin" = excluded."isAdmin",
  position = excluded.position,
  department = excluded.department,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Players (Rosa)
-- ---------------------------------------------------------------------------

insert into public.players (id, email, name, role, position, department, status, "createdAt")
values
  ('player-001', 'coro.benedetta08@gmail.com', 'Benedetta Corò', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-002', 'giorgiaquinto17@gmail.com', 'Giorgia Quinto', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-003', '2001.scandiuzzi@gmail.com', 'Sara Scandiuzzi', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-004', 'iri.turtle@yahoo.com', 'Irene Nave', 'player', 'Seconda Linea (4)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-005', 'lauragurioli@live.it', 'Laura Gurioli', 'player', 'Tallonatrice (2)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-006', 'bonfiglio.lucia7@gmail.com', 'Lucia Bonfiglio', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-007', 'teresablaskovic@gmail.com', 'Teresa Sofia Blaskovic', 'player', 'Seconda Linea (4)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-008', 'gaia.busopb@gmail.com', 'Gaia Buso', 'player', 'Mediana di Mischia (9)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-009', 'beacapos@gmail.com', 'Beatrice Capomaggi', 'player', 'Mediana d''Apertura (10)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-010', 'dcostantini.graphics@gmail.com', 'Daria Costantini', 'player', 'Tallonatrice (2)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-011', 'brugnerottoemily@gmail.com', 'Emily Brugnerotto', 'player', 'Mediana di Mischia (9)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-012', 'copatgreta@gmail.com', 'Greta Copat', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-013', 'sofiab.stefanini@gmail.com', 'Sofia Stefanini', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-014', 'vittoriazoppe@gmail.com', 'Vittoria Zoppè', 'player', 'Tallonatrice (2)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-015', 'nascimben91.sn@gmail.com', 'Sofia Nascimben', 'player', 'Seconda Linea (4)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-016', 'crivellaro.rebecca@gmail.com', 'Rebecca Crivellaro', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-017', 'letizia.pegorer@gmail.com', 'Letizia Pegorer', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-018', 'elipilat06@yahoo.com', 'Elisa Pilat', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-019', 'alicepuppin92@gmail.com', 'Alice Puppin', 'player', 'Tallonatrice (2)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-020', 'teiriajensen@icloud.com', 'Teiria Jensen', 'player', 'Primo Centro (12)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-021', 'alicevisman@gmail.com', 'Alice Visman', 'player', 'Mediana d''Apertura (10)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-022', 'casagrande.giulia@gmail.com', 'Giulia Casagrande (Becky)', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-023', 'alessia.liziero@gmail.com', 'Alessia Liziero', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-024', 'defatomanuela@gmail.com', 'Manuela De-Fato', 'player', 'Seconda Linea (4)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-025', 'borea85@gmail.com', 'Sara Geromel', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-026', 'valeria.pin.98@gmail.com', 'Valeria Pin', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-027', 'federicacipolla7@gmail.com', 'Federica Cipolla', 'player', 'Primo Centro (12)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-028', 'gaiasimeon@gmail.com', 'Gaia Simeon', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-029', 'stecca.emanuela@gmail.com', 'Emanuela Stecca', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-030', 'triolorebecca@gmail.com', 'Rebecca Triolo', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-031', 'sarabarattin9@gmail.com', 'Sara Barattin', 'player', 'Mediana di Mischia (9)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-032', 'giorgia.prate98@gmail.com', 'Giorgia Pratelli', 'player', 'Estremo (15)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-033', 'vittoriafrancolini6@gmail.com', 'Vittoria Francolini', 'player', 'Estremo (15)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-034', 'scuderisara04@gmail.com', 'Sara Scuderi', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-035', 'chiaracheli3@gmail.com', 'Chiara Cheli', 'player', 'Tallonatrice (2)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-036', 'rugbycata@gmail.com', 'Catalina Alexandra Marcon', 'player', 'Pilone Sinistro (1)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-037', 'jessicafacchin01@gmail.com', 'Jessica Facchin', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-038', 'frangipani.alessandra03@gmail.com', 'Alessandra Lucrezia Frangipani', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-039', 'elisabetta.giuriato08@gmail.com', 'Elisabetta Giuriato', 'player', 'Seconda Linea (4)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-040', 'aurora.abiti006@gmail.com', 'Aurora Abiti', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-041', 'cindy.crepaldi09@gmail.com', 'Cindy Crepaldy', 'player', 'Terza Linea Flanker (6)', 'avanti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-042', 'tina.busana02@gmail.com', 'Martina Busana', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-043', 'busettoagata07@icloud.com', 'Agata Busetto', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z'),
  ('player-044', 'martina.strassner190206@gmail.com', 'Martina Strassner', 'player', 'Ala Sinistra (11)', 'trequarti', 'fit', '2026-08-26T00:00:00.000Z')
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  position = excluded.position,
  department = excluded.department,
  status = excluded.status;
