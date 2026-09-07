-- Le sessioni calci semplificate registrate dalle atlete (tempo di lavoro
-- generico, test calci piazzati per posizione) introducono due nuovi campi
-- che mancavano nello schema: senza questa migrazione, ogni upsert di
-- kicking_sessions con questi campi veniva rifiutato in silenzio da
-- PostgREST (colonna inesistente), quindi le sessioni non arrivavano mai
-- allo staff.
alter table public.kicking_sessions
  add column if not exists "sessionType" text,
  add column if not exists "fieldZoneStats" jsonb;
