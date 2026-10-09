import { AppError, noEncontrado } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

const SELECT = 'id, nombre, descripcion, permisos, created_at, updated_at';

export async function listRoles() {
  const { data, error } = await supabaseAdmin.from('rol').select(SELECT).order('nombre');
  if (error) throw new AppError(error.message, 500);
  return data ?? [];
}

export async function getRol(id) {
  const { data, error } = await supabaseAdmin.from('rol').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data) throw noEncontrado('Rol');
  return data;
}

export async function createRol(input) {
  const { data, error } = await supabaseAdmin
    .from('rol')
    .insert({
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
      permisos: input.permisos ?? {},
    })
    .select('id')
    .single();
  if (error) throw new AppError(error.message, 500);
  return getRol(data.id);
}

export async function updateRol(id, input) {
  await getRol(id);
  const { error } = await supabaseAdmin.from('rol').update(input).eq('id', id);
  if (error) throw new AppError(error.message, 500);
  return getRol(id);
}

export async function deleteRol(id) {
  const { error } = await supabaseAdmin.from('rol').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new AppError('No se puede eliminar: hay usuarios asignados a este rol', 409);
    }
    throw new AppError(error.message, 500);
  }
}
