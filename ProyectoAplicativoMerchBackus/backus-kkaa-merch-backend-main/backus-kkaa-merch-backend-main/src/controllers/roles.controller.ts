import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { RolService } from '../services/rol.service';

export default class RolController {
  rolService = new RolService();

  constructor() {}

  getRoles = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const filterTable = req.query.filterTable as string | undefined;
      const result = await this.rolService.getRoles(filterTable);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public getRolesFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.rolService.getRolesFilters();
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  createRol = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.rolService.insertRol(data);
      res.status(201).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  updateRol = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.rolService.updateRol(id, data);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  deleteRol = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.rolService.deleteRol(id);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
}