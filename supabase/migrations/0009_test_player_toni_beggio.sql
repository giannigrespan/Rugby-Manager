-- Adds a test athlete account for QA purposes: verifying that an athlete
-- only sees her own row/stats in the attendance matrix (see the
-- AttendanceMatrixView visibility fix).

insert into public.players (id, email, name, role, "jerseyNumber", position, department, status, notes, "createdAt")
values
  ('player-test-toni-beggio', 'myus30way@gmail.com', 'Toni Beggio', 'player', 45, 'Estremo (15)', 'trequarti', 'fit', 'Account di prova per test funzionalità atleta', '2026-09-02T00:00:00.000Z')
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  "jerseyNumber" = excluded."jerseyNumber",
  position = excluded.position,
  department = excluded.department,
  status = excluded.status,
  notes = excluded.notes;
