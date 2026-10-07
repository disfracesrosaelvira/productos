import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { EstructuraComercialService } from '../services/estructuraComercial.service';

export default class EstructuraComercialController {
  estructuraComercialService = new EstructuraComercialService();

  constructor() {}

  saveEstructuraComercial = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.estructuraComercialService.saveEstructuraComercial(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  public getEstructuraComercial = async (req: Request, res: Response): Promise<void> => {
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const filterTable = req.query.filterTable as string | undefined;
    try {
      const listEstructuraComercial = await this.estructuraComercialService.getEstructuraComercial(Number(pageIndex), Number(pageSize), filterTable);
      res.status(200).json(listEstructuraComercial);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getEstructuraComercialFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.estructuraComercialService.getEstructuraComercialFilters();
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getEstructuraComercialById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const estructuraComercial = await this.estructuraComercialService.getEstructuraComercialById(id);
      
      if (!estructuraComercial) {
        return res.status(404).json({ error: 'Estructura comercial no encontrada' });
      }
      
      res.status(200).json(estructuraComercial);
    } catch (error) {
      console.error('Error en getEstructuraComercialById:', error);
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updateEstructuraComercial = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.estructuraComercialService.updateEstructuraComercial(id, data);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
}
