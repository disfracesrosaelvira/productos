import { Request, Response } from "express";
import fs from 'fs';
import path from 'path';
import { DownloadService } from "../services/download-service";
import { handleHttpError } from "../utils/handleError";

export default class DownloadFilesController {

  downloadService = new DownloadService();

  constructor() {}

  // generateBackup = async (req: Request, res: Response) => {
  //   try {
  //     const collectionName = req.query.collectionName as string;
  //     if (!collectionName) {
  //       return res.status(400).json({ error: 'El nombre de la colección es requerido' });
  //     }
      
  //     const data = await this.downloadService.generateBackup(collectionName);
      
  //     // Configurar los encabezados para la descarga
  //     const filename = `backup-${collectionName}-${new Date().toISOString().split('T')[0]}.json`;
  //     res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  //     res.setHeader('Content-Type', 'application/json');
      
  //     // Enviar los datos como JSON
  //     res.json(data);
  //   } catch (err) {
  //     // handleHttpError(res, 'ERROR_GENERATING_BACKUP', 500, err);
  //     res.status(500).send('Error generando la copia de seguridad.');
  //   }
  // }
  generateBackup = async (req: Request, res: Response) => {
    try {
      const collectionName = req.query.collectionName as string;
      if (!collectionName) {
        return res.status(400).json({ error: 'El nombre de la colección es requerido' });
      }
      
      // Generar el buffer con los datos ya transformados
      const buffer = await this.downloadService.generateBackup(collectionName);
      
      // Configurar los encabezados para forzar la descarga
      const filename = `backup-${collectionName}-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      
      // Enviar el buffer directamente, sin convertirlo nuevamente a JSON
      res.end(buffer);
    } catch (err) {
      console.error('Error al generar backup:', err);
      res.status(500).send('Error generando la copia de seguridad.');
    }
  }

  downloadExcelFileAdicional = async (req: Request, res: Response) => {
    try {      
        const endOfMonth = req.query.endOfMonth as string;
        const startOfMonth = req.query.startOfMonth as string;
        const user_id = req.query.user_id as string;
        const filterTable = req.query.filterTable as string | undefined;
        const buffer = await this.downloadService.downloadExcelFileAdicional(startOfMonth, endOfMonth, user_id, filterTable);    
        res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      } catch (err) {
        res.status(500).send('Error exporting data.');
      }
  }

  downloadExcelFileContraprestada = async (req: Request, res: Response) => {
    try {
      const endOfMonth = req.query.endOfMonth as string;
      const startOfMonth = req.query.startOfMonth as string;
      const user_id = req.query.user_id as string;
      const filterTable = req.query.filterTable as string | undefined;
      const buffer = await this.downloadService.downloadExcelFileContraprestada(startOfMonth, endOfMonth, user_id, filterTable);    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileCompetencia = async (req: Request, res: Response) => {
    try {
        const endOfMonth = req.query.endOfMonth as string;
        const startOfMonth = req.query.startOfMonth as string;
        const user_id = req.query.user_id as string;
        const filterTable = req.query.filterTable as string | undefined;
        const buffer = await this.downloadService.downloadExcelFileCompetencia(startOfMonth, endOfMonth, user_id, filterTable);    
        res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      } catch (err) {
        res.status(500).send('Error exporting data.');
      }
  }

  downloadExcelFileFrente = async (req: Request, res: Response) => {
    try {
      const user_id = req.query.user_id as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;
      const buffer = await this.downloadService.downloadExcelFileFrente(user_id, filterStartDate, filterEndDate);    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFilePrecio = async (req: Request, res: Response) => {
    try {
      const user_id = req.query.user_id as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;
      const buffer = await this.downloadService.downloadExcelFilePrecio(user_id, filterStartDate, filterEndDate);    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileIncidences = async (req: Request, res: Response) => {
    try {
      const user_id = req.query.user_id as string;
      const type = req.query.type as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;
      const buffer = await this.downloadService.downloadExcelFileIncidences(type, user_id, filterStartDate, filterEndDate);    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileStock = async (req: Request, res: Response) => {
    try {
      const user_id = req.query.user_id as string;
      const filterStartDate = req.query.filterStartDate as string;
      const filterEndDate = req.query.filterEndDate as string;
      const buffer = await this.downloadService.downloadExcelFileStock(user_id, filterStartDate, filterEndDate);    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileSku = async (req: Request, res: Response) => {
    try {
      const buffer = await this.downloadService.downloadExcelFileSku();    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFilePoc = async (req: Request, res: Response) => {
    try {
      const user_id = req.query.user_id as string;
      const buffer = await this.downloadService.downloadExcelFilePoc(user_id);    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileEstructureComercial = async (req: Request, res: Response) => {
    try {
      const buffer = await this.downloadService.downloadExcelFileEstructureComercial();    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileUsuario = async (req: Request, res: Response) => {
    try {
      const buffer = await this.downloadService.downloadExcelFileUsuario();    
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Error exporting data.');
    }
  }
  
  //////
  downloadExcelFilePrecioAveragesByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFilePrecioAveragesByBrandAndDescriptionByMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFilePrecioCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const marcas = req.query.marcas as string;
    try {
      const buffer = await this.downloadService.downloadExcelFilePrecioCountsByBrandAndDescriptionByMonthAndWeek(filterTable, marcas);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFilePrecioStoresWithProductsPromotional = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFilePrecioStoresWithProductsPromotional(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }
  //////

  downloadExcelFileFrenteCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileFrenteCountsByBrandMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileStockAverageByDescriptionMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileStockAverageByDescriptionMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileStockSeparateAverageByDescriptionMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileStockSeparateAverageByDescriptionMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionCompetenciaCountsByTypeMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionCompetenciaCountsByTypeMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionCompetenciaCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionCompetenciaCountsByBrandMonthAndWeek(filterTable, typesExhibitions);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    const marcas = req.query.marcas as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(filterTable, typesExhibitions, marcas);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionAdicionalCountsByTypeMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionAdicionalCountsByTypeMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionAdicionalCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionAdicionalCountsByBrandMonthAndWeek(filterTable, typesExhibitions);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionAdicionalCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    const marcas = req.query.marcas as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionAdicionalCountsByBrandAndDescriptionByMonthAndWeek(filterTable, typesExhibitions, marcas);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionContraprestadaCountsByTypeMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionContraprestadaCountsByTypeMonthAndWeek(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionContraprestadaCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionContraprestadaCountsByBrandMonthAndWeek(filterTable, typesExhibitions);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelFileExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    const marcas = req.query.marcas as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(filterTable, typesExhibitions, marcas);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  public downloadExcelFileExhibitionContraprestadaMonthlySupervisorVigenteCounts = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const buffer = await this.downloadService.downloadExcelFileExhibitionContraprestadaMonthlySupervisorVigenteCounts(filterTable);
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error exporting data.');
    }
  }

  downloadExcelPlantilla = async (req: Request, res: Response): Promise<void> => {
    const entity = req.query.entity as string;
    try {
      const result = await this.downloadService.downloadExcelPlantilla(entity);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}
