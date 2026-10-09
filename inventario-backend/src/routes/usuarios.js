import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';
import { actualizarUsuario, crearUsuario } from '../schemas/usuario.js';
import * as service from '../services/usuarioService.js';

const filtros = z.object({
  incluirEliminados: z.coerce.boolean().default(false),
});

export default async function usuarioRoutes(fastify) {
  fastify.get('/', { preHandler: requireAuth }, async (request) =>
    service.listUsuarios(validate(filtros, request.query)),
  );

  fastify.get('/:id', { preHandler: requireAuth }, async (request) =>
    service.getUsuario(request.params.id),
  );

  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const datos = validate(crearUsuario, request.body);
    const usuario = await service.createUsuario(datos);
    return reply.code(201).send(usuario);
  });

  fastify.put('/:id', { preHandler: requireAdmin }, async (request) => {
    const datos = validate(actualizarUsuario, request.body);
    return service.updateUsuario(request.params.id, datos);
  });

  fastify.delete('/:id', { preHandler: requireAdmin }, async (request) => {
    await service.deleteUsuario(request.params.id);
    return { ok: true };
  });
}
