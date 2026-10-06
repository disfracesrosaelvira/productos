import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const opcionesAuth = { autoRefreshToken: false, persistSession: false };

// Cliente con service-role: acceso total, usar solo en el servidor.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: opcionesAuth,
});

// Cliente que actua como el usuario del token (respeta RLS).
export function supabaseConToken(token) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey || env.supabaseServiceKey, {
    auth: opcionesAuth,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
