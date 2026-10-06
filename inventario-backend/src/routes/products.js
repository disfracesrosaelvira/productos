import { AppError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  actualizarProducto,
  crearProducto,
  filtrosProducto,
} from '../schemas/product.js';
import * as service from '../services/productService.js';

export default async function productRoutes(fastify) {
  fastify.get('/', async (request) => {
    const filtros = validate(filtrosProducto, request.query);
    return service.listProducts(filtros);
  });

  fastify.get('/:id', async (request) => service.getProduct(request.params.id));

  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const datos = validate(crearProducto, request.body);
    const producto = await service.createProduct(datos);
    return reply.code(201).send(producto);
  });

  fastify.put('/:id', { preHandler: requireAuth }, async (request) => {
    const datos = validate(actualizarProducto, request.body);
    return service.updateProduct(request.params.id, datos);
  });

  fastify.delete('/:id', { preHandler: requireAuth }, async (request) => {
    await service.deleteProduct(request.params.id);
    return { ok: true };
  });

  fastify.post('/:id/images', { preHandler: requireAuth }, async (request, reply) => {
    const archivo = await request.file();
    if (!archivo) throw new AppError('Se requiere un archivo (multipart/form-data)', 400);
    const buffer = await archivo.toBuffer();
    const imagen = await service.subirImagen(request.params.id, buffer, {
      isPrimary: request.query.primary === 'true',
    });
    return reply.code(201).send(imagen);
  });

  fastify.delete('/:id/images/:imageId', { preHandler: requireAuth }, async (request) =>
    service.eliminarImagen(request.params.id, request.params.imageId),
  );
}
