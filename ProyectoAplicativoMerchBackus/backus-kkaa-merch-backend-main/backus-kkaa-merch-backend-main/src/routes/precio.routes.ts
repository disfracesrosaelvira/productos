import express, { Router } from 'express';
import PrecioController from '../controllers/precio.controller'; 
import { authMiddleware } from '../middlewares/auth.middleware';

export const setRoutesPrecio = (app: express.Application) => {
  const precioController = new PrecioController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.get('/marca/:empresa_id', authMiddleware, precioController.getMarca);
  router.get('/marca/competencia/:empresa_id', authMiddleware, precioController.getMarcasCompetencia);
  router.get('/producto', authMiddleware, precioController.getProductos);
  router.get('/productos-all', authMiddleware, precioController.getProductoAllByApp);
  router.post('/precio', authMiddleware, precioController.savePrecioInput);

  router.get('/prices', authMiddleware, precioController.getPrecios);
  
  router.get('/precio/counts-by-brand-and-description-month-and-week', authMiddleware, precioController.getPrecioCountsByBrandAndDescriptionByMonthAndWeek);
  router.get('/precio/averages-by-brand-and-description-month-and-week', authMiddleware, precioController.getPrecioAveragesByBrandAndDescriptionByMonthAndWeek);
  router.get('/precio/stores-with-promotional-price', authMiddleware, precioController.getStoresWithProductsPromotionalPrice)
  app.use('/api/v1', router);
};
