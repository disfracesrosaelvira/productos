import { AppError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

const SELECT = `
  id, variant_id, tipo_movimiento, cantidad_movimiento, fecha_movimiento, referencia, user_id,
  variants ( id, sku, size, gender, product_id )
`;

export async function listMovements({ variant_id, product_id, limit = 100 } = {}) {
  let select = SELECT;
  if (product_id) select = select.replace('variants (', 'variants!inner (');

  let query = supabaseAdmin
    .from('stock_movements')
    .select(select)
    .order('fecha_movimiento', { ascending: false })
    .limit(limit);

  if (variant_id) query = query.eq('variant_id', variant_id);
  if (product_id) query = query.eq('variants.product_id', product_id);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);
  return data ?? [];
}

// Registra un movimiento de stock. `cantidad_movimiento` va con signo
// (positivo = ingresa, negativo = sale).
// Es best-effort: si el historial falla (p. ej. falta correr la migracion),
// no se interrumpe la operacion de stock; solo se registra el error.
export async function registrarMovimiento({
  variant_id,
  tipo_movimiento,
  cantidad_movimiento,
  referencia = null,
  user_id = null,
}) {
  if (!variant_id || !cantidad_movimiento) return null;

  const { error } = await supabaseAdmin.from('stock_movements').insert({
    variant_id,
    tipo_movimiento,
    cantidad_movimiento,
    referencia,
    user_id,
  });
  if (error) {
    console.error(`[stock_movements] no se pudo registrar movimiento: ${error.message}`);
    return null;
  }
  return true;
}
