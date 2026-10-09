import { z } from 'zod';

export const filtrosMovimiento = z.object({
  variant_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
});
