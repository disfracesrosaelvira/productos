import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import RolController from '../controllers/roles.controller';

export const setRoutesRol = (app: express.Application) => {
  const rolController = new RolController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.get('/roles', authMiddleware, rolController.getRoles);
  router.post('/roles', authMiddleware, rolController.createRol);
  router.get('/roles/filters', authMiddleware, rolController.getRolesFilters);
  router.put('/roles/:id', authMiddleware, rolController.updateRol);
  router.delete('/roles/:id', authMiddleware, rolController.deleteRol);

  app.use('/api/v1', router);
};
