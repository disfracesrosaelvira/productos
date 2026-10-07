import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { StockService } from '../services/stock.service';

export default class StockController {
  stockService = new StockService();
  
  constructor() {}

  saveStock = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.stockService.saveStock(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public getStocks = async (req: Request, res: Response): Promise<void> => {
    const user_id = req.query.user_id as string;
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const filterStartDate = req.query.filterStartDate as string;
    const filterEndDate = req.query.filterEndDate as string;
    try {
      const listContraprestadas = await this.stockService.getStocks(user_id, Number(pageIndex), Number(pageSize), filterStartDate, filterEndDate);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getStockAverageByDescriptionMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.stockService.getStockAverageByDescriptionMonthAndWeek(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getStockSeparateAveragesByDescriptionMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.stockService.getStockSeparateAveragesByDescriptionMonthAndWeek(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getStockStoreAveragesByDescriptionMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.stockService.getStockStoreAveragesByDescriptionMonthAndWeek(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}