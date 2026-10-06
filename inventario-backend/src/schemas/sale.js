import { z } from 'zod';

export const crearVenta = z.object({
  customer: z.string().trim().max(200).nullish(),
  sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD').optional(),
  items: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().positive(),
        unit_price: z.number().nonnegative(),
      }),
    )
    .min(1, 'La venta debe tener al menos un item'),
});

export const filtrosVenta = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
