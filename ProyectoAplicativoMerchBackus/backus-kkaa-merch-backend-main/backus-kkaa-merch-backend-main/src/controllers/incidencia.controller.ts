import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { FrenteService } from '../services/frentes.service';
import { IncidenciaService } from '../services/incidencia.service';

export default class IncidenciaController {
    incidenciaService = new IncidenciaService();

  constructor() {}

  saveCompetencia = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.incidenciaService.saveCompetencia(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  public getIncidenciaCompetencia = async (req: Request, res: Response): Promise<void> => {
    try {
      const user_id = req.query.user_id as string;
      const pageIndex = req.query.page_index as string;
      const pageSize = req.query.page_size as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;

      const listAsignaciones = await this.incidenciaService.getIncidenciaCompetencia(user_id, Number(pageIndex), Number(pageSize), filterStartDate, filterEndDate);
      
      res.status(200).json(listAsignaciones);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  saveMuebleAsignacion = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.incidenciaService.saveMuebleAsignacion(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  // en el frontend lo usan en dos partes
  public getIncidenciaMuebleAsignacion = async (req: Request, res: Response): Promise<void> => {
    try {
      const user_id = req.query.user_id as string;
      const empresa_id = req.query.empresa_id as string;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string;
      const pageSize = req.query.page_size as string;
      const isPaginate = req.query.is_paginate as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;

      const listAsignaciones = await this.incidenciaService.getIncidenciaMuebleAsignacion(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), Boolean(isPaginate), filterStartDate, filterEndDate, user_id);
      
      res.status(200).json(listAsignaciones);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  saveMuebleMantenimiento = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.incidenciaService.saveMuebleMantenimiento(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  public getIncidenciaMuebleMantenimiento = async (req: Request, res: Response): Promise<void> => {
    try {
      const user_id = req.query.user_id as string;
      const empresa_id = req.query.empresa_id as string;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string;
      const pageSize = req.query.page_size as string;
      const isPaginate = req.query.is_paginate as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;

      const listAsignaciones = await this.incidenciaService.getIncidenciaMuebleMantenimiento(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), Boolean(isPaginate), filterStartDate, filterEndDate, user_id);
      res.status(200).json(listAsignaciones);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  saveMuebleRecojo = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.incidenciaService.saveMuebleRecojo(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  public getIncidenciaMuebleRecojo = async (req: Request, res: Response): Promise<void> => {
    try {
      const user_id = req.query.user_id as string;
      const empresa_id = req.query.empresa_id as string;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string;
      const pageSize = req.query.page_size as string;
      const isPaginate = req.query.is_paginate as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;
      const listAsignaciones = await this.incidenciaService.getIncidenciaMuebleRecojo(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), Boolean(isPaginate), filterStartDate, filterEndDate, user_id);
      res.status(200).json(listAsignaciones);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}