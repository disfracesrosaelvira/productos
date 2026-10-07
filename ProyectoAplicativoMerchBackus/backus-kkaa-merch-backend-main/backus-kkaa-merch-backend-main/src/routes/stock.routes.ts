import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import StockController from '../controllers/stock.controller';

export const setRoutesStock = (app: express.Application) => {
  const stockController = new StockController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.post('/stock', authMiddleware, stockController.saveStock);
  router.get('/stock/average-by-description-month-and-week', authMiddleware, stockController.getStockAverageByDescriptionMonthAndWeek);
  router.get('/stock/separate-average-by-description-month-and-week', authMiddleware, stockController.getStockSeparateAveragesByDescriptionMonthAndWeek);
  router.get('/stock/store-average-by-description-month-and-week', authMiddleware, stockController.getStockStoreAveragesByDescriptionMonthAndWeek);
  router.get('/stocks', authMiddleware, stockController.getStocks);

  app.use('/api/v1', router);
};
