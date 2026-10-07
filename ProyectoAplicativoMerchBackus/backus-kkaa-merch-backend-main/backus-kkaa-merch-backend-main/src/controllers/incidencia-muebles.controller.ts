import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { IncidenciaMueblesService } from '../services/incidencia-muebles.service';

export default class IncidenciaMueblesController {
  incidenciaMueblesService = new IncidenciaMueblesService();

  constructor() {}

  saveIncidenciaMueblesInput = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.incidenciaMueblesService.saveIncidenciaMueblesInput(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
}