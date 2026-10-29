import { validate } from '../lib/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { filtrosMovimiento } from '../schemas/movement.js';
import * as service from '../services/movementService.js';

export default async function movementRoutes(fastify) {
  fastify.get('/', { preHandler: requireAuth }, async (request) =>
    service.listMovements(validate(filtrosMovimiento, request.query)),
  );
}
