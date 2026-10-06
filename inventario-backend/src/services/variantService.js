import { AppError, noEncontrado } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

const SELECT = `
  id, product_id, size, gender, fabric_quality, sku, stock_quantity, created_at, updated_at,
  products ( id, name, image_url, price )
`;

export async function listVariants(filtros = {}) {
  let query = supabaseAdmin.from('variants').select(SELECT).order('sku', { ascending: true });
  if (filtros.product_id) query = query.eq('product_id', filtros.product_id);
  if (filtros.gender) query = query.eq('gender', filtros.gender);
  if (filtros.low_stock !== undefined) query = query.lte('stock_quantity', filtros.low_stock);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);
  return data;
}

export async function getVariant(id) {
  const { data, error } = await supabaseAdmin.from('variants').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data) throw noEncontrado('Variante');
  return data;
}

export async function createVariant(input) {
  const { data, error } = await supabaseAdmin
    .from('variants')
    .insert({
      product_id: input.product_id,
      size: input.size ?? null,
      gender: input.gender ?? null,
      fabric_quality: input.fabric_quality ?? null,
      sku: input.sku ?? null,
      stock_quantity: input.stock_quantity ?? 0,
    })
    .select('id')
    .single();
  if (error) throw new AppError(error.message, 500);
  return getVariant(data.id);
}

export async function updateVariant(id, input) {
  await getVariant(id);
  const { error } = await supabaseAdmin.from('variants').update(input).eq('id', id);
  if (error) throw new AppError(error.message, 500);
  return getVariant(id);
}

export async function adjustStock(id, delta) {
  const { data: actual, error } = await supabaseAdmin
    .from('variants')
    .select('stock_quantity')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!actual) throw noEncontrado('Variante');

  const nuevo = actual.stock_quantity + delta;
  if (nuevo < 0) {
    throw new AppError(
      `Stock insuficiente: disponible ${actual.stock_quantity}, ajuste ${delta}`,
      409,
    );
  }

  const { error: errUpdate } = await supabaseAdmin
    .from('variants')
    .update({ stock_quantity: nuevo })
    .eq('id', id);
  if (errUpdate) throw new AppError(errUpdate.message, 500);
  return getVariant(id);
}

export async function deleteVariant(id) {
  const { error } = await supabaseAdmin.from('variants').delete().eq('id', id);
  if (error) throw new AppError(error.message, 500);
}
