import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';

import { env } from './config/env.js';
import { AppError } from './lib/errors.js';
import productRoutes from './routes/products.js';
import variantRoutes from './routes/variants.js';
import saleRoutes from './routes/sales.js';
import reportRoutes from './routes/reports.js';
import movementRoutes from './routes/movements.js';
import usuarioRoutes from './routes/usuarios.js';
import rolRoutes from './routes/roles.js';

const fastify = Fastify({
  logger:
    env.nodeEnv === 'development'
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
      : true,
});

await fastify.register(helmet, { contentSecurityPolicy: false });
await fastify.register(cors, {
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
});
await fastify.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });

fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ error: error.message, details: error.details });
  }
  if (error.validation) {
    return reply.code(400).send({ error: 'Error de validacion', details: error.message });
  }
  request.log.error(error);
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? 'Error interno' });
});

fastify.get('/health', async () => ({ status: 'ok', servicio: 'inventario-backend', ts: new Date().toISOString() }));

await fastify.register(productRoutes, { prefix: '/products' });
await fastify.register(variantRoutes, { prefix: '/variants' });
await fastify.register(saleRoutes, { prefix: '/sales' });
await fastify.register(reportRoutes, { prefix: '/reports' });
await fastify.register(movementRoutes, { prefix: '/movements' });
await fastify.register(usuarioRoutes, { prefix: '/usuarios' });
await fastify.register(rolRoutes, { prefix: '/roles' });

try {
  await fastify.listen({ port: env.port, host: env.host });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
