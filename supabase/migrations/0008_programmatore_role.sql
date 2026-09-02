-- Adds a dedicated 'programmatore' role (full, always-on admin visibility,
-- mirroring the app-side default in src/types.ts DEFAULT_ROLE_PERMISSIONS)
-- and reassigns Gianni Grespan to it — he was previously stored as
-- 'head_coach' with an isAdmin override.

update public.staff_users set role = 'programmatore' where email = 'gianni.grespan@gmail.com';
update public.user_accounts set role = 'programmatore' where email = 'gianni.grespan@gmail.com';

update public.role_permissions
set permissions = permissions || jsonb_build_object('programmatore', jsonb_build_object(
  'presenze', true,
  'sessioni', true,
  'calci', true,
  'rpe_focus', true,
  'infortuni', true,
  'fisioterapia', true,
  'individuali', true,
  'compiti', true,
  'rosa', true
))
where id = 'default';
