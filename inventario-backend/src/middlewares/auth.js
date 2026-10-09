import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../lib/errors.js';

async function autenticar(request) {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Token de autenticacion requerido', 401);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new AppError('Token invalido o expirado', 401);

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('role, estado')
    .eq('id', data.user.id)
    .maybeSingle();

  if (perfil && perfil.estado === 0) {
    throw new AppError('Usuario inactivo', 403);
  }

  request.user = {
    id: data.user.id,
    email: data.user.email,
    role: perfil?.role ?? 'vendedor',
    estado: perfil?.estado ?? 1,
  };
  request.token = token;
}

// preHandler: exige usuario autenticado y activo
export async function requireAuth(request) {
  await autenticar(request);
}

// preHandler: exige rol admin
export async function requireAdmin(request) {
  await autenticar(request);
  if (request.user.role !== 'admin') {
    throw new AppError('Requiere rol administrador', 403);
  }
}
