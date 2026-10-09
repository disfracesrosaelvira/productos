import { AppError, noEncontrado } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

// Fuente unica: Supabase Auth (credenciales) + profiles (perfil/rol/estado).
const SELECT = 'id, email, full_name, role, estado, created_at, updated_at, fecha_eliminacion';
const BAN = '876000h'; // ~100 anios

async function mapaPermisos() {
  const { data, error } = await supabaseAdmin.from('rol').select('nombre, permisos');
  if (error) throw new AppError(error.message, 500);
  return Object.fromEntries((data ?? []).map((r) => [r.nombre, r.permisos ?? {}]));
}

function mapear(p, permisos) {
  return {
    id: p.id,
    email: p.email,
    nombre: p.full_name ?? '',
    rol: p.role,
    estado: p.estado,
    fecha_creacion: p.created_at,
    fecha_actualizacion: p.updated_at,
    fecha_eliminacion: p.fecha_eliminacion,
    permisos: permisos[p.role] ?? {},
  };
}

export async function listUsuarios({ incluirEliminados = false } = {}) {
  let query = supabaseAdmin
    .from('profiles')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (!incluirEliminados) query = query.is('fecha_eliminacion', null);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);

  const permisos = await mapaPermisos();
  return (data ?? []).map((p) => mapear(p, permisos));
}

export async function getUsuario(id) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data) throw noEncontrado('Usuario');

  const permisos = await mapaPermisos();
  return mapear(data, permisos);
}

export async function createUsuario(input) {
  const { email, nombre, rol, estado = 1, contrasena } = input;

  const { data: creado, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: contrasena,
    email_confirm: true,
    user_metadata: { full_name: nombre },
  });
  if (error) throw new AppError(error.message, 500);

  // El trigger handle_new_user crea el perfil; aqui se ajustan rol/nombre/estado.
  const { error: errPerfil } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: nombre, role: rol, estado })
    .eq('id', creado.user.id);
  if (errPerfil) {
    await supabaseAdmin.auth.admin.deleteUser(creado.user.id);
    throw new AppError(errPerfil.message, 500);
  }

  if (estado === 0) {
    await supabaseAdmin.auth.admin.updateUserById(creado.user.id, { ban_duration: BAN });
  }
  return getUsuario(creado.user.id);
}

export async function updateUsuario(id, input) {
  await getUsuario(id);

  const cambios = {};
  if (input.nombre !== undefined) cambios.full_name = input.nombre;
  if (input.rol !== undefined) cambios.role = input.rol;
  if (input.estado !== undefined) cambios.estado = input.estado;
  if (Object.keys(cambios).length) {
    const { error } = await supabaseAdmin.from('profiles').update(cambios).eq('id', id);
    if (error) throw new AppError(error.message, 500);
  }

  const authCambios = {};
  if (input.email !== undefined) {
    authCambios.email = input.email;
    authCambios.email_confirm = true;
  }
  if (input.contrasena) authCambios.password = input.contrasena;
  if (input.estado !== undefined) authCambios.ban_duration = input.estado === 0 ? BAN : 'none';
  if (Object.keys(authCambios).length) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, authCambios);
    if (error) throw new AppError(error.message, 500);
  }
  return getUsuario(id);
}

// Baja logica: desactiva en profiles y banea en Auth.
export async function deleteUsuario(id) {
  await getUsuario(id);
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ estado: 0, fecha_eliminacion: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new AppError(error.message, 500);

  await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: BAN });
  return { ok: true };
}
