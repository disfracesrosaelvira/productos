import { Request, Response } from 'express';
import { EncuestasService } from '../services/encuestas.service';

import { handleHttpError } from '../utils/handleError';

export default class EncuestasController {
  encuestasService = new EncuestasService()
  constructor() {
  } 

  getEncuestasPrecio = async (req: Request, res: Response) => {
    try {
      const listEncuestasPrecio = await this.encuestasService.getEncuestasPrecio(req);
      res.status(200).json(listEncuestasPrecio);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  encuestasPrecioSave = async (req: Request, res: Response) => {
    try {
      const createDocument = await this.encuestasService.saveEncuestaPrecio(req);
      res.status(200).json(createDocument);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  updateEncuestasPrecio = async (req: Request, res: Response) => {
    try {
      const response = await this.encuestasService.updateEncuestaPrecios(req);
      res.status(200).json(response);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getEncuestasFrentes = async (req: Request, res: Response) => {
    try {
      const listEncuestasFrentes = await this.encuestasService.getEncuestasFrentes(req);
      res.status(200).json(listEncuestasFrentes);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  encuestasFrentesSave = async (req: Request, res: Response) => {
    try {
      const createDocument = await this.encuestasService.saveEncuestaFrentes(req);
      res.status(200).json(createDocument);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updateEncuestaFrentes = async (req: Request, res: Response) => {
    try {
      const response = await this.encuestasService.updateEncuestaFrentes(req);
      res.status(200).json(response);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  getEncuestasExhibiciones = async (req: Request, res: Response) => {
    try {
      const listEncuestasExcibiciones = await this.encuestasService.getEncuestasExhibiciones(req);
      res.status(200).json(listEncuestasExcibiciones);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updateEncuestasExhibiciones = async (req: Request, res: Response) => {
    try {
      const listEncuestasExcibiciones = await this.encuestasService.updateEncuestasExhibiciones(req);
      res.status(200).json(listEncuestasExcibiciones);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  getEncuestasIncidencias = async (req: Request, res: Response) => {
    try {
      const listEncuestasIncidencias = await this.encuestasService.getEncuestasIncidencias(req);
      res.status(200).json(listEncuestasIncidencias);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updateEncuestasIncidencias = async (req: Request, res: Response) => {
    try {
      const response = await this.encuestasService.updateEncuestasIncidencias(req);
      res.status(200).json(response);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  getEncuestasStock = async (req: Request, res: Response) => {
    try {
      const listEncuestasStock = await this.encuestasService.getEncuestasStock(req);
      res.status(200).json(listEncuestasStock);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updateEncuestasStock = async (req: Request, res: Response) => {
    try {
      const response = await this.encuestasService.updateEncuestasStock(req);
      res.status(200).json(response);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}