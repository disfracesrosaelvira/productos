import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import ConfigController from '../controllers/config.controller';

export const setRoutesConfig = (app: express.Application) => {
  const configController = new ConfigController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.get('/config/values', authMiddleware, configController.configValues);
  router.post('/config/values', authMiddleware, configController.saveConfigValues);
  // para crear sku_linea_marca y sku_linea_categorias
  router.post('/config/sku-linea-marcas-or-categorias', authMiddleware, configController.createSkuLineaMarcaOrCategorias);
  app.use('/api/v1', router);
};
