import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { UsuarioService } from '../services/usuario.service';


export default class RolController {
  usuarioService = new UsuarioService();

  constructor() {}

  getUsuarios = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string;
      const filterTable = req.query.filterTable as string | undefined;

      const result: any = await this.usuarioService.getUsuarios(pageIndex, pageSize, filterTable);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  getUsuariosOffline = async (req: Request, res: Response) => {
    try {
      const result: any = await this.usuarioService.getUsuariosOffline();
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public getUsuariosFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.usuarioService.getUsuariosFilters();
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  createUsuario = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.usuarioService.insertUsuario(data);
      res.status(result.error ? 500 : 201).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  updateUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.usuarioService.updateUsuario(id, data);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  deleteUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.usuarioService.deleteUsuario(id);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
}