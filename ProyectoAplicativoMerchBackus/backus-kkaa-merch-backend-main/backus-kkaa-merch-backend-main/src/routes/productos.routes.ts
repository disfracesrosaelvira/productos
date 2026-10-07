import express, { Router } from "express";
import ProductosController from "../controllers/productos.controller";
import { authMiddleware } from '../middlewares/auth.middleware'

export const setRoutesProductos = (app: express.Application) => {
  const productosController: ProductosController = new ProductosController();

  // Crea un nuevo router
  const router: Router = express.Router();

  // Define las rutas en el router
  /**
   * @swagger
   * tags:
   *   - name: Productos
   *     description: Rutas de CRUD Productos
   */

  /**
   * @swagger
   * /api/v1/productos/{app}/{sucursal}/{categoria}:
   *   get:
   *     summary: Crea un nuevo producto para la aplicación, sucursal y categoría especificadas.
   *     description: Crea un nuevo producto para la aplicación, sucursal y categoría especificadas.
   *     tags: [Productos]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *       - in: path
   *         name: categoria
   *         required: true
   *         schema:
   *           type: string
   *           example: Artesanales y RTDs
   *         description: Nombre de la categoria.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 listProductos:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                         description: ID del producto.
   *                       name:
   *                         type: string
   *                         description: Nombre del producto.
   *                       categoria:
   *                         type: string
   *                         description: Categoría del producto.
   *                       sucursal:
   *                         type: string
   *                         description: Sucursal del producto.
   *                       activo:
   *                         type: boolean
   *                         description: Estado de activación del producto.
   *                       imagen:
   *                         type: string
   *                         description: URL de la imagen del producto.
   *                       app:
   *                         type: string
   *                         description: Nombre de la aplicación del producto.
   */
  router.get(
    "/productos/:app/:sucursal/:categoria",
    authMiddleware,
    productosController.getProductos
  );

  app.use("/api/v1", router);
};
