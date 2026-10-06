import sharp from 'sharp';
import { env } from '../config/env.js';
import { AppError, noEncontrado } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { slugify } from '../lib/utils.js';

const SELECT = `
  id, name, description, image_url, price, active, category_id, created_at, updated_at,
  categories ( id, name, slug ),
  variants ( id, size, gender, fabric_quality, sku, stock_quantity ),
  product_images ( id, image_url, is_primary, position )
`;

export async function listProducts(filtros) {
  const { q, category, gender, size, active, page, pageSize } = filtros;
  let select = SELECT;
  if (category) select = select.replace('categories (', 'categories!inner (');

  let query = supabaseAdmin
    .from('products')
    .select(select)
    .order('name', { ascending: true });
  if (q) query = query.ilike('name', `%${q}%`);
  if (category) query = query.eq('categories.slug', category);
  if (active !== undefined) query = query.eq('active', active);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);

  let items = data ?? [];
  if (gender) items = items.filter((p) => (p.variants ?? []).some((v) => v.gender === gender));
  if (size) items = items.filter((p) => (p.variants ?? []).some((v) => v.size === size));

  const total = items.length;
  const inicio = (page - 1) * pageSize;
  return { data: items.slice(inicio, inicio + pageSize), total, page, pageSize };
}

export async function getProduct(id) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data) throw noEncontrado('Producto');
  return data;
}

export async function createProduct(input) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: input.name,
      description: input.description ?? null,
      category_id: input.category_id ?? null,
      price: input.price ?? null,
      active: input.active ?? true,
    })
    .select('id')
    .single();
  if (error) throw new AppError(error.message, 500);
  return getProduct(data.id);
}

export async function updateProduct(id, input) {
  await getProduct(id); // valida existencia
  const { error } = await supabaseAdmin.from('products').update(input).eq('id', id);
  if (error) throw new AppError(error.message, 500);
  return getProduct(id);
}

export async function deleteProduct(id) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) throw new AppError(error.message, 500);
}

export async function subirImagen(productId, buffer, { isPrimary = false } = {}) {
  const producto = await getProduct(productId);

  const webp = await sharp(buffer)
    .rotate()
    .resize({
      width: env.imgMaxSize,
      height: env.imgMaxSize,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: env.imgQuality })
    .toBuffer();

  const slug = slugify(producto.name) || 'producto';
  const ruta = `productos/${slug}/${Date.now()}-${slug}.webp`;

  const { error: errSubida } = await supabaseAdmin.storage
    .from(env.bucket)
    .upload(ruta, webp, { contentType: 'image/webp', upsert: true });
  if (errSubida) throw new AppError(`Storage: ${errSubida.message}`, 500);

  const { data: pub } = supabaseAdmin.storage.from(env.bucket).getPublicUrl(ruta);
  const url = pub.publicUrl;

  const { count } = await supabaseAdmin
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  const principal = isPrimary || !count;

  if (principal) {
    await supabaseAdmin.from('product_images').update({ is_primary: false }).eq('product_id', productId);
    await supabaseAdmin.from('products').update({ image_url: url }).eq('id', productId);
  }

  const { data: img, error: errInsert } = await supabaseAdmin
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: url,
      is_primary: principal,
      position: Date.now(),
    })
    .select()
    .single();
  if (errInsert) throw new AppError(errInsert.message, 500);

  return img;
}

export async function eliminarImagen(productId, imageId) {
  const { data: img, error } = await supabaseAdmin
    .from('product_images')
    .select('id, image_url, is_primary')
    .eq('id', imageId)
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!img) throw noEncontrado('Imagen');

  const marcador = `/object/public/${env.bucket}/`;
  const idx = img.image_url.indexOf(marcador);
  if (idx >= 0) {
    const ruta = img.image_url.slice(idx + marcador.length);
    await supabaseAdmin.storage.from(env.bucket).remove([ruta]);
  }

  await supabaseAdmin.from('product_images').delete().eq('id', imageId);

  if (img.is_primary) {
    const { data: siguiente } = await supabaseAdmin
      .from('product_images')
      .select('id, image_url')
      .eq('product_id', productId)
      .order('position')
      .limit(1)
      .maybeSingle();
    if (siguiente) {
      await supabaseAdmin.from('product_images').update({ is_primary: true }).eq('id', siguiente.id);
      await supabaseAdmin.from('products').update({ image_url: siguiente.image_url }).eq('id', productId);
    } else {
      await supabaseAdmin.from('products').update({ image_url: null }).eq('id', productId);
    }
  }
  return { ok: true };
}
