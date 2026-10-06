import { z } from 'zod';
import { GENEROS } from './product.js';

export const crearVariante = z.object({
  product_id: z.string().uuid(),
  size: z.string().trim().max(50).nullish(),
  gender: z.enum(GENEROS).nullish(),
  fabric_quality: z.string().trim().max(100).nullish(),
  sku: z.string().trim().max(100).nullish(),
  stock_quantity: z.number().int().nonnegative().default(0),
});

export const actualizarVariante = crearVariante.omit({ product_id: true }).partial();

export const ajusteStock = z.object({
  delta: z.number().int().refine((v) => v !== 0, 'El ajuste no puede ser 0'),
});
