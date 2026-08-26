// Lets an admin (Direttore Tecnico / isAdmin) create a real Supabase Auth
// account (with a generated temporary password) for a player or staff
// member who doesn't have a Google account, or reset an existing one's
// password - without ever exposing the service_role key to the browser.
//
// Called from the client via supabase.functions.invoke('admin-manage-credentials', ...).
// The Authorization header (the caller's own session) is forwarded
// automatically by the SDK and used below to verify the caller is really
// an admin before doing anything privileged.

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function checkIsAdmin(adminClient: SupabaseClient, callerId: string, callerEmail: string): Promise<boolean> {
  if (callerEmail.toLowerCase() === 'gianni.grespan@gmail.com') return true;

  const { data: byId } = await adminClient
    .from('user_accounts')
    .select('isAdmin, role')
    .eq('id', callerId)
    .maybeSingle();
  if (byId && (byId.isAdmin || byId.role === 'direttore_tecnico')) return true;

  const { data: byEmail } = await adminClient
    .from('staff_users')
    .select('isAdmin, role')
    .eq('email', callerEmail.toLowerCase())
    .maybeSingle();
  return Boolean(byEmail && (byEmail.isAdmin || byEmail.role === 'direttore_tecnico'));
}

async function findRosterProfile(adminClient: SupabaseClient, email: string): Promise<Record<string, unknown> | null> {
  const { data: staffRow } = await adminClient.from('staff_users').select('*').eq('email', email).maybeSingle();
  if (staffRow) return staffRow;
  const { data: playerRow } = await adminClient.from('players').select('*').eq('email', email).maybeSingle();
  return playerRow ?? null;
}

// Stores the generated password on the roster row (read by the admin panel's
// existing password column) and caches the profile under the real auth uid
// in user_accounts, matching the shape the client-side login flow expects.
async function syncProfile(adminClient: SupabaseClient, profile: Record<string, unknown>, authUserId: string, password: string) {
  const table = profile.role === 'player' ? 'players' : 'staff_users';
  await adminClient.from(table).update({ tempPassword: password }).eq('id', profile.id as string);
  await adminClient.from('user_accounts').upsert({ ...profile, id: authUserId, tempPassword: password });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // Scoped only to identify the caller from their own session token.
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller || !caller.email) {
      return json({ error: 'Non autenticato.' }, 401);
    }

    // Privileged client for admin operations - never sent to the browser.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const isCallerAdmin = await checkIsAdmin(adminClient, caller.id, caller.email);
    if (!isCallerAdmin) {
      return json({ error: 'Permessi insufficienti: solo gli amministratori possono gestire le credenziali.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const targetEmail = String(body.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return json({ error: 'Email mancante.' }, 400);
    }

    const matchedProfile = await findRosterProfile(adminClient, targetEmail);
    if (!matchedProfile) {
      return json({ error: `${targetEmail} non risulta nella rosa o nello staff.` }, 404);
    }

    if (action === 'create') {
      const password = randomPassword();
      const { data, error } = await adminClient.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: matchedProfile.name as string },
      });

      if (error || !data.user) {
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('already') && msg.includes('registered')) {
          return json({ error: 'Esiste già un account per questa email. Usa "Resetta Password" invece.' }, 409);
        }
        return json({ error: error?.message || 'Creazione account non riuscita.' }, 400);
      }

      await syncProfile(adminClient, matchedProfile, data.user.id, password);
      return json({ success: true, email: targetEmail, password });
    }

    if (action === 'reset_password') {
      const { data: accountRow } = await adminClient
        .from('user_accounts')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();

      if (!accountRow) {
        return json({ error: 'Questa persona non ha ancora un account: usa "Crea Accesso" invece.' }, 404);
      }

      const password = randomPassword();
      const { error } = await adminClient.auth.admin.updateUserById(accountRow.id as string, { password });
      if (error) {
        return json({ error: error.message }, 400);
      }

      await syncProfile(adminClient, matchedProfile, accountRow.id as string, password);
      return json({ success: true, email: targetEmail, password });
    }

    return json({ error: 'Azione non valida.' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || 'Errore interno.' }, 500);
  }
});
