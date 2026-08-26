-- Consente di impostare un obiettivo numerico su un compito; il progresso
-- per singola atleta è già tracciato dentro la colonna jsonb "completions"
-- esistente (nessuna migrazione necessaria per quella).
alter table public.tasks
  add column if not exists "goalTarget" numeric;
