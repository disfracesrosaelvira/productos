import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { ExhibicionAdicionalService } from '../services/exhibicion-adicional.service';
import { ExhibicionCompetenciaService } from '../services/exhibicion-competencia.service';
import { ExhibicionContraprestadaService } from '../services/exhibicion-contraprestada.service';
import { AzureStorageService } from "../services/azureStorage.service";
import multer from 'multer';
import { extname } from 'path';
import { formatISO } from 'date-fns';
import { PocsService } from '../services/pocs.service';

export default class ExhibicionController {
    exhibicionContraprestadaService = new ExhibicionContraprestadaService();
    exhibicionAdicionalService = new ExhibicionAdicionalService();
    exhibicionCompetenciaService = new ExhibicionCompetenciaService();
    public azureStorageService = new AzureStorageService();
    storage = multer.memoryStorage();
    upload = multer({ storage: this.storage });
    pocsService = new PocsService();


  constructor() {}

  /**
   *  Service Exhibicion Contraprestada
   */
  public getExhibicionesContraprestadas = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string;
      const pageSize = req.query.page_size as string;
      const isPaginate = req.query.is_paginate as string;
      const endOfMonth = req.query.endOfMonth as string;
      const startOfMonth = req.query.startOfMonth as string;
      const user_id = req.query.user_id as string;
      const filterTable = req.query.filterTable as string | undefined;
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibicionesContraprestadas(Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id, filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionContraMonthlySupervisorVigenteCounts = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibitionContraMonthlySupervisorVigenteCounts(filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionContraprestadaCountsByTypeMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibitionContraprestadaCountsByTypeMonthAndWeek(filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionContraprestadaCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    try {
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibitionContraprestadaCountsByBrandMonthAndWeek(filterTable, typesExhibitions);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    const marcas = req.query.marcas as string;
    try {
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(filterTable, typesExhibitions, marcas);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  
  public getExhibicionesContraprestadasOffline = async (req: Request, res: Response): Promise<void> => {
    try {
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibicionesContraprestadasOffline();
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibicionesContraprestadasAlertasVigente = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const poc = req.query.poc as string;
      const accion = req.query.accion as string;
      const user_id = req.query.user_id as string ;
      const listContraprestadas = await this.exhibicionContraprestadaService.getExhibicionesContraprestadasAlertasVigente(empresa_id,Number(poc),accion,user_id);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  // public updateExhibicionesContraprestadasVigentes = async (req: Request, res: Response): Promise<void> => {
  //   try {      
  //     const { poc_id } = req.params;
  //     const response = await this.exhibicionContraprestadaService.updateExhibicionesContraprestadasVigentes(Number(poc_id));
  //     res.status(200).json(response);
  //   } catch (error) {
  //     handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
  //   }
  // }
  
  public updateExhibicionesContraprestadas = async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const nameTable = req.body.table as string | undefined;
      let data = req.body.data as string | undefined;
      if (!nameTable || !data) {
        return res.status(400).send("No se ha recibido informacion requerida para Adicionales.");
      }
      let parsedData = JSON.parse(data);
      const save = await this.exhibicionContraprestadaService.updateExhibicionesContraprestadasVigentes(id,parsedData);
      res.status(200).json({
        success: true,
        message: "save successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
    
  };

  /**
   *  Service Exhibicion Adicional
   */
  // saveExhibicionAdicional = async (req: Request, res: Response) => {
  //   try {
  //     const data = req.body;
  //     console.log('Datos recibidos para guardar:', JSON.stringify(data)); // Log para verificar los datos recibidos
  //     const result = await this.exhibicionAdicionalService.saveExhibicionAdicional(data);
  //     res.status(result.error ? 500 : 200).json(result);
  //   } catch (error) {
  //     handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
  //   }
  // };

  public getExhibicionesAdionales = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string ;
      const endOfMonth = req.query.endOfMonth as string ;
      const startOfMonth = req.query.startOfMonth as string ;
      const user_id = req.query.user_id as string ;
      const filterTable = req.query.filterTable as string | undefined;
      const listContraprestadas = await this.exhibicionAdicionalService.getExhibicionesAdionales(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id, filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionAdditionalCountsByTypeMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const listContraprestadas = await this.exhibicionAdicionalService.getExhibitionAdditionalCountsByTypeMonthAndWeek(filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionAdditionalCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    try {
      const listContraprestadas = await this.exhibicionAdicionalService.getExhibitionAdditionalCountsByBrandMonthAndWeek(filterTable, typesExhibitions);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    const marcas = req.query.marcas as string;
    try {
      const listContraprestadas = await this.exhibicionAdicionalService.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(filterTable, typesExhibitions, marcas);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibicionesAdionalesRenovable = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string ;
      const endOfMonth = req.query.endOfMonth as string ;
      const startOfMonth = req.query.startOfMonth as string ;
      const user_id = req.query.user_id as string ;

      const listContraprestadas = await this.exhibicionAdicionalService.getExhibicionesAdionalesRenovable(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibicionesAdionalesRenovableOffline = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.exhibicionAdicionalService.getExhibicionesAdionalesRenovableOffline();
      // res.status(200).json(result);
      // onst result = await this.skuService.saveSku(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibicionesAdionalesVigente = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string;
      const pageSize = req.query.page_size as string;
      const isPaginate = req.query.is_paginate as string;
      const endOfMonth = req.query.endOfMonth as string;
      const startOfMonth = req.query.startOfMonth as string;
      const user_id = req.query.user_id as string;

      const listContraprestadas = await this.exhibicionAdicionalService.getExhibicionesAdionalesVigente(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  getProductoAllAdicional = async (req: Request, res: Response) => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const listProductos = await this.exhibicionAdicionalService.getProductosAllByApp(empresa_id);
      res.status(200).json(listProductos);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public deleteExhibicionAdicional = async (req: any, res: Response) => {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).send("No se ha recibido informacion requerida para Adicionales.");
      }
      await this.exhibicionAdicionalService.deleteExhibicionAdicional(id);
      res.status(200).json({
        success: true,
        message: "save successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
    
  };

  public updateExhibicionAdicional = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (data.offline == 1) {
        // haciendo esto por si algun usuario no actualizo la pagina web en su celular
        data.fecha_ultimo_relevo = data.fecha_ultimo_relevo ? new Date(data.fecha_ultimo_relevo) : new Date(new Date().toUTCString());
      } else {
        data.fecha_ultimo_relevo = new Date(new Date().toUTCString());
      }
      const result = await this.exhibicionAdicionalService.updateExhibicionAdicional(id, data);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  /**
   *  Service Exhibicion Competencia
   */
  saveExhibicionCompetencia = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.exhibicionCompetenciaService.saveExhibicionCompetencia(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  
  public getExhibicionesCompetencia = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string ;
      const endOfMonth = req.query.endOfMonth as string ;
      const startOfMonth = req.query.startOfMonth as string ;
      const user_id = req.query.user_id as string;
      const filterTable = req.query.filterTable as string | undefined;
      const listContraprestadas = await this.exhibicionCompetenciaService.getExhibicionesCompetencia(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id, filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionCompetenciaCountsByTypeMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    try {
      const listContraprestadas = await this.exhibicionCompetenciaService.getExhibitionCompetenciaCountsByTypeMonthAndWeek(filterTable);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionCompetenciaCountsByBrandMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    try {
      const listContraprestadas = await this.exhibicionCompetenciaService.getExhibitionCompetenciaCountsByBrandMonthAndWeek(filterTable, typesExhibitions);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek = async (req: Request, res: Response): Promise<void> => {
    const filterTable = req.query.filterTable as string;
    const typesExhibitions = req.query.typesExhibitions as string;
    const marcas = req.query.marcas as string;
    try {
      const listContraprestadas = await this.exhibicionCompetenciaService.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(filterTable, typesExhibitions, marcas);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public getExhibicionesCompetenciaVigente = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string ;
      const endOfMonth = req.query.endOfMonth as string ;
      const startOfMonth = req.query.startOfMonth as string ;
      const user_id = req.query.user_id as string ;

      const listContraprestadas = await this.exhibicionCompetenciaService.getExhibicionesCompetenciaVigente(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  public getExhibicionesCompetenciaRenovable = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const poc = req.query.poc as string;
      const pageIndex = req.query.page_index as string ;
      const pageSize = req.query.page_size as string ;
      const isPaginate = req.query.is_paginate as string ;
      const endOfMonth = req.query.endOfMonth as string ;
      const startOfMonth = req.query.startOfMonth as string ;
      const user_id = req.query.user_id as string ;

      const listContraprestadas = await this.exhibicionCompetenciaService.getExhibicionesCompetenciaRenovable(empresa_id, Number(poc), Number(pageIndex), Number(pageSize), isPaginate === 'true',startOfMonth,endOfMonth,user_id);
      res.status(200).json(listContraprestadas);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  public getExhibicionesCompetenciaRenovableOffline = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.exhibicionCompetenciaService.getExhibicionesCompetenciaRenovableOffline();
      // res.status(200).json(listContraprestadas);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  getProductoAllCompetencia = async (req: Request, res: Response) => {
    try {
      const empresa_id = req.query.empresa_id as string ;
      const listProductos = await this.exhibicionCompetenciaService.getProductosAllByApp(empresa_id);
      res.status(200).json(listProductos);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }

  public deleteExhibicionCompetencia = async (req: any, res: Response) => {
    try {
      const { id } = req.query;
      await this.exhibicionCompetenciaService.deleteExhibicionCompetencia(id);
      res.status(200).json({
        success: true,
        message: "save successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }   
  };

  public updateExhibicionCompetencia = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (data.offline == 1) {
        // haciendo esto por si algun usuario no actualizo la pagina web en su celular
        data.fecha_ultimo_relevo = data.fecha_ultimo_relevo ? new Date(data.fecha_ultimo_relevo) : new Date(new Date().toUTCString());
      } else {
        data.fecha_ultimo_relevo = new Date(new Date().toUTCString());
      }
      const result = await this.exhibicionCompetenciaService.updateExhibicionCompetencia(id, data);
      res.status(200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  public uploadFile = async (req: any, res: Response) => {
    try {
      const nameTable = req.body.table as string | undefined;
      const uuid = req.body.uuid as string | undefined;
      const nameContainer = req.body.nameContainer as string | undefined;
      let data = req.body.data as string | undefined;
      if (!req.file) {
        return res.status(400).send("No se ha recibido ningún archivo.");
      }
      if (!nameTable || !uuid || !data || !nameContainer) {
        return res.status(400).send("No se ha recibido informacion requerida.");
      }
      const image = req.file;
      const image_utf8 = Buffer.from(image.originalname, "latin1")
        .toString("utf8")
        .normalize();
      const nameFile = `photo-${nameTable}-${uuid}${extname(image_utf8)}`;
      
      let fileUrl: any = "";
      try {
        fileUrl = await this.azureStorageService.uploadFile(
          `${nameContainer}` ,
          image,
          nameFile
        );
      } catch (error) {
        console.error("Error input storage: ", error, "at");
      }
      const formatExcelUrl = `${fileUrl.split("?")[0]}`;
      let parsedData = JSON.parse(data);
      if (parsedData && typeof parsedData === 'object') {
        const nowUTC = new Date();
        parsedData.nameFile = nameFile;
        parsedData.nameContainer = nameContainer;
        parsedData.imgUrl = formatExcelUrl;
        parsedData.created_at = new Date();
      }

      res.status(200).json({
        success: true,
        message: "photo uploaded successfully.",
         data:parsedData
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
  };
  saveExhibicion= async (req: any, res: Response) => {
    try {
      const nameTable = req.body.table as string | undefined;
      let data = req.body.data as string | undefined;
      if (!nameTable || !data) {
        return res.status(400).send("No se ha recibido informacion requerida para Adicionales.");
      }
      let parsedData = JSON.parse(data);
      const save = await this.exhibicionAdicionalService.saveExhibicion(nameTable, parsedData);

      res.status(200).json({
        success: true,
        message: "save successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
  };

  removeFileAzure= async (req: any, res: Response) => {
    try {
      const nameFile = req.params.app as string | undefined;
      const containerName = req.params.containerName as string | undefined;
      if (!nameFile || !containerName) {
        return res.status(400).send("No se ha recibido informacion requerida para Adicionales.");
      }
      // remove file azure
      // await this.azureStorageService.deleteFile(nameFile, containerName);
      res.status(200).json({
        success: true,
        message: "save successfully."
      });
    } catch (error) {
      handleHttpError(
        res,
        error instanceof Error
          ? error.message
          : "Se produjo un error desconocido"
      );
    }
  };

  // filtros start
  public getFiltersAdicional = async (req: Request, res: Response): Promise<void> => {
    try {
      const startOfMonth = req.query.startOfMonth as string ;
      const endOfMonth = req.query.endOfMonth as string;
      const filters = await this.exhibicionAdicionalService.getFiltersAdicional(startOfMonth, endOfMonth);
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  public getFiltersCompetencia = async (req: Request, res: Response): Promise<void> => {
    try {
      const startOfMonth = req.query.startOfMonth as string ;
      const endOfMonth = req.query.endOfMonth as string;
      const filters = await this.exhibicionCompetenciaService.getFiltersCompetencia(startOfMonth, endOfMonth);
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  public getFiltersContraprestada = async (req: Request, res: Response): Promise<void> => {
    try {
      const startOfMonth = req.query.startOfMonth as string ;
      const endOfMonth = req.query.endOfMonth as string;
      const filters = await this.exhibicionContraprestadaService.getFiltersContraprestada(startOfMonth, endOfMonth);
      res.status(200).json(filters);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  // filtros end

  exhibicionesContraprestadasBullUpload = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const result = await this.exhibicionContraprestadaService.exhibicionesContraprestadasBullUpload(data);
      res.status(result.error ? 500 : 200).json(result);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };

  exhibicionesContraprestadaValidateRecordsDatabse = async (req: Request, res: Response) => {
    try {
      const file = req.file
      const result = await this.exhibicionContraprestadaService.exhibicionesContraprestadaValidateRecordsDatabse(file);
      res.status(200).json(result);
    } catch (error: any) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');      
    }
  };
}