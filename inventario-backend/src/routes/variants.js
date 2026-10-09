import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  actualizarVariante,
  ajusteStock,
  crearVariante,
} from '../schemas/variant.js';
import * as service from '../services/variantService.js';

const filtros = z.object({
  product_id: z.string().uuid().optional(),
  gender: z.string().optional(),
  low_stock: z.coerce.number().int().optional(),
});

export default async function variantRoutes(fastify) {
  fastify.get('/', async (request) => service.listVariants(validate(filtros, request.query)));

  fastify.get('/:id', async (request) => service.getVariant(request.params.id));

  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const datos = validate(crearVariante, request.body);
    const variante = await service.createVariant(datos, request.user.id);
    return reply.code(201).send(variante);
  });

  fastify.put('/:id', { preHandler: requireAuth }, async (request) => {
    const datos = validate(actualizarVariante, request.body);
    return service.updateVariant(request.params.id, datos, request.user.id);
  });

  fastify.patch('/:id/stock', { preHandler: requireAuth }, async (request) => {
    const { delta } = validate(ajusteStock, request.body);
    return service.adjustStock(request.params.id, delta, request.user.id);
  });

  fastify.delete('/:id', { preHandler: requireAuth }, async (request) => {
    await service.deleteVariant(request.params.id);
    return { ok: true };
  });
}
