import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import FrenteController from '../controllers/frente.controller';

export const setRoutesFrente = (app: express.Application) => {
  const frenteController = new FrenteController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.post('/frente', authMiddleware, frenteController.saveFrente);
  router.get('/frente', authMiddleware, frenteController.getFrentes);
  router.get('/frentes', authMiddleware, frenteController.getFrentes);
  router.get('/frente/counts-by-brand-month-and-week', authMiddleware, frenteController.getFrenteCountsByBrandMonthAndWeek);
  router.get('/frente/counts-by-poc-and-brand-month-and-week', authMiddleware, frenteController.getFrenteCountsByPocAndBrandMonthAndWeek);
  app.use('/api/v1', router);
};
