import { Request, Response } from 'express';
import { PrecioService } from '../services/precio.service';
import { handleHttpError } from '../utils/handleError';

export default class PrecioController {
  precioService = new PrecioService();

  constructor() {}

  getMarca = async (req: Request, res: Response) => {
    try {
      const { empresa_id } = req.params;
      const listMarcas = await this.precioService.getMarca({ empresa_id });
      res.status(200).json(listMarcas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getMarcasCompetencia = async (req: Request, res: Response) => {
    try {
      const { empresa_id } = req.params;
      const listMarcas = await this.precioService.getMarcasCompetencia({ empresa_id });
      res.status(200).json(listMarcas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getProductos = async (req: Request, res: Response) => {
    try {
      const empresa_id = req.query.empresa_id as string | undefined;
      const marca = req.query.marca as string | undefined;  
      const listProductos = await this.precioService.getProductos(empresa_id, marca);
      res.status(200).json(listProductos);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  savePrecioInput = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.precioService.savePrecioInput(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  getProductoAllByApp = async (req: Request, res: Response) => {
    try {
      const empresa_id = req.query.empresa_id as string | undefined;
      
      const listProductos = await this.precioService.getProductosAllByApp(empresa_id);
      res.status(200).json(listProductos);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getPrecios = async (req: Request, res: Response): Promise<void> => {
    const user_id = req.query.user_id as string;
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const filterStartDate = req.query.filterStartDate as string;
    const filterEndDate = req.query.filterEndDate as string;
    try {
      const listContraprestadas = await this.precioService.getPrecios(user_id, Number(pageIndex), Number(pageSize), filterStartDate, filterEndDate);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getPrecioCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const marcas = req.query.marcas as string;
    try {
      const list = await this.precioService.getPrecioCountsByBrandAndDescriptionByMonthAndWeek(filterTable, marcas);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getPrecioAveragesByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.precioService.getPrecioAveragesByBrandAndDescriptionByMonthAndWeek(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getStoresWithProductsPromotionalPrice = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const list = await this.precioService.getStoresWithProductsPromotionalPrice(filterTable);
      res.status(200).json(list);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}
