import express, { Router } from "express";
import SucursalesController from "../controllers/sucursales.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const setRoutesSucursales = (app: express.Application) => {
  const sucursalController: SucursalesController = new SucursalesController();

  // Crea un nuevo router
  const router: Router = express.Router();

  // Define las rutas en el router

  /**
   * @swagger
   * tags:
   *   - name: Sucursales
   *     description: Rutas de CRUD Sucursales
   */

  /**
   * @swagger
   * /api/v1/sucursales/{app}:
   *   get:
   *     summary: Obtiene todas las sucursales
   *     description: Obtiene una lista de todas las sucursales.
   *     tags: [Sucursales]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
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
   *                 list:
   *                   type: array
   *                   items:
   *                     type: string
   */
  router.get("/sucursales/:empresa_id", authMiddleware, sucursalController.getSucursales );
  router.get("/store4UserType", authMiddleware, sucursalController.getStore4UserType );
  router.get("/poc-offline", authMiddleware, sucursalController.getPocOffline );
  router.get("/storePoc/:nombre", authMiddleware, sucursalController.findStorePoc );

  app.use("/api/v1", router);
};
