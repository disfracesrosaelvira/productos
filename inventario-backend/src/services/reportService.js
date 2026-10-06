import { AppError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

export async function productosBajoStock(threshold = 3) {
  const { data, error } = await supabaseAdmin
    .from('variants')
    .select('id, sku, size, gender, stock_quantity, products ( id, name, image_url )')
    .lte('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true });
  if (error) throw new AppError(error.message, 500);
  return { threshold, total: data?.length ?? 0, data: data ?? [] };
}

export async function resumenVentas({ from, to }) {
  let query = supabaseAdmin.from('sales').select('sale_date, total_amount');
  if (from) query = query.gte('sale_date', from);
  if (to) query = query.lte('sale_date', to);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);

  const porDia = new Map();
  let montoTotal = 0;
  for (const venta of data ?? []) {
    const clave = venta.sale_date;
    const acc = porDia.get(clave) ?? { fecha: clave, ventas: 0, monto: 0 };
    acc.ventas += 1;
    acc.monto += Number(venta.total_amount ?? 0);
    porDia.set(clave, acc);
    montoTotal += Number(venta.total_amount ?? 0);
  }

  return {
    desde: from ?? null,
    hasta: to ?? null,
    total_ventas: data?.length ?? 0,
    monto_total: montoTotal,
    por_dia: [...porDia.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
  };
}

export async function productosMasVendidos({ from, to, limit = 10 }) {
  let query = supabaseAdmin
    .from('sale_items')
    .select('quantity, unit_price, variants ( product_id, products ( id, name ) ), sales!inner ( sale_date )');
  if (from) query = query.gte('sales.sale_date', from);
  if (to) query = query.lte('sales.sale_date', to);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);

  const acumulado = new Map();
  for (const item of data ?? []) {
    const producto = item.variants?.products;
    if (!producto) continue;
    const acc = acumulado.get(producto.id) ?? {
      product_id: producto.id,
      nombre: producto.name,
      unidades: 0,
      monto: 0,
    };
    acc.unidades += item.quantity;
    acc.monto += item.quantity * Number(item.unit_price ?? 0);
    acumulado.set(producto.id, acc);
  }

  const ordenado = [...acumulado.values()].sort((a, b) => b.unidades - a.unidades);
  return { desde: from ?? null, hasta: to ?? null, data: ordenado.slice(0, limit) };
}
