import { Request, Response } from 'express';
import multer from 'multer';
import readXlsxFile from 'read-excel-file/node';
import { AzureStorageService } from './azureStorage.service';
import { ConvertDataService } from './convert-data.service';
import Model from '../db/index';
import { UsuarioService } from './usuario.service';
import { ConfigService } from './config.service';

const upload = multer();

export class UploadService {
  public azureStorageService = new AzureStorageService();
  public convertDataService = new ConvertDataService();
  public userService =  new UsuarioService();
  public exhibicionContraprestada = Model.collection('exhibicion_contraprestada');
  public pocModel = Model.collection('poc');
  public estructuraComercialModel = Model.collection('estructura_comercial');
  public configService =  new ConfigService();
  async uploadFile(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).send('No se subió ningún archivo');
      return;
    }

    const rows: any = await readXlsxFile(req.file.buffer);
    rows.shift();

    res.send('Datos cargados exitosamente');
  }

  async processDataUpload( file: any, entity, typeEntity, user): Promise<any[]> {
    try {
      const usuario = JSON.parse(user);
      if(!usuario) throw new Error('Usuario no encontrado');
        const fileBuffer = file.buffer;
        // const result_value = await this.pocModel.findOne({estado:1,'nombre': item.poc_nombre });
        const configValue = await this.configService.configValues('marca_marca_y_linea_homologadas,skus_linea_homologadas');
        let result = await this.convertDataService.parseExcel(fileBuffer, entity, typeEntity, usuario, configValue);
        let uniquePocs = [...new Set(result.map((item:any) => item.poc_nombre))];
        let pocs: any = [];
        await Promise.all(uniquePocs.map(async (item) => {
          const poc = await this.pocModel.findOne({estado:1,'nombre': item });
          // if (!poc) throw {'validacion': [{observacion: `poc_nombre ${item} no existe en la base de datos`}]};
          pocs.push({
            poc: poc ? poc.poc : null,
            nombre: poc ? poc.nombre : null,
            nombre_planning: poc ? poc.nombre_planning : null,
            tipo: poc ? poc.tipo : null,
            poc_backus: poc ? poc.poc_backus : null,
            poc_cadena: poc ? poc.poc_cadena : null,
            documento_sv: poc ? poc.documento_sv : null,
            nombre_sv: poc ? poc.nombre_sv : null,
            poc_livetrade: poc ? poc.poc_livetrade : null,
            cadena: poc ? poc.cadena : null,
            gerencia: poc ? poc.gerencia : null,
            region: poc ? poc.region : null
          });
        }));
      
        await Promise.all(result.map(async (item) => {
          const poc = pocs.find((poc:any) => poc.nombre === item.poc_nombre);
          item.poc = poc;
          delete item.poc_nombre;
          // item.documento_sv = poc ? poc[0].documento_sv : null;
          // item.nombre_sv = poc ? poc[0].nombre_sv : null;  
        }));

        // console.log(result[0]);
        // await this.etlService.processConsolidadoSKU(entity, result.fechaInicio, result.fechaFin, fecha_desde_norma, fecha_hasta_norma);
        await this.exhibicionContraprestada.insertMany(result);

      return { status: 'success', message: 'Proceso completado con exito.', data: result, } as any;
    } catch (error) {
      throw error;
    }
  }
  
  async actualizarResult(result: any[]){
    try {
      
      for (let i = 0; i < result.length; i++) {
        const result_value = await this.pocModel.findOne({ 'nombre_cadena': result[i].poc_nombre });
        if (result_value) {
          result[i].poc = result_value.id;
        }
      }
      console.log(result); // Aquí puedes ver el arreglo result actualizado
    } catch (error) {
      console.error('Error al buscar y actualizar:', error);
    }
  }

  private async validateUser(user_id){
    // let usuario = null;
    if (user_id == undefined || user_id == null || user_id == '') {
      throw new Error('El usuario_id es requerido');
    }
    const usuario: any = await this.userService.getUsuarioByUserId(user_id);
    return usuario;
  }
}
