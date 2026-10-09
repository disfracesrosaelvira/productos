import { validate } from '../lib/validate.js';
import { filtrosMovimiento } from '../schemas/movement.js';
import * as service from '../services/movementService.js';

export default async function movementRoutes(fastify) {
  fastify.get('/', async (request) =>
    service.listMovements(validate(filtrosMovimiento, request.query)),
  );
}
