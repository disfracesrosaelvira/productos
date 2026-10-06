import { validate } from '../lib/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { crearVenta, filtrosVenta } from '../schemas/sale.js';
import * as service from '../services/saleService.js';

export default async function saleRoutes(fastify) {
  fastify.get('/', { preHandler: requireAuth }, async (request) =>
    service.listSales(validate(filtrosVenta, request.query)),
  );

  fastify.get('/:id', { preHandler: requireAuth }, async (request) =>
    service.getSale(request.params.id),
  );

  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const datos = validate(crearVenta, request.body);
    const venta = await service.createSale(request.user.id, datos);
    return reply.code(201).send(venta);
  });
}
