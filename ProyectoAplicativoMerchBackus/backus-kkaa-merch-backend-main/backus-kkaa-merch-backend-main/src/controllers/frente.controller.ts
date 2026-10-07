import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { FrenteService } from '../services/frentes.service';

export default class FrenteController {
    frenteService = new FrenteService();

  constructor() {}

  saveFrente = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.frenteService.saveFrente(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public getFrentes = async (req: Request, res: Response): Promise<void> => {
    const user_id = req.query.user_id as string;
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const filterStartDate = req.query.filterStartDate as string;
    const filterEndDate = req.query.filterEndDate as string;
    try {
      const listContraprestadas = await this.frenteService.getFrentes(user_id, Number(pageIndex), Number(pageSize), filterStartDate, filterEndDate);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getFrenteCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.frenteService.getFrenteCountsByBrandMonthAndWeek(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getFrenteCountsByPocAndBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.frenteService.getFrenteCountsByPocAndBrandMonthAndWeek(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}