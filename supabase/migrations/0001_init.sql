-- Rugby Team Manager -- initial Supabase schema
-- Mirrors the data previously stored in Firebase Firestore.
--
-- Column names intentionally match the camelCase fields used by the React app
-- (see src/types.ts) so the client can read/write rows with no field mapping
-- layer, the same way the app used to talk to Firestore documents.
--
-- RLS policies below are fully open (USING (true) / WITH CHECK (true)) to
-- match the pre-existing Firestore rule `allow read, write: if true` in
-- firestore.rules. This keeps behavior identical during the migration, but
-- it means anyone holding the anon key can read/write every table. Tighten
-- these policies (e.g. restrict writes to `authenticated`, or scope rows to
-- the requesting user) once real per-role access control is wired up.

-- ---------------------------------------------------------------------------
-- Profiles (players / staff / generic authenticated-user cache)
-- ---------------------------------------------------------------------------

create table if not exists public.players (
  id text primary key,
  email text not null,
  name text not null,
  role text not null,
  "isAdmin" boolean,
  "jerseyNumber" integer,
  position text not null,
  department text not null,
  phone text,
  "birthDate" text,
  "medicalExpiry" text,
  status text not null,
  "avatarUrl" text,
  notes text,
  "createdAt" text not null,
  "lastLogin" text,
  "tempPassword" text
);

create table if not exists public.staff_users (like public.players including all);

create table if not exists public.user_accounts (like public.players including all);

-- ---------------------------------------------------------------------------
-- Training sessions
-- ---------------------------------------------------------------------------

create table if not exists public.training_sessions (
  id text primary key,
  title text not null,
  date text not null,
  time text not null,
  "endTime" text not null,
  location text not null,
  type text not null,
  "departmentTarget" text not null,
  "primaryFocus" text,
  "secondaryFocus" text,
  "plannedDurationMin" integer,
  "plannedRpe" integer,
  intensity text,
  "coachNotes" text,
  status text not null,
  "syncToCalendar" boolean,
  "createdAt" text not null
);

-- ---------------------------------------------------------------------------
-- Attendance records
-- ---------------------------------------------------------------------------

create table if not exists public.attendances (
  id text primary key,
  "sessionId" text not null,
  "sessionDate" text,
  "playerId" text not null,
  "playerName" text,
  "jerseyNumber" integer,
  status text not null,
  "lateMinutes" integer,
  "staffNotes" text,
  "recordedBy" text,
  "updatedAt" text not null
);

-- ---------------------------------------------------------------------------
-- RPE / focus feedback
-- ---------------------------------------------------------------------------

create table if not exists public.rpe_feedbacks (
  id text primary key,
  "sessionId" text not null,
  "sessionDate" text,
  "playerId" text not null,
  "playerName" text,
  rpe integer,
  "focusRating" integer,
  "physicalFatigue" integer,
  "muscleSoreness" integer,
  "mentalReadiness" integer,
  "sessionLoad" integer,
  notes text,
  "submittedAt" text not null
);

-- ---------------------------------------------------------------------------
-- Injuries
-- ---------------------------------------------------------------------------

create table if not exists public.injuries (
  id text primary key,
  "playerId" text not null,
  "playerName" text,
  "injuryDate" text,
  "bodyPart" text,
  "injuryType" text,
  severity text,
  "rtpExpectedDate" text,
  status text,
  "physioNotes" text,
  "treatmentPlan" text,
  "hiaConcussionProtocol" boolean,
  "updatedAt" text not null
);

-- ---------------------------------------------------------------------------
-- Physio notes
-- ---------------------------------------------------------------------------

create table if not exists public.physio_notes (
  id text primary key,
  "playerId" text not null,
  "playerName" text,
  date text,
  "physioName" text,
  "sessionType" text,
  diagnosis text,
  treatment text,
  "exercisePlan" text,
  "rtpStatus" text,
  "isConfidential" boolean
);

-- ---------------------------------------------------------------------------
-- Individual tasks
-- ---------------------------------------------------------------------------

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  category text,
  "assignedToType" text,
  "assignedPlayerIds" jsonb default '[]'::jsonb,
  "dueDate" text,
  frequency text,
  priority text,
  "createdBy" text,
  "createdAt" text not null,
  completions jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Kicking sessions
-- ---------------------------------------------------------------------------

create table if not exists public.kicking_sessions (
  id text primary key,
  "playerId" text not null,
  "playerName" text,
  date text,
  "durationMin" integer,
  "totalKicks" integer,
  "successfulKicks" integer,
  stats jsonb,
  "fieldZoneSuccess" jsonb,
  notes text
);

-- ---------------------------------------------------------------------------
-- Individual training logs
-- ---------------------------------------------------------------------------

create table if not exists public.individual_logs (
  id text primary key,
  "playerId" text not null,
  "playerName" text,
  date text,
  title text,
  type text,
  "durationMin" integer,
  "perceivedEffort" integer,
  "exercisesDone" text,
  notes text,
  "verifiedByCoach" boolean
);

-- ---------------------------------------------------------------------------
-- Push notifications
-- ---------------------------------------------------------------------------

create table if not exists public.push_notifications (
  id text primary key,
  title text not null,
  message text,
  "targetRole" text,
  "targetPlayerId" text,
  type text,
  timestamp text not null,
  "readBy" jsonb not null default '[]'::jsonb,
  "actionUrl" text
);

-- ---------------------------------------------------------------------------
-- Role permissions (was the single Firestore doc settings/role_permissions).
-- Kept as a single row (id = 'default') holding the whole permissions map,
-- mirroring the shape of the old Firestore document.
-- ---------------------------------------------------------------------------

create table if not exists public.role_permissions (
  id text primary key default 'default',
  permissions jsonb not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security -- open policies, mirroring the previous Firestore rule
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'players', 'staff_users', 'user_accounts',
      'training_sessions', 'attendances', 'rpe_feedbacks',
      'injuries', 'physio_notes', 'tasks', 'kicking_sessions',
      'individual_logs', 'push_notifications', 'role_permissions'
    ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I replica identity full;', t);
    execute format(
      'drop policy if exists "open access" on public.%I;', t
    );
    execute format(
      'create policy "open access" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime -- broadcast changes to every table (used for live sync in the app)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'players', 'staff_users', 'user_accounts',
      'training_sessions', 'attendances', 'rpe_feedbacks',
      'injuries', 'physio_notes', 'tasks', 'kicking_sessions',
      'individual_logs', 'push_notifications', 'role_permissions'
    ])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;
