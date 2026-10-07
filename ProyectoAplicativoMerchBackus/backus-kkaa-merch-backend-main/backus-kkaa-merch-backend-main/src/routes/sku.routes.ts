import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import SkuController from '../controllers/sku.controller';

export const setRoutesSKU = (app: express.Application) => {
  const skuController = new SkuController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.get('/sku/marca/:empresa_id', authMiddleware, skuController.getMarca);
  router.get('/sku/marca_competencia/:empresa_id', authMiddleware, skuController.getMarcaCompetencia);
  router.get('/sku/producto_competencia/:empresa_id', authMiddleware, skuController.getProductosCompetencia);
  
  router.get('/skus-offline', authMiddleware, skuController.getSkusOffline);
  router.post('/skus', authMiddleware, skuController.saveSku);
  router.get('/skus', authMiddleware, skuController.getSkus);
  router.get('/skus/filters', authMiddleware, skuController.getSkusFilters);
  router.get('/skus/:id', authMiddleware, skuController.getSkuById);
  router.patch('/skus/:id', authMiddleware, skuController.updateSku);

  app.use('/api/v1', router);
};
