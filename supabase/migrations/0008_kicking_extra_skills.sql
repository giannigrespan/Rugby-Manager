-- Consente di registrare skill generici di calcio (oltre a piazzati, drop,
-- liberazione 50-22 e box kick), valorizzati solo con i minuti dedicati.
alter table public.kicking_sessions
  add column if not exists "extraSkills" jsonb;
