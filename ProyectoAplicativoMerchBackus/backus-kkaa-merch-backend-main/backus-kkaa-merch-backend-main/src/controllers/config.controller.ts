import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { ConfigService } from '../services/config.service';

export default class ConfigController {
    configService = new ConfigService();

  constructor() {}

  configValues = async (req: Request, res: Response) => {
    try {
      const codigo  = req.query.codigo as string | undefined;
      const result = await this.configService.configValues(codigo);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  saveConfigValues = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.configService.saveConfigValues(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  createSkuLineaMarcaOrCategorias = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.configService.createSkuLineaMarcaOrCategorias(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
}