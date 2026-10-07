import express, { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validatorRegister, validatorLogin } from "../validators/auth";

export const setRoutesAuth = (app: express.Application) => {
  const authController: AuthController = new AuthController();

  // Crea un nuevo router
  const router: Router = express.Router();

  // Define las rutas en el router

  /**
   * @swagger
   * tags:
   *   - name: Auth
   *     description: Rutas de Logueo
   */
  /**
   * @swagger
   * /api/v1/login:
   *   post:
   *     summary: Guarda una encuesta precio que se pertenece al app , sucursal y categoria definidas con sus caracteristicas.
   *     description: Guarda una encuesta precio que se pertenece al app , sucursal y categoria definidas con sus caracteristicas.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 example: test
   *                 description: usuario
   *               password:
   *                 type: string
   *                 example: 1234
   *                 description: contraseña
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   */
  router.post("/login", validatorLogin, authController.login);

  app.use("/api/v1", router);
};
