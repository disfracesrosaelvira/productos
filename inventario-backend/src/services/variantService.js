import { AppError, noEncontrado } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { slugify } from '../lib/utils.js';
import { registrarMovimiento } from './movementService.js';

const SELECT = `
  id, product_id, size, gender, fabric_quality, sku, stock_quantity, created_at, updated_at,
  products ( id, name, image_url, price )
`;

const GENERO_SKU = { niño: 'NIN', niña: 'NINA', hombre: 'HOM', mujer: 'MUJ', unisex: 'UNI' };

function codigo3(texto) {
  const limpio = slugify(texto || '').replace(/-/g, '');
  return (limpio.slice(0, 3) || 'gen').toUpperCase();
}

// SKU automatico: PREFIJO(categoria o nombre) - GENERO - TALLA  (unico)
async function generarSku(productId, size, gender) {
  const { data: producto } = await supabaseAdmin
    .from('products')
    .select('name, categories ( slug )')
    .eq('id', productId)
    .maybeSingle();

  const prefijo = codigo3(producto?.categories?.slug ?? producto?.name ?? 'sku');
  const generoCod = GENERO_SKU[gender] ?? 'GEN';
  const tallaCod = (slugify(size) || 'u').toUpperCase();
  const base = `${prefijo}-${generoCod}-${tallaCod}`;

  let sku = base;
  let n = 2;
  for (;;) {
    const { data } = await supabaseAdmin.from('variants').select('id').eq('sku', sku).maybeSingle();
    if (!data) break;
    sku = `${base}-${n++}`;
  }
  return sku;
}

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

export async function createVariant(input, userId = null) {
  const sku = input.sku || (await generarSku(input.product_id, input.size, input.gender));
  const { data, error } = await supabaseAdmin
    .from('variants')
    .insert({
      product_id: input.product_id,
      size: input.size ?? null,
      gender: input.gender ?? null,
      fabric_quality: input.fabric_quality ?? null,
      sku,
      stock_quantity: input.stock_quantity ?? 0,
    })
    .select('id')
    .single();
  if (error) throw new AppError(error.message, 500);

  const stockInicial = input.stock_quantity ?? 0;
  if (stockInicial > 0) {
    await registrarMovimiento({
      variant_id: data.id,
      tipo_movimiento: 'Entrada',
      cantidad_movimiento: stockInicial,
      referencia: 'stock inicial',
      user_id: userId,
    });
  }
  return getVariant(data.id);
}

export async function updateVariant(id, input, userId = null) {
  const actual = await getVariant(id);
  const { error } = await supabaseAdmin.from('variants').update(input).eq('id', id);
  if (error) throw new AppError(error.message, 500);

  if (input.stock_quantity !== undefined && input.stock_quantity !== actual.stock_quantity) {
    const delta = input.stock_quantity - actual.stock_quantity;
    await registrarMovimiento({
      variant_id: id,
      tipo_movimiento: delta > 0 ? 'Entrada' : 'Salida',
      cantidad_movimiento: delta,
      referencia: 'edicion de stock',
      user_id: userId,
    });
  }
  return getVariant(id);
}

export async function adjustStock(id, delta, userId = null) {
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

  await registrarMovimiento({
    variant_id: id,
    tipo_movimiento: delta > 0 ? 'Entrada' : 'Salida',
    cantidad_movimiento: delta,
    referencia: 'ajuste manual',
    user_id: userId,
  });
  return getVariant(id);
}

export async function deleteVariant(id) {
  const { error } = await supabaseAdmin.from('variants').delete().eq('id', id);
  if (error) throw new AppError(error.message, 500);
}
