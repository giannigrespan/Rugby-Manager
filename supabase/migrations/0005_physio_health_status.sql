-- Aggiunge lo stato di salute/idoneità colorato alla scheda fisioterapica,
-- senza rimuovere le colonne esistenti (nessuna perdita di dati storici).
alter table public.physio_notes
  add column if not exists "healthStatus" text;
