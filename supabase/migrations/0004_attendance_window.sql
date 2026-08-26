-- Global switch controlling whether players can self-declare their own
-- attendance/absence for upcoming scheduled sessions. Coaches toggle this
-- on/off; the intended weekly deadline (Monday of the session's week) is
-- shown in the UI as guidance, not enforced automatically here.

create table if not exists public.attendance_window (
  id text primary key default 'default',
  "isOpen" boolean not null default true,
  "updatedAt" text not null,
  "updatedBy" text
);

alter table public.attendance_window enable row level security;
alter table public.attendance_window replica identity full;

drop policy if exists "open access" on public.attendance_window;
create policy "open access" on public.attendance_window for all to anon, authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attendance_window'
  ) then
    alter publication supabase_realtime add table public.attendance_window;
  end if;
end $$;

insert into public.attendance_window (id, "isOpen", "updatedAt")
values ('default', true, now()::text)
on conflict (id) do nothing;
