import { Request, Response } from 'express';
import { handleHttpError } from '../utils/handleError';
import { UploadService } from '../services/upload.service';

export default class UploadController {
    uploadService = new UploadService();

  constructor() {}

  uploadFile = async (req: Request, res: Response) => {
    try {
      console.log('Datos recibidos para guardar:', JSON.stringify(req.body)); // Log para verificar los datos recibidos
      await this.uploadService.uploadFile(req, res);
      res.send('Datos cargados exitosamente');
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  };
  processDataUpload = async (req, res) => {
    const file = req.file; // Buffer del archivo subido
    const entity = req.body.entity as string | undefined;
    const typeEntity = req.body.typeEntity as string | undefined;
    // const uuid = req.body.uuid as string | undefined;
    const usuario = req.body.usuario as string | undefined;
    // const documento_sv = req.body.documento_sv as string | undefined;
    // const nombre_sv = req.body.nombre_sv as string | undefined;
    try {
        const upload = await this.uploadService.processDataUpload(file, entity, typeEntity, usuario);
        res.status(200).json(upload);
    } catch (error: any) {
      if(error.validacion){
        res.status(400).json(error);        
      }else if(error.duplicados){
        res.status(400).json(error);
      }else{
        handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
      }
        
    }
  }
}