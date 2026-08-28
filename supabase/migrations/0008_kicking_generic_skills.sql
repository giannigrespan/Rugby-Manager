-- Consente di registrare skill al piede generici (nome + minuti) oltre alle
-- statistiche fisse (piazzati, drop, liberazione 50-22, box kick), per
-- tracciare il tempo settimanale dedicato dall'atleta al lavoro sui calci.
alter table public.kicking_sessions
  add column if not exists "genericSkills" jsonb default '[]'::jsonb;
