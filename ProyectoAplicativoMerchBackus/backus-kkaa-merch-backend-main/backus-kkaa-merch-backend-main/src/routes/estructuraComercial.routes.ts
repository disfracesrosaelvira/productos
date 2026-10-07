import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import EstructuraComercialController from '../controllers/estructuraComercial.controller';

export const setRoutesEstructuraComercial = (app: express.Application) => {
  const estructuraComercialController = new EstructuraComercialController();

  const router: Router = express.Router();

  router.post('/commercial-structure', authMiddleware, estructuraComercialController.saveEstructuraComercial);
  router.get('/commercial-structure', authMiddleware, estructuraComercialController.getEstructuraComercial);
  router.get('/commercial-structure/filters', authMiddleware, estructuraComercialController.getEstructuraComercialFilters);
  router.get('/commercial-structure/:id', authMiddleware, estructuraComercialController.getEstructuraComercialById);
  router.patch('/commercial-structure/:id', authMiddleware, estructuraComercialController.updateEstructuraComercial);

  
  app.use('/api/v1', router);
};