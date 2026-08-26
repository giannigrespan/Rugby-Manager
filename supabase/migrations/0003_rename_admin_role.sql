-- Renames the generic 'admin' UserRole value to 'direttore_tecnico', a
-- dedicated role matching the club's real job title (Direttore Tecnico /
-- Dirigente) instead of a generic software-admin label. The isAdmin boolean
-- flag (an independent full-access override usable on any role) is untouched.
--
-- Mirrors the app-side rename in src/types.ts (UserRole, DEFAULT_ROLE_PERMISSIONS)
-- and every 'admin' role comparison across AuthContext / UserCredentialsAdminView /
-- StaffMemberModal / Sidebar / Navbar / PhysioNotesView / RosterDirectoryView /
-- googleSheetsService.

update public.staff_users set role = 'direttore_tecnico' where role = 'admin';
update public.players set role = 'direttore_tecnico' where role = 'admin';
update public.user_accounts set role = 'direttore_tecnico' where role = 'admin';

update public.role_permissions
set permissions = (permissions - 'admin') || jsonb_build_object('direttore_tecnico', permissions->'admin')
where id = 'default' and permissions ? 'admin';
