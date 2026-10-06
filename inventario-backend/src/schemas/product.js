import { z } from 'zod';

export const GENEROS = ['niño', 'niña', 'hombre', 'mujer', 'unisex'];

export const crearProducto = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().max(2000).nullish(),
  category_id: z.string().uuid().nullish(),
  price: z.number().nonnegative().nullish(),
  active: z.boolean().optional(),
});

export const actualizarProducto = crearProducto.partial();

export const filtrosProducto = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  gender: z.enum(GENEROS).optional(),
  size: z.string().trim().optional(),
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
