import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { PocsService } from '../services/pocs.service';

export default class PocsController {
  pocsService = new PocsService();

  constructor() {}

  savePoc = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.pocsService.savePoc(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public getPocs = async (req: Request, res: Response): Promise<void> => {
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const user_id = req.query.user_id as string;
    const filterTable = req.query.filterTable as string | undefined;
    try {
      const listContraprestadas = await this.pocsService.getPocs(Number(pageIndex), Number(pageSize), user_id, filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getPocsRelevos = async (req: Request, res: Response): Promise<void> => {
    const pageIndex = req.query.page_index as string;
    const pageSize = req.query.page_size as string;
    const filterStartDate = req.query.filterStartDate as string;
    const filterEndDate = req.query.filterEndDate as string;
    const searchName = req.query.searchName as string;
    try {
      const listContraprestadas = await this.pocsService.getPocsRelevos(Number(pageIndex), Number(pageSize), filterStartDate, filterEndDate, searchName);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getPocsFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = await this.pocsService.getPocsFilters();
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getFiltersDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = JSON.parse(req.query.filters as string);
      const filteredResults = await this.pocsService.getFiltersDashboard(filters);
      res.status(200).json(filteredResults);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getCheckName = async (req: Request, res: Response) => {
    try {
      const nombre = req.query.nombre as string;
      const id = req.query.id as string;
      const existingPoc = await this.pocsService.getCheckName(nombre, id);
      if (existingPoc) {
        return res.status(200).json({ exists: true });
      }
      return res.status(200).json({ exists: false });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  public getCheckPocCadena = async (req: Request, res: Response) => {
    try {
      const poc_cadena = req.query.poc_cadena as string;
      const id = req.query.id as string;
      const existingPoc = await this.pocsService.getCheckPocCadena(poc_cadena, id);
      if (existingPoc) {
        return res.status(200).json({ exists: true });
      }
      return res.status(200).json({ exists: false });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  public getCheckPocBackus = async (req: Request, res: Response) => {
    try {
      const poc_backus = req.query.poc_backus as string;
      const id = req.query.id as string;
      const existingPoc = await this.pocsService.getCheckPocBackus(poc_backus, id);
      if (existingPoc) {
        return res.status(200).json({ exists: true });
      }
      return res.status(200).json({ exists: false });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  public getCheckNamePlanning = async (req: Request, res: Response) => {
    try {
      const nombre_planning = req.query.nombre_planning as string;
      const id = req.query.id as string;
      const existingPoc = await this.pocsService.getCheckNamePlanning(nombre_planning, id);
      if (existingPoc) {
        return res.status(200).json({ exists: true });
      }
      return res.status(200).json({ exists: false });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  public getSupervisors = async (req: Request, res: Response) => {
    try {
      const supervisor = await this.pocsService.getSupervisors();
      return res.status(200).json(supervisor);
    } catch (error) {
      // return res.status(500).json({ message: 'Server error' });
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getPocById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sku = await this.pocsService.getPocById(id);
      
      if (!sku) {
        return res.status(404).json({ error: 'Poc no encontrada' });
      }
      
      res.status(200).json(sku);
    } catch (error) {
      console.error('Error en getPocById:', error);
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  updatePoc = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.pocsService.updatePoc(id, data);
      // res.status(200).json(result);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  updateSupervisor = async (req: Request, res: Response) => {
    try {
      const { nombre_sv } = req.params;
      const data = req.body;
      const result = await this.pocsService.updateSupervisor(nombre_sv, data);
      // res.status(200).json(result);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public getPocsNoPaginate = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.pocsService.getPocsNoPaginate();
      res.status(200).json(data);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  uploadExcelPocsMassiveLoad = async (req, res) => {
    const file = req.file; // Buffer del archivo subido
    // const uuid = req.body.uuid as string | undefined;
    const usuario = req.body.usuario as string | undefined;
    try {
      const uploadResult: any = await this.pocsService.uploadExcelPocsMassiveLoad(file, usuario);
      if (uploadResult.success) {
        return res.status(200).json(uploadResult); // Respuesta exitosa
      } else {
        return res.status(400).json(uploadResult); // Respuesta con error controlado (duplicados u otro problema conocido)
      }
    } catch (error) {
      // handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error al subir el archivo');
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Se produjo un error inesperado al procesar el archivo.',
      });
    }
  }

  varifyExcelPocsMassiveLoad = async (req, res) => {
    const file = req.file; // Buffer del archivo subido
    try {
      const uploadResult: any = await this.pocsService.varifyExcelPocsMassiveLoad(file);
      return res.status(200).json(uploadResult); // Respuesta exitosa
    } catch (error) {
      // handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error al subir el archivo');
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Se produjo un error inesperado al procesar el archivo.',
      });
    }
  }
}
