import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import * as service from '../services/reportService.js';

const rango = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export default async function reportRoutes(fastify) {
  fastify.get('/low-stock', { preHandler: requireAuth }, async (request) => {
    const { threshold } = validate(
      z.object({ threshold: z.coerce.number().int().nonnegative().default(3) }),
      request.query,
    );
    return service.productosBajoStock(threshold);
  });

  fastify.get('/sales-summary', { preHandler: requireAuth }, async (request) =>
    service.resumenVentas(validate(rango, request.query)),
  );

  fastify.get('/top-products', { preHandler: requireAuth }, async (request) =>
    service.productosMasVendidos(validate(rango, request.query)),
  );
}
