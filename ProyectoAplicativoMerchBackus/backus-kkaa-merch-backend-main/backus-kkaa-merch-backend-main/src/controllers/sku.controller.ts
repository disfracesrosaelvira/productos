import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { SkuService } from '../services/sku.service';

export default class SkuController {
  skuService = new SkuService();

  constructor() {}

  getMarca = async (req: Request, res: Response) => {
    try {
      const { empresa_id } = req.params;
      const listMarcas = await this.skuService.getMarca({ empresa_id });
      res.status(200).json(listMarcas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  
  getMarcaCompetencia = async (req: Request, res: Response) => {
    try {
      const { empresa_id } = req.params;
      const listMarcas = await this.skuService.getMarcaCompetencia({ empresa_id });
      res.status(200).json(listMarcas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getProductosCompetencia = async (req: Request, res: Response) => {
    try {
      const { empresa_id } = req.params;
      const listMarcas = await this.skuService.getProductosCompetencia({ empresa_id });
      res.status(200).json(listMarcas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  saveSku = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.skuService.saveSku(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  public getSkus = async (req: Request, res: Response): Promise<void> => {
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const filterTable = req.query.filterTable as string | undefined;
    try {
      const listContraprestadas = await this.skuService.getSkus(Number(pageIndex), Number(pageSize), filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getSkusFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.skuService.getSkusFilters();
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getSkusOffline = async (req: Request, res: Response): Promise<void> => {
    try {
      const skus = await this.skuService.getSkusOffline();
      res.status(200).json(skus);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getSkuById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sku = await this.skuService.getSkuById(id);
      
      if (!sku) {
        return res.status(404).json({ error: 'Sku no encontrada' });
      }
      
      res.status(200).json(sku);
    } catch (error) {
      console.error('Error en getSkuById:', error);
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updateSku = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.skuService.updateSku(id, data);
      res.status(result.error ? 500 : 200).json(result);
      // res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
}
