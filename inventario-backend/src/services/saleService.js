import { AppError, noEncontrado } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

const SELECT = `
  id, sale_date, total_amount, customer, user_id, created_at,
  sale_items ( id, variant_id, quantity, unit_price,
    variants ( id, size, gender, sku, products ( id, name ) )
  )
`;

export async function listSales({ from, to, page, pageSize }) {
  let query = supabaseAdmin
    .from('sales')
    .select(SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });
  if (from) query = query.gte('sale_date', from);
  if (to) query = query.lte('sale_date', to);

  const inicio = (page - 1) * pageSize;
  query = query.range(inicio, inicio + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 500);
  return { data: data ?? [], total: count ?? 0, page, pageSize };
}

export async function getSale(id) {
  const { data, error } = await supabaseAdmin.from('sales').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data) throw noEncontrado('Venta');
  return data;
}

export async function createSale(userId, input) {
  const { customer, sale_date, items } = input;

  const { data: venta, error } = await supabaseAdmin
    .from('sales')
    .insert({
      customer: customer ?? null,
      sale_date: sale_date ?? undefined,
      total_amount: 0,
      user_id: userId ?? null,
    })
    .select('id')
    .single();
  if (error) throw new AppError(error.message, 500);

  const filas = items.map((i) => ({
    sale_id: venta.id,
    variant_id: i.variant_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  // El trigger restar_stock valida y descuenta; el trigger recalcular_total
  // actualiza el monto. Si algo falla, se deshace la venta (cascade).
  const { error: errItems } = await supabaseAdmin.from('sale_items').insert(filas);
  if (errItems) {
    await supabaseAdmin.from('sales').delete().eq('id', venta.id);
    throw new AppError(`No se pudo registrar la venta: ${errItems.message}`, 409);
  }

  return getSale(venta.id);
}
