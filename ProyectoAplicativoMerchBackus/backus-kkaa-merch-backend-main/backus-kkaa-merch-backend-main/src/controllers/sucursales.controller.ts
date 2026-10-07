import { Request, Response } from 'express';
import { SucursalService } from '../services/sucursal.service';

import { handleHttpError } from '../utils/handleError';

export default class SucursalesController {
  sucursalService = new SucursalService()
  constructor() {
  } 
  
  getSucursales = async (req: Request, res: Response) => {
    try {
      const {empresa_id} = req.params;
      const listSucursales = await this.sucursalService.getSucursales(empresa_id);
      res.status(200).json(listSucursales);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  getStore4UserType = async (req: Request, res: Response) => {
    try {
      const rol = req.query.rol;      
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string ;
      const user_id = req.query.user_id as string ;
      const filter = req.query.filter as string;

      const listSucursales = await this.sucursalService.getStore4UserType(user_id,rol,Number(pageIndex), Number(pageSize), isPaginate === 'true',filter);
      res.status(200).json(listSucursales);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  getPocOffline = async (req: Request, res: Response) => {
    try {
      const pocs = await this.sucursalService.getPocOffline();
      res.status(200).json(pocs);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  findStorePoc = async (req: Request, res: Response) => {
    try {
      const {nombre} = req.params;
      const listSucursales = await this.sucursalService.findStorePoc(nombre);
      res.status(200).json(listSucursales);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}