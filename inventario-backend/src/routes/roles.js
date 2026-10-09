import { validate } from '../lib/validate.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';
import { actualizarRol, crearRol } from '../schemas/rol.js';
import * as service from '../services/rolService.js';

export default async function rolRoutes(fastify) {
  fastify.get('/', { preHandler: requireAuth }, async () => service.listRoles());

  fastify.get('/:id', { preHandler: requireAuth }, async (request) => service.getRol(request.params.id));

  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const datos = validate(crearRol, request.body);
    const rol = await service.createRol(datos);
    return reply.code(201).send(rol);
  });

  fastify.put('/:id', { preHandler: requireAdmin }, async (request) => {
    const datos = validate(actualizarRol, request.body);
    return service.updateRol(request.params.id, datos);
  });

  fastify.delete('/:id', { preHandler: requireAdmin }, async (request) => {
    await service.deleteRol(request.params.id);
    return { ok: true };
  });
}
