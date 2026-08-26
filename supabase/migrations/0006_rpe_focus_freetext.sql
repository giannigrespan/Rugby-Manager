-- Sostituisce gli slider secondari (Focus, Stanchezza, DOMS, Prontezza) con
-- campi di commento libero sul focus dell'allenamento. Le vecchie colonne
-- numeriche restano per compatibilità con lo storico ma non sono più
-- popolate dal form.
alter table public.rpe_feedbacks
  add column if not exists "whatWentWell" text,
  add column if not exists "difficulties" text,
  add column if not exists "otherNotes" text;

alter table public.rpe_feedbacks
  alter column "focusRating" drop not null,
  alter column "physicalFatigue" drop not null,
  alter column "muscleSoreness" drop not null,
  alter column "mentalReadiness" drop not null;
