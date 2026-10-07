import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import UsuarioController from '../controllers/usuarios.controller';

export const setRoutesUsuario = (app: express.Application) => {
  const usuarioController = new UsuarioController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.get('/usuarios', authMiddleware, usuarioController.getUsuarios);
  router.get('/usuarios-offline', authMiddleware, usuarioController.getUsuariosOffline);
  router.post('/usuario', authMiddleware, usuarioController.createUsuario);
  router.get('/usuarios/filters', authMiddleware, usuarioController.getUsuariosFilters);
  router.put('/usuarios/:id', authMiddleware, usuarioController.updateUsuario);
  router.delete('/usuarios/:id', authMiddleware, usuarioController.deleteUsuario);

  app.use('/api/v1', router);
};
