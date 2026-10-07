import Model from '../db/index';
import formatDate from '../utils/util';
import Constantes from '../utils/constant';
import { AzureStorageService } from './azureStorage.service';
import { ADLS_SAS_TOKEN_USER } from '../config';
import { subHours, getISOWeek } from 'date-fns';
import { UsuarioService } from './usuario.service';
import { PocsService } from './pocs.service';
import filterDateRange from '../utils/filterDateRange';
import { ExhibicionCompetenciaModel } from '../models/exhibicionCompetencia.model';
import { ExhibicionAdicionalModel } from '../models/exhibicionAdicional.model';
import { ExhibicionContraprestadaModel } from '../models/exhibicionContraprestada.model';
import { PrecioModel } from '../models/precio.model';
import { FrenteModel } from '../models/frente.model';
import { StockModel } from '../models/stock.model';
import * as fs from 'fs';
import * as path from 'path';
import { ObjectId } from 'mongodb';
const XLSX = require('xlsx');

interface JsonDataPrice {
  'Precio ID': any;
  'SKU-Marca': any;
  'SKU-Descripción': any;
  'SKU-Precio Regular': any;
  'SKU-Mec. Promocional': any;
  'SKU-Precio Promocional': any;
  'SKU-Precio Adicional': any;
  'SKU-Imagen': any;
  Latitud: any;
  Longitud: any;
  'POC': any;
  'POC Nombre': any;
  'Documento SV': any;
  'Nombre SV': any;
  'Empresa ID': any;
  'Usuario ID': any;
  'Nombre Usuario': any;
  'Fecha Creacion': string;
  'Offline': number;
}

interface JsonDataFrente {
  'Frente ID': any;
  Total: any;
  Latitud: any;
  Longitud: any;
  [key: string]: any; // Permite propiedades adicionales dinámicas
}

interface JsonDataStock {
  [key: string]: any;
}

export class DownloadService {
  public azureStorageService = new AzureStorageService();
  precio = Model.collection('precio');
  exhibicionAdicional = Model.collection('exhibicion_adicional');
  exhibicionCompetencia = Model.collection('exhibicion_competencia');
  exhibicionContraprestada = Model.collection('exhibicion_contraprestada');
  frente = Model.collection('frente');
  incidencia_competencia = Model.collection('incidencia_competencia');
  incidencia_mueble_asignacion = Model.collection('incidencia_mueble_asignacion');
  incidencia_mueble_mantenimiento = Model.collection('incidencia_mueble_mantenimiento');
  incidencia_mueble_recojo = Model.collection('incidencia_mueble_recojo');
  stock = Model.collection('stock');
  sku = Model.collection('sku');
  poc = Model.collection('poc');
  usuario = Model.collection('usuario');
  estructura_comercial = Model.collection('estructura_comercial');
  public userService =  new UsuarioService();
  public pocService =  new PocsService();

  // async generateBackup(collectionName: string): Promise<any[]> {
  //   try {
  //     // Verificar que la colección existe antes de intentar acceder
  //     const collection = Model.collection(collectionName);
  //     if (!collection) {
  //       throw new Error(`La colección ${collectionName} no existe`);
  //     }
      
  //     // Obtener todos los documentos de la colección
  //     const data = await collection.find({}).toArray();
  //     return data;
  //   } catch (error) {
  //     console.error(`Error generando backup para ${collectionName}:`, error);
  //     throw error;
  //   }
  // }
  async generateBackup(collectionName: string): Promise<Buffer> {
    try {
      // Verificar que la colección existe
      const collection = Model.collection(collectionName);
      if (!collection) {
        throw new Error(`La colección ${collectionName} no existe`);
      }
      
      // Obtener todos los documentos
      const documents = await collection.find({}).toArray();
      
      // Función para transformar documentos y preservar tipos
      function transformDocument(doc: any): any {
        const result: any = {};
        
        for (const [key, value] of Object.entries(doc)) {
          if (value instanceof ObjectId) {
            result[key] = { $oid: value.toString() };
          } else if (value instanceof Date) {
            result[key] = { $date: value.toISOString() };
          } else if (value === null) {
            result[key] = null;
          } else if (Array.isArray(value)) {
            result[key] = value.map(item => 
              typeof item === 'object' && item !== null ? transformDocument(item) : item
            );
          } else if (typeof value === 'object' && value !== null) {
            result[key] = transformDocument(value);
          } else {
            result[key] = value;
          }
        }
        
        return result;
      }
      
      // Transformar documentos para preservar tipos
      const transformedDocuments = documents.map(doc => transformDocument(doc));
      
      // Convertir a JSON con formato y luego a Buffer
      const jsonData = JSON.stringify(transformedDocuments, null, 2);
      return Buffer.from(jsonData, 'utf-8');
    } catch (error) {
      console.error(`Error generando backup para ${collectionName}:`, error);
      throw error;
    }
  }
  
  async downloadExcelFileAdicional(startOfMonth:string, endOfMonth:string, user_id: string, filterTable: string | undefined): Promise<void> {
      try {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(startOfMonth, endOfMonth);
        let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date } };
        if (!user_id) {
          throw new Error('El usuario_id es requerido');
        }
        const usuario: any = await this.userService.getUsuarioByUserId(user_id);
        // if (usuario.rol == 'supervisor') {
        //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
        //   query['poc.poc'] = { $in: pocs };
        // }
        if (usuario.rol == 'bdr') {
          query['usuario.usuario_id'] = user_id;
        }
        if (filterTable) {
          const filters = JSON.parse(filterTable);
          filters.forEach((filter: { key: string, values: string[] }) => {
            query[filter.key] = { $in: filter.values };
          });
        }

        const data = await this.exhibicionAdicional.find(query).sort({fecha_creacion: -1}).toArray();
        const formattedData = data.map((item:any) => ({
          ...item,
          fecha_inicio_vigencia: formatDate(item.fecha_inicio_vigencia,false),
          fecha_fin_vigencia: formatDate(item.fecha_fin_vigencia,false),
          fecha_eliminacion: item.fecha_eliminacion ? formatDate(subHours(item.fecha_eliminacion, 5), true) : null,
          // skus: item.skus.map(producto => producto.descripcion).join(', '),
          // imagenes: item.imagenes.map(img => `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`).join(', '),
          fecha_creacion: formatDate(subHours(item.fecha_creacion, 5), true),
          numero_semana_creacion: getISOWeek(subHours(item.fecha_creacion, 5))
        }));

        const numberImagenes: number[] = []; // el registrar el numero de imagenes de cada validacion
        data.forEach(element => {
          let numberImagesValidaciones = 0;
          element.validaciones.forEach(validacion => {
            numberImagesValidaciones += validacion.imagenes.length;
          });
          numberImagenes.push(numberImagesValidaciones)
        });
        const maxImages = Math.max(...numberImagenes);
        const maxValidations = Math.max(...data.map(doc => doc.validaciones.length));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);
        const validationKeys = Array.from({ length: maxValidations }, (_, index) => `Comentario ${index + 1}`);

        let jsonData: any = [];
        formattedData.forEach((doc) => {
          let imagenes: { [key: string]: string } = {};
          let comentarios: { [key: string]: string } = {};
          let index = 0;
          doc.validaciones.forEach((validacion: any, i: number) => {
            if(i < maxValidations) {
              comentarios[`Comentario ${i + 1}`] = `${validacion.comentario}`;
            }
            validacion.imagenes.forEach(img => {
              if(index < maxImages) {
                imagenes[`Imagen ${index + 1}`] = `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`;
              }
              index++;
            });
          });
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          validationKeys.forEach(key => {
            if (!(key in comentarios)) {
              comentarios[key] = ''; // O algún valor predeterminado si no hay Comentario
            }
          });
          doc.skus.forEach(element => {
            jsonData.push({
              '_id': doc._id.toString(),       
              'Zona': doc.zona,
              'Tipo Exhibicion': doc.tipo_exhibicion,
              'Fecha Ini. Vige.': doc.fecha_inicio_vigencia,
              'Fecha Fin Vige.': doc.fecha_fin_vigencia,
              // 'Productos': doc.skus,
              'sku_descripción': element.descripcion,
              'sku_marca': element.marca,
              'Latitud' : doc.latitud,
              'Logitud' : doc.longitud,
              'Cantidad' : doc.cantidad,
              'Nombre Cadena': doc.poc.cadena,
              'POC' : doc.poc.poc,
              'POC Nombre': doc.poc.nombre,
              'POC Backus': doc.poc?.poc_backus,
              'POC Tipo': doc.poc?.tipo,
              'POC Livetrade': doc.poc?.poc_livetrade,
              'POC Cadena': doc.poc?.poc_cadena,
              'Documento SV   ': doc.poc?.documento_sv,
              'Nombre SV   ': doc.poc?.nombre_sv,
              'Empresa ID' : doc.empresa_id,
              'Usuario ID' : doc.usuario?.usuario_id,
              'Nombre Usuario': doc.usuario?.nombre,
              ...imagenes,
              ...comentarios,
              'Fecha Creación': doc.fecha_creacion,
              'Fecha Eliminación': doc.fecha_eliminacion,
              'Offline': doc?.offline ? doc?.offline : 0,
              'Numero semana creación': doc?.numero_semana_creacion,
              'Fecha del Ultimo Relevo': doc.fecha_ultimo_relevo ? formatDate(subHours(doc.fecha_ultimo_relevo, 5), true) : null,
              'Tiene Mueble': doc?.tipo_mueble === 1 ? 'Verdadero' : doc?.tipo_mueble === 0 ? 'Falso' : '-',
            })
          });
        });

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
    
        return buffer;
      } catch (err) {
          console.error('Error exporting data:', err);
          throw err;
      }
  };

  async downloadExcelFileContraprestada(startOfMonth:string, endOfMonth:string, user_id: string, filterTable: string | undefined): Promise<void> {
      try {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(startOfMonth, endOfMonth);
        let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date } };
        if (!user_id) {
          throw new Error('El usuario_id es requerido');
        }
        const usuario: any = await this.userService.getUsuarioByUserId(user_id);
        // if (usuario.rol == 'supervisor') {
        //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
        //   query['poc.poc'] = { $in: pocs };
        // }
        if (usuario.rol == 'bdr') {
          query['usuario.usuario_id'] = user_id;
        }
        if (filterTable) {
          const filters = JSON.parse(filterTable);
          filters.forEach((filter: { key: string, values: string[] }) => {
            query[filter.key] = { $in: filter.values };
          });
        }

        const data = await this.exhibicionContraprestada.find(query).sort({fecha_creacion: -1}).toArray();
        const formattedData:any = data.map((item:any) => ({
          ...item,
          fecha_inicio: formatDate(item.fecha_inicio,false),
          fecha_fin: formatDate(item.fecha_fin,false), 
          fecha_creacion: formatDate(subHours(item.fecha_creacion, 5), true),
          // validaciones:item?.validaciones?.map(
          //   (v:any) => ({...v,imagenes:v?.imagenes?.map(img => `${img.url}?${ADLS_SAS_TOKEN_USER}`).join('; ')})
          // ),
          numero_semana_creacion: getISOWeek(subHours(item.fecha_creacion, 5))
        }));

        const numberImagenes: number[] = []; // el registrar el numero de imagenes de cada validacion
        data.forEach(element => {
          let numberImagesValidaciones = 0;
          if (element.hasOwnProperty('validaciones')) {
            element.validaciones.forEach(validacion => {
              numberImagesValidaciones += validacion.imagenes.length;
            });
          }
          numberImagenes.push(numberImagesValidaciones)
        });
        const maxImages = Math.max(...numberImagenes);
        const maxValidations = Math.max(...data.map(doc => doc.hasOwnProperty('validaciones') ? doc.validaciones.length : 0));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);
        const validationKeys = Array.from({ length: maxValidations }, (_, index) => `Comentario ${index + 1}`);

        // const convertData = (formattedData) => {
        //   return formattedData.map(row => {
        //     const { _id, empresa_id, poc, zona,tipo_exhibicion, correlativo,tienda,campaña,marca,skus,vigente,fecha_inicio,fecha_fin,usuario,fecha_creacion,validaciones,offline,vigencia_fecha_inicio,vigencia_fecha_fin,numero_semana_creacion} = row;
        //     const lastRelay = validaciones ? validaciones[validaciones.length - 1] : null;
        //     const baseRow = {
        //       "_id": _id.toString(),
        //       empresa_id,
        //       "POC": poc.poc,
        //       "POC Nombre": poc.nombre,
        //       "POC backus": poc.poc_backus,
        //       "POC Cadena": poc.poc_cadena,
        //       'POC Tipo': poc?.tipo,
        //       'POC Livetrade': poc?.poc_livetrade,
        //       zona,
        //       tipo_exhibicion,
        //       correlativo,
        //       tienda,
        //       campaña,
        //       marca,
        //       skus,
        //       vigente,
        //       fecha_inicio,
        //       fecha_fin,
        //       "Usuario ID": usuario.usuario_id,
        //       "Usuario Nombre": usuario.nombre,
        //       "Documento SV": poc.documento_sv,
        //       "Nombre SV": poc.nombre_sv,
        //       fecha_creacion,
        //       'Offline': offline ? offline : 0,
        //       'Vigencia Fecha Inicio': vigencia_fecha_inicio ? formatDate(vigencia_fecha_inicio, false) : null,
        //       'Vigencia Fecha Fin': vigencia_fecha_fin ? formatDate(vigencia_fecha_fin, false) : null,
        //       'Fecha del Ultimo Relevo': lastRelay ? formatDate(subHours(lastRelay.fecha_creacion, 5), true) : null,
        //       'Numero semana creación': numero_semana_creacion
        //     };
        //     validaciones?.forEach((item, index) => {
        //       baseRow[`comentario[${index}]`] = item.comentario;
        //       baseRow[`comentarios_adicionales[${index}]`] = item.comentarios_adicionales;
        //       baseRow[`imagenes[${index}]`] = item.imagenes;
        //     });
        //     return baseRow;
        //   });
        // };


        let jsonData: any = [];
        formattedData.forEach((doc) => {
          let imagenes: { [key: string]: string } = {};
          let comentarios: { [key: string]: string } = {};
          let index = 0;
          if(doc.hasOwnProperty('validaciones')) {
            doc.validaciones.forEach((validacion: any, i: number) => {
              if(i < maxValidations) {
                comentarios[`Comentario ${i + 1}`] = `${validacion.comentario}`;
              }
              validacion.imagenes.forEach(img => {
                if(index < maxImages) {
                  imagenes[`Imagen ${index + 1}`] = `${img.url}?${ADLS_SAS_TOKEN_USER}`;
                }
                index++;
              });
            });
          }
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          validationKeys.forEach(key => {
            if (!(key in comentarios)) {
              comentarios[key] = ''; // O algún valor predeterminado si no hay Comentario
            }
          });
          jsonData.push({
            "_id": doc._id.toString(),
            "empresa_id": doc.empresa_id,
            'Nombre Cadena': doc.poc.cadena,
            "POC": doc.poc.poc,
            "POC Nombre": doc.poc.nombre,
            "POC backus": doc.poc.poc_backus,
            "POC Cadena": doc.poc.poc_cadena,
            'POC Tipo': doc.poc?.tipo,
            'POC Livetrade': doc.poc?.poc_livetrade,
            'zona': doc.zona,
            'tipo_exhibicion': doc.tipo_exhibicion,
            'correlativo': doc.correlativo,
            'tienda': doc.tienda,
            'campaña': doc.campaña,
            'marca': doc.marca,
            'skus': doc.skus,
            'vigente': doc.vigente,
            'fecha_inicio': doc.fecha_inicio,
            'fecha_fin': doc.fecha_fin,
            "Usuario ID": doc.usuario.usuario_id,
            "Usuario Nombre":doc. usuario.nombre,
            "Documento SV": doc.poc.documento_sv,
            "Nombre SV": doc.poc.nombre_sv,
            'fecha_creacion': doc.fecha_creacion,
            'Offline': doc.offline ? doc.offline : 0,
            'Vigencia Fecha Inicio': doc.vigencia_fecha_inicio ? formatDate(doc.vigencia_fecha_inicio, false) : null,
            'Vigencia Fecha Fin': doc.vigencia_fecha_fin ? formatDate(doc.vigencia_fecha_fin, false) : null,
            'Fecha del Ultimo Relevo': doc.fecha_ultimo_relevo ? formatDate(subHours(doc.fecha_ultimo_relevo, 5), true) : null,
            'Numero semana creación': doc.numero_semana_creacion,
            'Tiene Mueble': doc?.tipo_mueble === 1 ? 'Verdadero' : doc?.tipo_mueble === 0 ? 'Falso' : '-',
            ...imagenes,
            ...comentarios,
          })
        });
        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
        return buffer;
      } catch (err) {
          console.error('Error exporting data:', err);
          throw err;
        }
  };
  
  async downloadExcelFileCompetencia(startOfMonth:string, endOfMonth:string, user_id: string, filterTable: string | undefined): Promise<void> {
      try {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(startOfMonth, endOfMonth);
        let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date } };
        if (!user_id) {
          throw new Error('El usuario_id es requerido');
        }
        const usuario: any = await this.userService.getUsuarioByUserId(user_id);
        // if (usuario.rol == 'supervisor') {
        //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
        //   query['poc.poc'] = { $in: pocs };
        // }
        if (usuario.rol == 'bdr') {
          query['usuario.usuario_id'] = user_id;
        }
        if (filterTable) {
          const filters = JSON.parse(filterTable);
          filters.forEach((filter: { key: string, values: string[] }) => {
            query[filter.key] = { $in: filter.values };
          });
        }

        const data = await this.exhibicionCompetencia.find(query).sort({fecha_creacion: -1}).toArray();
        const formattedData = data.map((item:any) => ({
          ...item,
          fecha_inicio_vigencia: formatDate(item.fecha_inicio_vigencia,false),
          fecha_fin_vigencia: formatDate(item.fecha_fin_vigencia,false),
          fecha_eliminacion: item.fecha_eliminacion ? formatDate(subHours(item.fecha_eliminacion, 5), true) : null,
          // skus: item.skus.map(producto => producto.descripcion).join(', '),
          fecha_creacion: formatDate(subHours(item.fecha_creacion, 5), true),
          numero_semana_creacion: getISOWeek(subHours(item.fecha_creacion, 5))
        }));
        const numberImagenes: number[] = []; // el registrar el numero de imagenes de cada validacion
        data.forEach(element => {
          let numberImagesValidaciones = 0;
          element.validaciones.forEach(validacion => {
            numberImagesValidaciones += validacion.imagenes.length;
          });
          numberImagenes.push(numberImagesValidaciones)
        });
        const maxImages = Math.max(...numberImagenes);
        const maxValidations = Math.max(...data.map(doc => doc.validaciones.length));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);
        const validationKeys = Array.from({ length: maxValidations }, (_, index) => `Comentario ${index + 1}`);

        let jsonData: any = [];
        formattedData.forEach((doc) => {
          let imagenes: { [key: string]: string } = {};
          let comentarios: { [key: string]: string } = {};
          let index = 0;
          doc.validaciones.forEach((validacion: any, i: number) => {
            if(i < maxValidations) {
              comentarios[`Comentario ${i + 1}`] = `${validacion.comentario}`;
            }
            validacion.imagenes.forEach(img => {
              if(index < maxImages) {
                imagenes[`Imagen ${index + 1}`] = `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`;
              }
              index++;
            });
          });
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          validationKeys.forEach(key => {
            if (!(key in comentarios)) {
              comentarios[key] = ''; // O algún valor predeterminado si no hay Comentario
            }
          });
          doc.skus.forEach(element => {
            jsonData.push({
              '_id': doc._id.toString(),        
              'Zona': doc.zona,
              'Tipo Exhibicion': doc.tipo_exhibicion,
              'Fecha Ini. Vige.': doc.fecha_inicio_vigencia,
              'Fecha Fin Vige.': doc.fecha_fin_vigencia,
              'sku_descripción': element.descripcion,
              'sku_marca': element.marca,
              // 'Productos': doc.skus,
              'Latitud' : doc.latitud,
              'Longitud' : doc.longitud,
              'Cantidad' : doc.cantidad,
              'Nombre Cadena': doc.poc.cadena,
              'POC' : doc.poc.poc,
              'POC Nombre': doc.poc.nombre,
              'POC Backus': doc.poc.poc_backus,
              'POC Cadena': doc.poc.poc_cadena,
              'POC Tipo': doc.poc?.tipo,
              'POC Livetrade': doc.poc?.poc_livetrade,
              'Documento SV   ': doc.poc.documento_sv,
              'Nombre SV   ': doc.poc.nombre_sv,
              'Empresa ID' : doc.empresa_id,
              'Usuario ID' : doc.usuario.usuario_id,
              'Nombre Usuario': doc.usuario.nombre,
              ...imagenes,
              ...comentarios,
              'Fecha Creación': doc.fecha_creacion,
              'Offline': doc?.offline ? doc?.offline : 0,
              'Numero semana creación': doc?.numero_semana_creacion,
              'Fecha del Ultimo Relevo': doc.fecha_ultimo_relevo ? formatDate(subHours(doc.fecha_ultimo_relevo, 5), true) : null,
            });
          })
        });  

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
    
        return buffer;
      } catch (err) {
        console.error('Error exporting data:', err);
        throw err;
      }
  };

  async downloadExcelFileFrente(user_id: string, filterStartDate: string, filterEndDate: string): Promise<void> {
      try {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
        let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date }};
        if (!user_id) {
          throw new Error('El usuario_id es requerido');
        }

        const usuario: any = await this.userService.getUsuarioByUserId(user_id);
        // if (usuario.rol == 'supervisor') {
        //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
        //   query['poc.poc'] = { $in: pocs };
        // }
        if (usuario.rol == 'bdr') {
          query['usuario.usuario_id'] = user_id;
        }

        const data = await this.frente.find(query).sort({fecha_creacion: -1}).toArray();
        
        const maxImages = Math.max(...data.map(doc => doc.imagenes.length));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);

        let jsonData: JsonDataFrente[] = [];
        
        data.forEach((doc) => {
          let imagenes: { [key: string]: string } = {};
          doc.imagenes.forEach((img: { imagen_url: string }, index: number) => {
            if (index < maxImages) {
              imagenes[`Imagen ${index + 1}`] = `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`;
            }
          });
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          doc.skus.forEach(element => {
            jsonData.push({
              'Frente ID': doc.frente_id,
              'SKU-Linea': element.linea,
              'SKU-Marca': element.marca,
              'SKU-cantidad': element.cantidad,
              'Total': doc.frente_total,
              'Total Cerveza': doc.total_cerveza,
              'Latitud': doc.latitud,
              'Longitud': doc.longitud,
              ...imagenes,
              'POC': doc.poc.poc,
              'POC Nombre': doc.poc.nombre,
              'Documento SV': doc.poc.documento_sv,
              'Nombre SV': doc.poc.nombre_sv,
              'Empresa ID': doc.empresa_id,
              'Usuario ID': doc.usuario.usuario_id,
              'Nombre Usuario': doc.usuario.nombre,
              'Fecha Creacion': formatDate(subHours(doc.fecha_creacion, 5), true),
              'Offline': doc?.offline ? doc?.offline : 0
            })
          });
        })     
        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
    
        return buffer;
      } catch (err) {
          console.error('Error exporting data:', err);
          throw err;
      }
  };

  async downloadExcelFilePrecio(user_id: string, filterStartDate: string, filterEndDate: string): Promise<void> {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
      let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date }};
      if (!user_id) {
        throw new Error('El usuario_id es requerido');
      }
      const usuario: any = await this.userService.getUsuarioByUserId(user_id);
      // if (usuario.rol == 'supervisor') {
      //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
      //   query['poc.poc'] = { $in: pocs };
      // }
      if (usuario.rol == 'bdr') {
        query['usuario.usuario_id'] = user_id;
      }
      const data = await this.precio.find(query).sort({fecha_creacion: -1}).toArray();
      let jsonData: JsonDataPrice[] = [];
      data.forEach((doc) => {
        doc.skus.forEach((element: any) => {
          jsonData.push({
            'Precio ID': doc.precio_id,
            'SKU-Marca': element.marca,
            'SKU-Descripción': element.descripcion,
            'SKU-Precio Regular': element.pvp_regular,
            'SKU-Mec. Promocional': element.selected_mecanica,
            'SKU-Precio Promocional': element.pvp_promocional,
            'SKU-Precio Adicional': element.pvp_adicional,
            'SKU-Imagen': `${element.imagen_url}?${ADLS_SAS_TOKEN_USER}`,
            'Latitud': doc.latitud,
            'Longitud': doc.longitud,
            'POC': doc.poc.poc,
            'POC Nombre': doc.poc.nombre,
            'Documento SV': doc.poc.documento_sv,
            'Nombre SV': doc.poc.nombre_sv,
            'Empresa ID': doc.empresa_id,
            'Usuario ID': doc.usuario.usuario_id,
            'Nombre Usuario': doc.usuario.nombre,
            'Fecha Creacion': formatDate(subHours(doc.fecha_creacion, 5), true),
            'Offline': doc?.offline ? doc?.offline : 0
          })
        })
      })      
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
        console.error('Error exporting data:', err);
        throw err;
    }
  };

  async downloadExcelFileIncidences(type: string, user_id: string, filterStartDate: string, filterEndDate: string): Promise<void> {
    try {
      let jsonData;

      const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);

      let query = { fecha_creacion: { $gte : adjusted_start_date, $lte:adjusted_end_date }};
      if (!user_id) {
        throw new Error('El usuario_id es requerido');
      }
      const usuario: any = await this.userService.getUsuarioByUserId(user_id);
      // if (usuario.rol == 'supervisor') {
      //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
      //   query['poc.poc'] = { $in: pocs };
      // }
      if (usuario.rol == 'bdr') {
        query['usuario.usuario_id'] = user_id;
      }

      if (type === 'competencia') {
        const data = await this.incidencia_competencia.find(query).sort({fecha_creacion: -1}).toArray();
        const maxImages = Math.max(...data.map(doc => doc.imagenes.length));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);

        jsonData = data.map((doc) => {
          let imagenes: { [key: string]: string } = {};
          doc.imagenes.forEach((img: { imagen_url: string }, index: number) => {
            if (index < maxImages) {
              imagenes[`Imagen ${index + 1}`] = `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`;
            }
          });
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          return {
            '_id': doc._id.toString(),        
            'Tipo': doc.tipo,
            'Marca': doc.marca,
            ...imagenes,
            'Latitud': doc.latitud,
            'Longitud': doc.longitud,
            'POC': doc.poc.poc,
            'POC Nombre': doc.poc.nombre,
            'POC Backus': doc.poc.poc_backus,
            'POC Cadena': doc.poc.poc_cadena,
            'Documento SV': doc.poc.documento_sv,
            'Nombre SV': doc.poc.nombre_sv,
            'Empresa ID': doc.empresa_id,
            'User ID': doc.usuario.usuario_id,
            'Nombre Usuario': doc.usuario.nombre,
            'Fecha Creacion': formatDate(subHours(doc.fecha_creacion, 5), true),
            'Offline': doc?.offline ? doc?.offline : 0
          }
        });
      } else if (type === 'mueble-asignacion') {
        const data = await this.incidencia_mueble_asignacion.find(query).sort({fecha_creacion: -1}).toArray();
        jsonData = data.map((doc) => {
          return {
            '_id': doc._id.toString(),        
            'Marca': doc.marca,
            'Tipo Mueble': doc.tipo_mueble,
            'Latitud': doc.latitud,
            'Longitud': doc.longitud,
            'POC': doc.poc.poc,
            'POC Nombre': doc.poc.nombre,
            'POC Backus': doc.poc.poc_backus,
            'POC Cadena': doc.poc.poc_cadena,
            'Documento SV': doc.poc.documento_sv,
            "Nombre SV": doc.poc.nombre_sv,
            'Empresa ID': doc.empresa_id,
            'User ID': doc.usuario.usuario_id,
            'Nombre Usuario': doc.usuario.nombre,
            'Fecha Creacion': formatDate(subHours(doc.fecha_creacion, 5), true),
            'Offline': doc?.offline ? doc?.offline : 0
          }
        });
      } else if (type === 'mueble-mantenimiento') {
        const data = await this.incidencia_mueble_mantenimiento.find(query).sort({fecha_creacion: -1}).toArray();
        const maxImages = Math.max(...data.map(doc => doc.imagenes.length));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);
        jsonData = data.map((doc) => {
          let imagenes: { [key: string]: string } = {};
          doc.imagenes.forEach((img: { imagen_url: string }, index: number) => {
            if (index < maxImages) {
              imagenes[`Imagen ${index + 1}`] = `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`;
            }
          });
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          return {
            '_id': doc._id.toString(),      
            'Marca': doc.marca,
            'Tipo Mueble': doc.tipo_mueble,
            'Tipo Mantenimiento': doc.tipo_mantenimiento,
            ...imagenes,
            'Latitud': doc.latitud,
            'Longitud': doc.longitud,
            'POC': doc.poc.poc,
            'POC Nombre': doc.poc.nombre,
            'POC Backus': doc.poc.poc_backus,
            'POC Cadena': doc.poc.poc_cadena,
            'Documento SV': doc.poc.documento_sv,
            'Nombre SV': doc.poc.nombre_sv,
            'Empresa ID': doc.empresa_id,
            'User ID': doc.usuario.usuario_id,
            'Nombre Usuario': doc.usuario.nombre,
            'Fecha Creacion': formatDate(subHours(doc.fecha_creacion, 5), true),
            'Offline': doc?.offline ? doc?.offline : 0
          }
        });
      } else {
        const data = await this.incidencia_mueble_recojo.find(query).sort({fecha_creacion: -1}).toArray();
        const maxImages = Math.max(...data.map(doc => doc.imagenes.length));
        const imageKeys = Array.from({ length: maxImages }, (_, index) => `Imagen ${index + 1}`);
        jsonData = data.map((doc) => {
          let imagenes: { [key: string]: string } = {};
          doc.imagenes.forEach((img: { imagen_url: string }, index: number) => {
            if (index < maxImages) {
              imagenes[`Imagen ${index + 1}`] = `${img.imagen_url}?${ADLS_SAS_TOKEN_USER}`;
            }
          });
        
          // Asegurarse de que todas las claves de imágenes estén presentes
          imageKeys.forEach(key => {
            if (!(key in imagenes)) {
              imagenes[key] = ''; // O algún valor predeterminado si no hay imagen
            }
          });
          return {
            '_id': doc._id.toString(),        
            'Marca': doc.marca,
            'Tipo Mueble': doc.tipo_mueble,
            'Motivo Recojo': doc.motivo_recojo,
            ...imagenes,
            'Latitud': doc.latitud,
            'Longitud': doc.longitud,
            'POC': doc.poc.poc,
            'POC Nombre': doc.poc.nombre,
            'POC Backus': doc.poc.poc_backus,
            'POC Cadena': doc.poc.poc_cadena,
            'Documento SV': doc.poc.documento_sv,
            'Nombre SV': doc.poc.nombre_sv,
            'Empresa ID': doc.empresa_id,
            'User ID': doc.usuario.usuario_id,
            'Nombre Usuario': doc.usuario.nombre,
            'Fecha Creacion': formatDate(subHours(doc.fecha_creacion, 5), true),
            'Offline': doc?.offline ? doc?.offline : 0
          }
        });
      }         
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  };

  async downloadExcelFileStock(user_id: string, filterStartDate: string, filterEndDate: string): Promise<void> {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
      let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date }};
      if (!user_id) {
        throw new Error('El usuario_id es requerido');
      }
      const usuario: any = await this.userService.getUsuarioByUserId(user_id);
      // if (usuario.rol == 'supervisor') {
      //   const pocs = await this.pocService.getPocByDocumentoSv(user_id);
      //   query['poc.poc'] = { $in: pocs };
      // }
      if (usuario.rol == 'bdr') {
        query['usuario.usuario_id'] = user_id;
      }

      const data = await this.stock.find(query).sort({fecha_creacion: -1}).toArray();
      let jsonData:JsonDataStock [] = [];
      data.forEach(doc => {
        doc.skus.forEach(element => {
          jsonData.push({
            'Stock ID': doc.stock_id,
            'SKU-Descripción': element.descripcion,
            'SKU-Gondola Stock': element.gondola_stock,
            'SKU-Exhibiciones Stock': element.exhibicion_stock,
            'Latitud': doc.latitud,
            'Longitud': doc.longitud,
            'POC': doc.poc.poc,
            'POC Nombre': doc.poc.nombre,
            'Documento SV': doc.poc.documento_sv,
            'Nombre SV': doc.poc.nombre_sv,
            'Empresa ID': doc.empresa_id,
            'Usuario ID': doc.usuario.usuario_id,
            'Nombre Usuario': doc.usuario.nombre,
            'Fecha Creación': formatDate(subHours(doc.fecha_creacion, 5), true),
            'Offline': doc?.offline ? doc?.offline : 0
          })
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  };

  async downloadExcelFileSku(): Promise<void> {
    try {
      let query = {};
      const data = await this.sku.find(query).sort({fecha_creacion: -1}).toArray();
      const jsonData = data.map((doc) => ({            
        'Sku': doc.sku,
        'Descripción': doc.descripcion,
        'Categoria': doc.categoria,
        'Linea': doc.linea,
        'Marca': doc.marca,
        'Imagen': `${doc.imagen}?${ADLS_SAS_TOKEN_USER}`,
        'Empresa Id': doc.empresa_id,
        'Estado': doc.estado ? 'Activo' : 'Inactivo',
        'Competencia': doc.competencia ? 'Competencia' : 'No Competencia',
        'Usuario ID Creacion': doc.usuario_id_creacion,
        'usuario ID Actualizacion': doc.usuario_id_actualizacion,
        'Fecha Creación': formatDate(subHours(doc.fecha_creacion, 5), true),
        'Fecha Actualización': doc.fecha_actualizacion ? formatDate(doc.fecha_actualizacion, true) : '',
      }));
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  };

  async downloadExcelFilePoc(user_id: string): Promise<void> {
    try {
      let query = {};
      if (!user_id) {
        throw new Error('El usuario_id es requerido');
      }
      const usuario: any = await this.userService.getUsuarioByUserId(user_id);
      // if (usuario.rol == 'supervisor') {
      //   query['documento_sv'] = user_id;
      // }
      if (usuario.rol == 'bdr') {
        query['usuario_id_creacion'] = user_id;
      }
      
      const data = await this.poc.find(query).sort({fecha_creacion: -1}).toArray();

      const jsonData = data.map((doc) => ({            
        'POC': doc.poc,
        'Livetrade': doc.poc_livetrade,
        'Nombre': doc.nombre,
        'POC Cadena': doc.poc_cadena,
        'POC Backus': doc.poc_backus,
        'Nombre Planning': doc.nombre_planning,
        'Tipo': doc.tipo,
        'Documento SV': doc.documento_sv, 
        'Nombre SV': doc.nombre_sv, 
        'Estado': doc.estado ? 'Activo' : 'Inactivo',
        'Usuario ID Creación': doc.usuario_id_creacion,
        'Usuario ID Actualización': doc.usuario_id_actualizacion,
        'Fecha Creación': formatDate(subHours(doc.fecha_creacion, 5), true),
        'Fecha Actualización': doc.fecha_actualizacion ? formatDate(subHours(doc.fecha_actualizacion, 5), true) : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  };

  async downloadExcelFileEstructureComercial(): Promise<void> {
    try {
      const data = await this.estructura_comercial.find({ }).sort({fecha_creacion: -1}).toArray();
      const jsonData = data.map((doc) => ({    
        'POC': doc.poc,        
        'POC Nombre': doc.poc_nombre,
        'POC Cadena': doc.poc_cadena,
        'POC Backus': doc.poc_backus,
        'POC Nombre Planning': doc.poc_nombre_planning,
        'POC Tipo': doc.poc_tipo,
        'Documento SV': doc.documento_sv,
        'Nombre SV': doc.nombre_sv,
        'Documento BDR': doc.documento_bdr,
        'Nombre BDR': doc.nombre_bdr,
        'Estado': doc.estado ? 'Activo' : 'Inactivo',
        'Usuario ID Creación': doc.usuario_id_creacion,
        'Usuario ID Actualización': doc.usuario_id_actualizacion,
        'Fecha Creación': doc.fecha_creacion,
        'Fecha Actualización': doc.fecha_actualizacion,
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  };

  async downloadExcelFileUsuario(): Promise<void> {
    try {
      const data = await this.usuario.find({}).sort({fecha_creacion: -1}).toArray();
      const jsonData = data.map((doc) => ({
        'Usuario ID': doc.usuario_id,
        'Nombre': doc.nombre,
        'Rol': doc.rol,
        'Estado': doc.estado ? 'Activo' : 'Inactivo',
        'Usuario ID Creación': doc.usuario_id_creacion,
        'Fecha Creación': formatDate(subHours(doc.fecha_creacion, 5), true),
        'Fecha Actualización': doc.fecha_actualizacion ? formatDate(subHours(doc.fecha_actualizacion, 5), true) : '',
        'Fecha Eliminación': doc.fecha_eliminacion ? formatDate(subHours(doc.fecha_eliminacion, 5), true) : '',
      }));    
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (err) {
        console.error('Error exporting data:', err);
        throw err;
    }
  };

  // precio dashboard start
  async downloadExcelFilePrecioAveragesByBrandAndDescriptionByMonthAndWeek(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
  
      // Otros filtros condicionales (supervisor, cliente, tienda)
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Ajustar fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });
  
      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });
  
      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });
  
      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));
  
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
  
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            avg_pvp_regular: { $avg: "$skus.pvp_regular" },
            avg_pvp_promocional: {
              $avg: {
                $cond: [{ $gt: ["$skus.pvp_promocional", 0] }, "$skus.pvp_promocional", null],
              },
            },
            avg_pvp_adicional: {
              $avg: {
                $cond: [{ $gt: ["$skus.pvp_adicional", 0] }, "$skus.pvp_adicional", null],
              },
            },
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            avg_pvp_regular: { $avg: "$skus.pvp_regular" },
            avg_pvp_promocional: {
              $avg: {
                $cond: [{ $gt: ["$skus.pvp_promocional", 0] }, "$skus.pvp_promocional", null],
              },
            },
            avg_pvp_adicional: {
              $avg: {
                $cond: [{ $gt: ["$skus.pvp_adicional", 0] }, "$skus.pvp_adicional", null],
              },
            },
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta
      const result = await PrecioModel.aggregate(aggregatePipeline);
  
      // Estructura para almacenar los resultados y prepararlos para Excel
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const avg_pvp_regular = item.avg_pvp_regular;
          const avg_pvp_promocional = item.avg_pvp_promocional;
          const avg_pvp_adicional = item.avg_pvp_adicional;
  
          if (!data[week]) {
            data[week] = {};
          }
  
          if (!data[week][marca]) {
            data[week][marca] = [];
          }
  
          data[week][marca].push({
            marca,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            avg_pvp_regular,
            avg_pvp_promocional,
            avg_pvp_adicional
          });
        });
      } else {
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const avg_pvp_regular = item.avg_pvp_regular;
          const avg_pvp_promocional = item.avg_pvp_promocional;
          const avg_pvp_adicional = item.avg_pvp_adicional;
  
          if (!data[month]) {
            data[month] = {};
          }
  
          if (!data[month][marca]) {
            data[month][marca] = [];
          }
  
          data[month][marca].push({
            marca,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            avg_pvp_regular,
            avg_pvp_promocional,
            avg_pvp_adicional
          });
        });
      }
  
      // Generación del JSON para exportar a Excel
      const jsonData: any = [];
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          data[clave][marca].forEach(element => {
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'MARCA': marca,
              'POC NOMBRE': element.pocNombre,
              'NOMBRE SV': element.nombreSv,
              'DOCUMENTO SV': element.documentoSv,
              'REGION': element.region,
              'GERENCIA': element.gerencia,
              'CADENA': element.cadena,
              'EMPRESA ID': element.empresaId,
              'PROMEDIO PVP REGULAR': element.avg_pvp_regular,
              'PROMEDIO PVP PROMOCIONAL': element.avg_pvp_promocional,
              'PROMEDIO PVP ADICIONAL': element.avg_pvp_adicional
            });
          });
        }
      }
  
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFilePrecioCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, marcas: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
  
      // Otros filtros condicionales
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Ajustar la fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });
  
      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });
  
      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });
  
      if (marcas) {
        const listMarcas = JSON.parse(marcas);
        if (listMarcas.length > 0) {
          aggregatePipeline.push({
            $match: {
              'skus.marca': { $in: listMarcas }
            }
          });
        }
      }
  
      // Calcular diferencia de precios
      aggregatePipeline.push({
        $addFields: {
          diferencia_pvp: {
            $cond: {
              if: { $ifNull: ["$skus.pvp_promocional", null] },
              then: { $subtract: ["$skus.pvp_regular", "$skus.pvp_promocional"] },
              else: { $subtract: ["$skus.pvp_regular", "$skus.pvp_regular"] }
            }
          }
        }
      });
  
      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));
  
        // Filtrar por los meses específicos
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
  
        // Agrupar por semana, marca, descripcion y otros campos solicitados
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            promedio_diferencia_pvp: { $avg: "$diferencia_pvp" } // Calcular el promedio
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // Agrupar por mes, marca, descripcion y otros campos solicitados
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            promedio_diferencia_pvp: { $avg: "$diferencia_pvp" } // Calcular el promedio
          }
        });
  
        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta
      const result = await PrecioModel.aggregate(aggregatePipeline);
  
      // Estructura para almacenar los resultados
      let data = {};
  
      // Construir la estructura para exportación
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
  
      for (let clave in result) {
        const item = result[clave];
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(item._id.week), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = item._id.week;
        } else {
          addColumns['MES'] = months[item._id.month - 1];
        }
        jsonData.push({
          'AÑO': year,
          ...addColumns,
          'MARCA': item._id.marca,
          'DESCRIPCION': item._id.descripcion,
          'POC NOMBRE': item._id.poc_nombre,
          'NOMBRE SV': item._id.nombre_sv,
          'DOCUMENTO SV': item._id.documento_sv,
          'REGION': item._id.region,
          'GERENCIA': item._id.gerencia,
          'CADENA': item._id.cadena,
          'EMPRESA ID': item._id.empresa_id,
          'PROMEDIO DIFERENCIA PVP': item.promedio_diferencia_pvp,  // Añadir diferencia de precios
        });
      }
  
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFilePrecioStoresWithProductsPromotional(filterTable: string): Promise<Buffer> {
    try {
      const filters = JSON.parse(filterTable);
      let query: any = {};
      let aggregatePipeline: any[] = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = { $gte: startOfYear, $lt: endOfYear };
      }
  
      // Otros filtros
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // // Ajustar fecha con $dateSubtract para restar 5 horas
      // aggregatePipeline.push({
      //   $addFields: {
      //     adjusted_fecha_creacion: {
      //       $dateSubtract: {
      //         startDate: "$fecha_creacion",
      //         unit: "hour",
      //         amount: 5
      //       }
      //     }
      //   }
      // });
  
      // // Agregar el filtro inicial al pipeline
      // aggregatePipeline.push({ $match: query });
  
      // // Descomponer el array de skus
      // aggregatePipeline.push({ $unwind: "$skus" });
  
      // // Filtrar solo skus con pvp_promocional mayor a 0
      // aggregatePipeline.push({
      //   $match: {
      //     "skus.pvp_promocional": { $gt: 0 }
      //   }
      // });
  
      // // Lógica de agrupación por mes o semana
      // if (filters.meses && filters.meses.length > 0) {
      //   const filteredMonths = filters.meses.map((m: string) => parseInt(m));
      //   aggregatePipeline.push({
      //     $match: {
      //       $expr: {
      //         $in: [{ $month: "$fecha_creacion" }, filteredMonths]
      //       }
      //     }
      //   });
  
      //   aggregatePipeline.push({
      //     $group: {
      //       _id: {
      //         week: { $isoWeek: "$fecha_creacion" },
      //         nombre: "$poc.nombre",
      //         descripcion: "$skus.descripcion",
      //         region: "$poc.region",
      //         gerencia: "$poc.gerencia",
      //         cadena: "$poc.cadena",
      //         empresa_id: "$empresa_id"
      //       },
      //       avg_pvp_promocional: { $avg: "$skus.pvp_promocional" }
      //     }
      //   });
  
      //   aggregatePipeline.push({ $sort: { "_id.week": 1 } });
  
      // } else {
      //   aggregatePipeline.push({
      //     $group: {
      //       _id: {
      //         month: { $month: "$fecha_creacion" },
      //         nombre: "$poc.nombre",
      //         descripcion: "$skus.descripcion",
      //         region: "$poc.region",
      //         gerencia: "$poc.gerencia",
      //         cadena: "$poc.cadena",
      //         empresa_id: "$empresa_id"
      //       },
      //       avg_pvp_promocional: { $avg: "$skus.pvp_promocional" }
      //     }
      //   });
  
      //   aggregatePipeline.push({ $sort: { "_id.month": 1 } });
      // }
      // Ajustar fecha
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });

      // Filtro inicial
      aggregatePipeline.push({ $match: query });

      // Descomponer el array de SKUs
      aggregatePipeline.push({ $unwind: "$skus" });

      // Filtrar SKUs con `pvp_promocional > 0`
      aggregatePipeline.push({
        $match: {
          "skus.pvp_promocional": { $gt: 0 }
        }
      });

      // Calcular el promedio entre `pvp_regular` y `pvp_promocional`
      aggregatePipeline.push({
        $addFields: {
          "skus.promedio_pvp": {
            $divide: [
              { $add: ["$skus.pvp_regular", "$skus.pvp_promocional"] },
              2
            ]
          }
        }
      });

      // Agrupación dinámica
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map((m: string) => parseInt(m));
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$adjusted_fecha_creacion" },
              nombre: "$poc.nombre",
              descripcion: "$skus.descripcion",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            avg_promedio_pvp: { $avg: "$skus.promedio_pvp" }
          }
        });
        aggregatePipeline.push({ $sort: { "_id.week": 1 } });
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$adjusted_fecha_creacion" },
              nombre: "$poc.nombre",
              descripcion: "$skus.descripcion",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            avg_promedio_pvp: { $avg: "$skus.promedio_pvp" }
          }
        });
        aggregatePipeline.push({ $sort: { "_id.month": 1 } });
      }
  
      // Ejecutar la consulta
      const result = await PrecioModel.aggregate(aggregatePipeline);
  
      // Estructurar los datos para Excel
      const jsonData: any[] = [];
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const existsMonth = filters.meses && filters.meses.length > 0;
  
      for (const item of result) {
        // const period = existsMonth ? `Semana ${item._id.week}` : months[item._id.month - 1];
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(item._id.week), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = item._id.week;
        } else {
          addColumns['MES'] = months[item._id.month - 1];
        }
        jsonData.push({
          'AÑO': year,
          ...addColumns,
          'TIENDA': item._id.nombre,
          'DESCRIPCIÓN': item._id.descripcion,
          'REGIÓN': item._id.region,
          'GERENCIA': item._id.gerencia,
          'CADENA': item._id.cadena,
          'EMPRESA ID': item._id.empresa_id,
          'PROMEDIO PVP PROMOCIONAL': item.avg_promedio_pvp
        });
      }
  
      // Generar el archivo Excel
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
  
    } catch (error) {
      console.error('Error al exportar los datos:', error);
      throw error;
    }
  }
  // precio dashboard end

  // frentes start
  async downloadExcelFileFrenteCountsByBrandMonthAndWeek(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
  
      // Otros filtros condicionales (supervisor, cliente, tienda)
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Ajustar fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });
  
      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });
  
      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });

      // Filtro de linea (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "skus.linea": { $in: filters.linea }
          }
        });
      }
  
      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m)); // Convertir los meses en enteros
  
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
  
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: "$skus.cantidad" }
            // count: { $sum: 1 }
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            // count: { $sum: 1 }
            count: { $sum: "$skus.cantidad" }
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta
      const result = await FrenteModel.aggregate(aggregatePipeline);
  
      // Estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[week]) {
            data[week] = {};
          }
  
          if (!data[week][marca]) {
            data[week][marca] = [];
          }
  
          data[week][marca].push({
            marca,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            count
          });
        });
      } else {
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[month]) {
            data[month] = {};
          }
  
          if (!data[month][marca]) {
            data[month][marca] = [];
          }
  
          data[month][marca].push({
            marca,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            count
          });
        });
      }
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          data[clave][marca].forEach(element => {
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'MARCA': marca,
              'POC NOMBRE': element.pocNombre,
              'NOMBRE SV': element.nombreSv,
              'DOCUMENTO SV': element.documentoSv,
              'REGION': element.region,
              'GERENCIA': element.gerencia,
              'CADENA': element.cadena,
              'EMPRESA ID': element.empresaId,
              'CANTIDAD': element.count
            });
          });
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
  // frentes end

  // stock start
  async downloadExcelFileStockAverageByDescriptionMonthAndWeek(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
  
      // Otros filtros condicionales (supervisor, cliente, tienda)
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Ajustar fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });

      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({ $match: query });

      // Descomponer el array de SKUs
      aggregatePipeline.push({ $unwind: "$skus" });

      // Calcular el promedio de `gondola_stock` y `exhibicion_stock`
      aggregatePipeline.push({
        $addFields: {
          "skus.promedio_stock": {
            $divide: [
              { $add: ["$skus.gondola_stock", "$skus.exhibicion_stock"] },
              2,
            ],
          },
        },
      });

      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map((m) => parseInt(m));

        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$adjusted_fecha_creacion" }, filteredMonths],
            },
          },
        });

        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$adjusted_fecha_creacion" },
              descripcion: "$skus.descripcion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id",
            },
            avg_promedio_stock: { $avg: "$skus.promedio_stock" },
          },
        });

        aggregatePipeline.push({ $sort: { "_id.week": 1 } });
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$adjusted_fecha_creacion" },
              descripcion: "$skus.descripcion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id",
            },
            avg_promedio_stock: { $avg: "$skus.promedio_stock" },
          },
        });

        aggregatePipeline.push({ $sort: { "_id.month": 1 } });
      }

      // Ejecutar la consulta
      const result = await StockModel.aggregate(aggregatePipeline);
      console.log('result', result);
      // Estructura para almacenar los resultados
      let data = {};
      if (filters.meses && filters.meses.length > 0) {
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const descripcion = item._id.descripcion;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const avgPromedioStock = item.avg_promedio_stock;

          if (!data[week]) {
            data[week] = {};
          }

          if (!data[week][descripcion]) {
            data[week][descripcion] = [];
          }

          data[week][descripcion].push({
            descripcion,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            avgPromedioStock
          });
        });
      } else {
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const descripcion = item._id.descripcion;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const avgPromedioStock = item.avg_promedio_stock;

          if (!data[month]) {
            data[month] = {};
          }

          if (!data[month][descripcion]) {
            data[month][descripcion] = [];
          }

          data[month][descripcion].push({
            descripcion,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            avgPromedioStock
          });
        });
      }

      // Preparar los datos para exportar a Excel
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let descripcion in data[clave]) {
          data[clave][descripcion].forEach(element => {
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'DESCRIPCION': descripcion,
              'POC NOMBRE': element.pocNombre,
              'NOMBRE SV': element.nombreSv,
              'DOCUMENTO SV': element.documentoSv,
              'REGION': element.region,
              'GERENCIA': element.gerencia,
              'CADENA': element.cadena,
              'EMPRESA ID': element.empresaId,
              'PROMEDIO STOCK': element.avgPromedioStock
            });
          });
        }
      }
      
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // async downloadExcelFileStockSeparateAverageByDescriptionMonthAndWeek(filterTable: string): Promise<void> {
  //   try {
  //     let query = {};
  //     const filters = JSON.parse(filterTable);
  //     let aggregatePipeline: any = [];
  
  //     // Filtro de año
  //     if (filters.anio) {
  //       const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
  //       const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
  //       query['fecha_creacion'] = {
  //         $gte: startOfYear,
  //         $lt: endOfYear
  //       };
  //     }
  
  //     // Otros filtros condicionales (supervisor, cliente, tienda)
  //     if (filters.supervisor && filters.supervisor.length > 0) {
  //       query['poc.documento_sv'] = { $in: filters.supervisor };
  //     }
  //     if (filters.cliente && filters.cliente.length > 0) {
  //       query['empresa_id'] = { $in: filters.cliente };
  //     }
  //     if (filters.tienda && filters.tienda.length > 0) {
  //       query['poc.nombre'] = { $in: filters.tienda };
  //     }
  //     if (filters.cadena && filters.cadena.length > 0) {
  //       query['poc.cadena'] = { $in: filters.cadena };
  //     }
  //     if (filters.gerencia && filters.gerencia.length > 0) {
  //       query['poc.gerencia'] = { $in: filters.gerencia };
  //     }
  //     if (filters.region && filters.region.length > 0) {
  //       query['poc.region'] = { $in: filters.region };
  //     }
  //     if (filters.tipo && filters.tipo.length > 0) {
  //       query['poc.tipo'] = { $in: filters.tipo };
  //     }
  
  //     // Ajustar fecha con $dateSubtract para restar 5 horas
  //     aggregatePipeline.push({
  //       $addFields: {
  //         adjusted_fecha_creacion: {
  //           $dateSubtract: {
  //             startDate: "$fecha_creacion",
  //             unit: "hour",
  //             amount: 5
  //           }
  //         }
  //       }
  //     });

  //     // Agregar el filtro inicial al pipeline
  //     aggregatePipeline.push({ $match: query });

  //     // Descomponer el array de SKUs
  //     aggregatePipeline.push({ $unwind: "$skus" });

  //     // Calcular el promedio de `gondola_stock` y `exhibicion_stock`
  //     aggregatePipeline.push({
  //       $addFields: {
  //         "skus.promedio_stock": {
  //           $divide: [
  //             { $add: ["$skus.gondola_stock", "$skus.exhibicion_stock"] },
  //             2,
  //           ],
  //         },
  //       },
  //     });

  //     // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
  //     if (filters.meses && filters.meses.length > 0) {
  //       const filteredMonths = filters.meses.map((m) => parseInt(m));

  //       aggregatePipeline.push({
  //         $match: {
  //           $expr: {
  //             $in: [{ $month: "$adjusted_fecha_creacion" }, filteredMonths],
  //           },
  //         },
  //       });

  //       aggregatePipeline.push({
  //         $group: {
  //           _id: {
  //             week: { $isoWeek: "$adjusted_fecha_creacion" },
  //             descripcion: "$skus.descripcion",
  //             nombre: "$poc.nombre",
  //             nombre_sv: "$poc.nombre_sv",
  //             documento_sv: "$poc.documento_sv",
  //             region: "$poc.region",
  //             gerencia: "$poc.gerencia",
  //             cadena: "$poc.cadena",
  //             empresa_id: "$empresa_id",
  //           },
  //           avg_promedio_stock: { $avg: "$skus.promedio_stock" },
  //         },
  //       });

  //       aggregatePipeline.push({ $sort: { "_id.week": 1 } });
  //     } else {
  //       aggregatePipeline.push({
  //         $group: {
  //           _id: {
  //             month: { $month: "$adjusted_fecha_creacion" },
  //             descripcion: "$skus.descripcion",
  //             nombre: "$poc.nombre",
  //             nombre_sv: "$poc.nombre_sv",
  //             documento_sv: "$poc.documento_sv",
  //             region: "$poc.region",
  //             gerencia: "$poc.gerencia",
  //             cadena: "$poc.cadena",
  //             empresa_id: "$empresa_id",
  //           },
  //           avg_promedio_stock: { $avg: "$skus.promedio_stock" },
  //         },
  //       });

  //       aggregatePipeline.push({ $sort: { "_id.month": 1 } });
  //     }

  //     // Ejecutar la consulta
  //     const result = await StockModel.aggregate(aggregatePipeline);
  //     console.log('result', result);
  //     // Estructura para almacenar los resultados
  //     let data = {};
  //     if (filters.meses && filters.meses.length > 0) {
  //       data = {};
  //       result.forEach(item => {
  //         const week = item._id.week;
  //         const descripcion = item._id.descripcion;
  //         const pocNombre = item._id.nombre;
  //         const nombreSv = item._id.nombre_sv;
  //         const documentoSv = item._id.documento_sv;
  //         const region = item._id.region;
  //         const gerencia = item._id.gerencia;
  //         const cadena = item._id.cadena;
  //         const empresaId = item._id.empresa_id;
  //         const avgPromedioStock = item.avg_promedio_stock;

  //         if (!data[week]) {
  //           data[week] = {};
  //         }

  //         if (!data[week][descripcion]) {
  //           data[week][descripcion] = [];
  //         }

  //         data[week][descripcion].push({
  //           descripcion,
  //           pocNombre,
  //           nombreSv,
  //           documentoSv,
  //           region,
  //           gerencia,
  //           cadena,
  //           empresaId,
  //           avgPromedioStock
  //         });
  //       });
  //     } else {
  //       data = {};
  //       result.forEach(item => {
  //         const month = item._id.month;
  //         const descripcion = item._id.descripcion;
  //         const pocNombre = item._id.nombre;
  //         const nombreSv = item._id.nombre_sv;
  //         const documentoSv = item._id.documento_sv;
  //         const region = item._id.region;
  //         const gerencia = item._id.gerencia;
  //         const cadena = item._id.cadena;
  //         const empresaId = item._id.empresa_id;
  //         const avgPromedioStock = item.avg_promedio_stock;

  //         if (!data[month]) {
  //           data[month] = {};
  //         }

  //         if (!data[month][descripcion]) {
  //           data[month][descripcion] = [];
  //         }

  //         data[month][descripcion].push({
  //           descripcion,
  //           pocNombre,
  //           nombreSv,
  //           documentoSv,
  //           region,
  //           gerencia,
  //           cadena,
  //           empresaId,
  //           avgPromedioStock
  //         });
  //       });
  //     }

  //     // Preparar los datos para exportar a Excel
  //     const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  //     const year = filters.anio[0];
  //     const jsonData: any = [];
  //     const existsMonth = filters.meses && filters.meses.length > 0;
  //     for (let clave in data) {
  //       const addColumns = {};
  //       if (existsMonth) {
  //         const month = this.getMonthFromWeek(parseInt(clave), year);
  //         addColumns['MES'] = month;
  //         addColumns['SEMANA'] = clave;
  //       } else {
  //         addColumns['MES'] = months[parseInt(clave) - 1];
  //       }
  //       for (let descripcion in data[clave]) {
  //         data[clave][descripcion].forEach(element => {
  //           jsonData.push({
  //             'AÑO': year,
  //             ...addColumns,
  //             'DESCRIPCION': descripcion,
  //             'POC NOMBRE': element.pocNombre,
  //             'NOMBRE SV': element.nombreSv,
  //             'DOCUMENTO SV': element.documentoSv,
  //             'REGION': element.region,
  //             'GERENCIA': element.gerencia,
  //             'CADENA': element.cadena,
  //             'EMPRESA ID': element.empresaId,
  //             'PROMEDIO STOCK': element.avgPromedioStock
  //           });
  //         });
  //       }
  //     }
      
  //     const worksheet = XLSX.utils.json_to_sheet(jsonData);
  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  //     const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
  //     return buffer;
  //   } catch (error: unknown) {
  //     console.error('Error exporting data:', error);
  //     throw error;
  //   }
  // }

  public async downloadExcelFileStockSeparateAverageByDescriptionMonthAndWeek(filterTable: string): Promise<void>  {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear,
        };
      }
  
      // Otros filtros condicionales
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Ajustar fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5,
            },
          },
        },
      });
  
      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({ $match: query });
  
      // Descomponer el array de SKUs
      aggregatePipeline.push({ $unwind: "$skus" });
  
      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map((m) => parseInt(m));
  
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$adjusted_fecha_creacion" }, filteredMonths],
            },
          },
        });
  
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$adjusted_fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id",
            },
            avg_gondola_stock: { $avg: "$skus.gondola_stock" },
            avg_exhibicion_stock: { $avg: "$skus.exhibicion_stock" },
          },
        });
  
        aggregatePipeline.push({ $sort: { "_id.week": 1 } });
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$adjusted_fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id",
            },
            avg_gondola_stock: { $avg: "$skus.gondola_stock" },
            avg_exhibicion_stock: { $avg: "$skus.exhibicion_stock" },
          },
        });
  
        aggregatePipeline.push({ $sort: { "_id.month": 1 } });
      }
  
      // Ejecutar la consulta
      const result = await StockModel.aggregate(aggregatePipeline);
  
      // Organizar los resultados en la estructura deseada
      let data = {};
      result.forEach((item) => {
        const period = filters.meses && filters.meses.length > 0 ? item._id.week : item._id.month;
        const marca = item._id.marca;
        const descripcion = item._id.descripcion;
  
        if (!data[period]) {
          data[period] = {};
        }
        if (!data[period][marca]) {
          data[period][marca] = {};
        }
  
        data[period][marca][descripcion] = {
          avgGondolaStock: item.avg_gondola_stock.toFixed(2),
          avgExhibicionStock: item.avg_exhibicion_stock.toFixed(2),
          poc: {
            nombre: item._id.nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id,
          },
        };
      });

      // console.log('data', data);

      // Preparar los datos para exportar a Excel
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          for (let descripcion in data[clave][marca]) {
            console.log('data[clave][marca][descripcion]', data[clave][marca][descripcion]);
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'DESCRIPCION': descripcion,
              'POC NOMBRE': data[clave][marca][descripcion].poc.nombre,
              'NOMBRE SV': data[clave][marca][descripcion].poc.nombre_sv,
              'DOCUMENTO SV': data[clave][marca][descripcion].poc.documento_sv,
              'REGION': data[clave][marca][descripcion].poc.region,
              'GERENCIA': data[clave][marca][descripcion].poc.gerencia,
              'CADENA': data[clave][marca][descripcion].poc.cadena,
              'EMPRESA ID': data[clave][marca][descripcion].poc.empresa_id,
              'PROMEDIO GONDOLA STOCK': data[clave][marca][descripcion].avgGondolaStock,
              'PROMEDIO EXIBICION STOCK': data[clave][marca][descripcion].avgExhibicionStock
            });
          }
        }
      }
      
      // console.log('jsonData', jsonData);
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
      // return data;
    } catch (error: unknown) {
      throw new Error("Error interno del servidor");
    }
  }  
  // stock end

  // competencia start
  async downloadExcelFileExhibitionCompetenciaCountsByTypeMonthAndWeek(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
  
      // Filtros basados en el frontend
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = { 
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
      if (filters.linea && filters.linea.length > 0) {
        query['skus'] = {
          $elemMatch: {
            linea: { $in: filters.linea }
          }
        };
      }
  
      // Construir el pipeline de agregación
      let aggregatePipeline: any = [
        {
          $addFields: {
            adjusted_fecha_creacion: {
              $dateSubtract: {
                startDate: "$fecha_creacion",
                unit: "hour",
                amount: 5
              }
            }
          }
        },
        { $match: query },  // Filtro inicial basado en el año y otros parámetros
      ];
  
      // Lógica condicional para agrupar por mes o semana
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));  // Convertir meses en enteros
  
        // Filtro adicional para los meses seleccionados
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana, tipo de exhibición, y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // Si no se seleccionan meses, agrupar por mes, tipo de exhibición y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta agregada
      const result = await ExhibicionCompetenciaModel.aggregate(aggregatePipeline);
  
      // Inicializar la estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        // Si se agrupa por semana
        result.forEach(item => {
          const week = item._id.week;
          const exhibicionObj = {
            tipo_exhibicion: item._id.tipo_exhibicion,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[week]) {
            data[week] = [];
          }
  
          data[week].push(exhibicionObj);
        });
      } else {
        // Si se agrupa por mes
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const exhibicionObj = {
            tipo_exhibicion: item._id.tipo_exhibicion,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[month]) {
            data[month] = [];
          }
  
          data[month].push(exhibicionObj);
        });
      }
  
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        data[clave].forEach((element: any) => { // recorriendo por mes o semana
          jsonData.push({
            'AÑO': year,
            ...addColumns,
            'TIPO EXHIBICION': element.tipo_exhibicion,
            'POC NOMBRE': element.poc_nombre,
            'NOMBRE SV': element.nombre_sv,
            'DOCUMENTO SV': element.documento_sv,
            'REGION': element.region,
            'GERENCIA': element.gerencia,
            'CADENA': element.cadena,
            'EMPRESA ID': element.empresa_id,
            'CANTIDAD': element.cantidad
          });
        });
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionCompetenciaCountsByBrandMonthAndWeek(filterTable: string, typesExhibitions: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
  
      // Otros filtros condicionales (supervisor, cliente, tienda)
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (typesExhibitions) {
        query['tipo_exhibicion'] = { $in: JSON.parse(typesExhibitions) };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Ajustar fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });
  
      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });
  
      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });

      // Filtro de linea (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "skus.linea": { $in: filters.linea }
          }
        });
      }
  
      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m)); // Convertir los meses en enteros
  
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
  
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              tipo_exhibicion: "$tipo_exhibicion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              tipo_exhibicion: "$tipo_exhibicion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta
      const result = await ExhibicionCompetenciaModel.aggregate(aggregatePipeline);
  
      // Estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const tipoExhibicion = item._id.tipo_exhibicion;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[week]) {
            data[week] = {};
          }
  
          if (!data[week][marca]) {
            data[week][marca] = [];
          }
  
          data[week][marca].push({
            marca,
            tipoExhibicion,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            count
          });
        });
      } else {
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const tipoExhibicion = item._id.tipo_exhibicion;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[month]) {
            data[month] = {};
          }
  
          if (!data[month][marca]) {
            data[month][marca] = [];
          }
  
          data[month][marca].push({
            marca,
            tipoExhibicion,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            count
          });
        });
      }
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          data[clave][marca].forEach(element => {
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'MARCA': marca,
              'TIPO EXHIBICION': element.tipoExhibicion,
              'POC NOMBRE': element.pocNombre,
              'NOMBRE SV': element.nombreSv,
              'DOCUMENTO SV': element.documentoSv,
              'REGION': element.region,
              'GERENCIA': element.gerencia,
              'CADENA': element.cadena,
              'EMPRESA ID': element.empresaId,
              'CANTIDAD': element.count
            });
          });
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, typesExhibitions: string, marcas: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];

      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }

      // Otros filtros condicionales
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (typesExhibitions) {
        query['tipo_exhibicion'] = { $in: JSON.parse(typesExhibitions) };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }

      // Ajustar la fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });

      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });

      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });

      // Filtro de linea (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "skus.linea": { $in: filters.linea }
          }
        });
      }

      if (marcas) {
        const listMarcas = JSON.parse(marcas);
        if (listMarcas.length > 0) { // si es que viene desde frontend quiere decir que viene al menos uno
          aggregatePipeline.push({
            $match: {
              'skus.marca': { $in: listMarcas }
            }
          });
        }
      }

      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m)); // Convertir los meses en enteros

        // Filtrar por los meses específicos
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana, marca, descripcion y otros campos solicitados
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });

        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });

      } else {
        // Agrupar por mes, marca, descripcion y otros campos solicitados
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });

        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }

      // Ejecutar la consulta
      const result = await ExhibicionCompetenciaModel.aggregate(aggregatePipeline);

      // Estructura para almacenar los resultados
      let data = {};

      if (filters.meses && filters.meses.length > 0) {
        // Inicializar la estructura de datos por semanas
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const tipo_exhibicion = item._id.tipo_exhibicion;
          const poc_nombre = item._id.poc_nombre;
          const nombre_sv = item._id.nombre_sv;
          const documento_sv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresa_id = item._id.empresa_id;
          const count = item.count;

          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
          if (!data[week][marca][descripcion]) {
            data[week][marca][descripcion] = [];
          }

          // Añadir los datos a la estructura
          data[week][marca][descripcion].push({
            tipo_exhibicion,
            poc_nombre,
            nombre_sv,
            documento_sv,
            region,
            gerencia,
            cadena,
            empresa_id,
            count
          });
        });
      } else {
        // Inicializar la estructura de datos por meses
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const tipo_exhibicion = item._id.tipo_exhibicion;
          const poc_nombre = item._id.poc_nombre;
          const nombre_sv = item._id.nombre_sv;
          const documento_sv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresa_id = item._id.empresa_id;
          const count = item.count;

          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
          if (!data[month][marca][descripcion]) {
            data[month][marca][descripcion] = [];
          }

          // Añadir los datos a la estructura
          data[month][marca][descripcion].push({
            tipo_exhibicion,
            poc_nombre,
            nombre_sv,
            documento_sv,
            region,
            gerencia,
            cadena,
            empresa_id,
            count
          });
        });
      }
      
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          for (let descripcion in data[clave][marca]) {
            data[clave][marca][descripcion].forEach(element => {       
              jsonData.push({
                'AÑO': year,
                ...addColumns,
                'MARCA': marca,
                'DESCRIPCION': descripcion,
                'TIPO EXHIBICION': element.tipo_exhibicion,
                'POC NOMBRE': element.poc_nombre,
                'NOMBRE SV': element.nombre_sv,
                'DOCUMENTO SV': element.documento_sv,
                'REGION': element.region,
                'GERENCIA': element.gerencia,
                'CADENA': element.cadena,
                'EMPRESA ID': element.empresa_id,
                'CANTIDAD': element.count
              });
            });
          }
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
  // competencia end
  // adicional start
  async downloadExcelFileExhibitionAdicionalCountsByTypeMonthAndWeek(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
  
      // Filtros basados en el frontend
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = { 
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
      if (filters.linea && filters.linea.length > 0) {
        query['skus'] = {
          $elemMatch: {
            linea: { $in: filters.linea }
          }
        };
      }
  
      // Construir el pipeline de agregación
      let aggregatePipeline: any = [
        {
          $addFields: {
            adjusted_fecha_creacion: {
              $dateSubtract: {
                startDate: "$fecha_creacion",
                unit: "hour",
                amount: 5
              }
            }
          }
        },
        { $match: query },  // Filtro inicial basado en el año y otros parámetros
      ];
  
      // Lógica condicional para agrupar por mes o semana
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));  // Convertir meses en enteros
  
        // Filtro adicional para los meses seleccionados
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana, tipo de exhibición, y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // Si no se seleccionan meses, agrupar por mes, tipo de exhibición y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta agregada
      const result = await ExhibicionAdicionalModel.aggregate(aggregatePipeline);
  
      // Inicializar la estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        // Si se agrupa por semana
        result.forEach(item => {
          const week = item._id.week;
          const exhibicionObj = {
            tipo_exhibicion: item._id.tipo_exhibicion,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[week]) {
            data[week] = [];
          }
  
          data[week].push(exhibicionObj);
        });
      } else {
        // Si se agrupa por mes
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const exhibicionObj = {
            tipo_exhibicion: item._id.tipo_exhibicion,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[month]) {
            data[month] = [];
          }
  
          data[month].push(exhibicionObj);
        });
      }
  
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        data[clave].forEach((element: any) => { // recorriendo por mes o semana
          jsonData.push({
            'AÑO': year,
            ...addColumns,
            'TIPO EXHIBICION': element.tipo_exhibicion,
            'POC NOMBRE': element.poc_nombre,
            'NOMBRE SV': element.nombre_sv,
            'DOCUMENTO SV': element.documento_sv,
            'REGION': element.region,
            'GERENCIA': element.gerencia,
            'CADENA': element.cadena,
            'EMPRESA ID': element.empresa_id,
            'CANTIDAD': element.cantidad
          });
        });
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionAdicionalCountsByBrandMonthAndWeek(filterTable: string, typesExhibitions: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
  
      // Otros filtros condicionales (supervisor, cliente, tienda)
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
      if (typesExhibitions) {
        query['tipo_exhibicion'] = { $in: JSON.parse(typesExhibitions) };
      }
  
      // Ajustar fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });
  
      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });
  
      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });

      // Filtro de linea (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "skus.linea": { $in: filters.linea }
          }
        });
      }
  
      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m)); // Convertir los meses en enteros
  
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
  
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              tipo_exhibicion: "$tipo_exhibicion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              tipo_exhibicion: "$tipo_exhibicion",
              nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta
      const result = await ExhibicionAdicionalModel.aggregate(aggregatePipeline);
  
      // Estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const tipoExhibicion = item._id.tipo_exhibicion;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[week]) {
            data[week] = {};
          }
  
          if (!data[week][marca]) {
            data[week][marca] = [];
          }
  
          data[week][marca].push({
            marca,
            tipoExhibicion,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            count
          });
        });
      } else {
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const tipoExhibicion = item._id.tipo_exhibicion;
          const pocNombre = item._id.nombre;
          const nombreSv = item._id.nombre_sv;
          const documentoSv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[month]) {
            data[month] = {};
          }
  
          if (!data[month][marca]) {
            data[month][marca] = [];
          }
  
          data[month][marca].push({
            marca,
            tipoExhibicion,
            pocNombre,
            nombreSv,
            documentoSv,
            region,
            gerencia,
            cadena,
            empresaId,
            count
          });
        });
      }
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          data[clave][marca].forEach(element => {
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'MARCA': marca,
              'TIPO EXHIBICION': element.tipoExhibicion,
              'POC NOMBRE': element.pocNombre,
              'NOMBRE SV': element.nombreSv,
              'DOCUMENTO SV': element.documentoSv,
              'REGION': element.region,
              'GERENCIA': element.gerencia,
              'CADENA': element.cadena,
              'EMPRESA ID': element.empresaId,
              'CANTIDAD': element.count
            });
          });
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionAdicionalCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, typesExhibitions: string, marcas: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
      // Filtro de año
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }

      // Otros filtros condicionales
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
      if (typesExhibitions) {
        query['tipo_exhibicion'] = { $in: JSON.parse(typesExhibitions) };
      }

      // Ajustar la fecha con $dateSubtract para restar 5 horas
      aggregatePipeline.push({
        $addFields: {
          adjusted_fecha_creacion: {
            $dateSubtract: {
              startDate: "$fecha_creacion",
              unit: "hour",
              amount: 5
            }
          }
        }
      });

      // Agregar el filtro inicial al pipeline
      aggregatePipeline.push({
        $match: query
      });

      // Descomponer el array de skus
      aggregatePipeline.push({
        $unwind: "$skus"
      });

      // Filtro de linea (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "skus.linea": { $in: filters.linea }
          }
        });
      }

      // Filtro condicional de marcas
      if (marcas) {
        const listMarcas = JSON.parse(marcas);
        if (listMarcas.length > 0) { // si es que viene desde frontend quiere decir que viene al menos uno
          aggregatePipeline.push({
            $match: {
              'skus.marca': { $in: listMarcas }
            }
          });
        }
      }

      // Lógica condicional para agrupar por mes o semana según los meses que lleguen desde el frontend
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m)); // Convertir los meses en enteros

        // Filtrar por los meses específicos
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana, marca, descripcion y otros campos solicitados
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });

        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });

      } else {
        // Agrupar por mes, marca, descripcion y otros campos solicitados
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
              tipo_exhibicion: "$tipo_exhibicion",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });

        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }

      // Ejecutar la consulta
      // const result = await ExhibicionAdicionalModel.aggregate(aggregatePipeline);
      const result = await ExhibicionAdicionalModel.aggregate(aggregatePipeline).allowDiskUse(true);

      // Estructura para almacenar los resultados
      let data = {};

      if (filters.meses && filters.meses.length > 0) {
        // Inicializar la estructura de datos por semanas
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const tipo_exhibicion = item._id.tipo_exhibicion;
          const poc_nombre = item._id.poc_nombre;
          const nombre_sv = item._id.nombre_sv;
          const documento_sv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresa_id = item._id.empresa_id;
          const count = item.count;

          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
          if (!data[week][marca][descripcion]) {
            data[week][marca][descripcion] = [];
          }

          // Añadir los datos a la estructura
          data[week][marca][descripcion].push({
            tipo_exhibicion,
            poc_nombre,
            nombre_sv,
            documento_sv,
            region,
            gerencia,
            cadena,
            empresa_id,
            count
          });
        });
      } else {
        // Inicializar la estructura de datos por meses
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const tipo_exhibicion = item._id.tipo_exhibicion;
          const poc_nombre = item._id.poc_nombre;
          const nombre_sv = item._id.nombre_sv;
          const documento_sv = item._id.documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresa_id = item._id.empresa_id;
          const count = item.count;

          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
          if (!data[month][marca][descripcion]) {
            data[month][marca][descripcion] = [];
          }

          // Añadir los datos a la estructura
          data[month][marca][descripcion].push({
            tipo_exhibicion,
            poc_nombre,
            nombre_sv,
            documento_sv,
            region,
            gerencia,
            cadena,
            empresa_id,
            count
          });
        });
      }
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          for (let descripcion in data[clave][marca]) {
            data[clave][marca][descripcion].forEach(element => {       
              jsonData.push({
                'AÑO': year,
                ...addColumns,
                'MARCA': marca,
                'DESCRIPCION': descripcion,
                'TIPO EXHIBICION': element.tipo_exhibicion,
                'POC NOMBRE': element.poc_nombre,
                'NOMBRE SV': element.nombre_sv,
                'DOCUMENTO SV': element.documento_sv,
                'REGION': element.region,
                'GERENCIA': element.gerencia,
                'CADENA': element.cadena,
                'EMPRESA ID': element.empresa_id,
                'CANTIDAD': element.count
              });
            });
          }
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
  // adicional end

  // contraprestada start
  async downloadExcelFileExhibitionContraprestadaCountsByTypeMonthAndWeek(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
  
      // Filtros basados en el frontend
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = { 
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
  
      // Construir el pipeline de agregación
      let aggregatePipeline: any = [
        {
          $addFields: {
            adjusted_fecha_creacion: {
              $dateSubtract: {
                startDate: "$fecha_creacion",
                unit: "hour",
                amount: 5
              }
            }
          }
        },
        { $match: query },  // Filtro inicial basado en el año y otros parámetros
      ];

      // Filtro de linea_homologada (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "linea_homologada": { $in: filters.linea }
          }
        });
      }
  
      // Lógica condicional para agrupar por mes o semana
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));  // Convertir meses en enteros
  
        // Filtro adicional para los meses seleccionados
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana, tipo de exhibición, y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              tipo_exhibicion_homologado: "$tipo_exhibicion_homologado",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // Si no se seleccionan meses, agrupar por mes, tipo de exhibición y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              tipo_exhibicion_homologado: "$tipo_exhibicion_homologado",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta agregada
      const result = await ExhibicionContraprestadaModel.aggregate(aggregatePipeline);
  
      // Inicializar la estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        // Si se agrupa por semana
        result.forEach(item => {
          const week = item._id.week;
          const exhibicionObj = {
            tipo_exhibicion_homologado: item._id.tipo_exhibicion_homologado,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[week]) {
            data[week] = [];
          }
  
          data[week].push(exhibicionObj);
        });
      } else {
        // Si se agrupa por mes
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const exhibicionObj = {
            tipo_exhibicion_homologado: item._id.tipo_exhibicion_homologado,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[month]) {
            data[month] = [];
          }
  
          data[month].push(exhibicionObj);
        });
      }
  
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        data[clave].forEach((element: any) => { // recorriendo por mes o semana
          jsonData.push({
            'AÑO': year,
            ...addColumns,
            'TIPO EXHIBICION HOMOLOGADO': element.tipo_exhibicion_homologado,
            'POC NOMBRE': element.poc_nombre,
            'NOMBRE SV': element.nombre_sv,
            'DOCUMENTO SV': element.documento_sv,
            'REGION': element.region,
            'GERENCIA': element.gerencia,
            'CADENA': element.cadena,
            'EMPRESA ID': element.empresa_id,
            'CANTIDAD': element.cantidad
          });
        });
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionContraprestadaCountsByBrandMonthAndWeek(filterTable: string, typesExhibitions: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
  
      // Filtros basados en el frontend
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = { 
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
      if (typesExhibitions) {
        query['tipo_exhibicion_homologado'] = { $in: JSON.parse(typesExhibitions) };
      }
  
      // Construir el pipeline de agregación
      let aggregatePipeline: any = [
        {
          $addFields: {
            adjusted_fecha_creacion: {
              $dateSubtract: {
                startDate: "$fecha_creacion",
                unit: "hour",
                amount: 5
              }
            }
          }
        },
        { $match: query },  // Filtro inicial basado en el año y otros parámetros
      ];

      // Filtro de linea_homologada (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "linea_homologada": { $in: filters.linea }
          }
        });
      }
  
      // Lógica condicional para agrupar por mes o semana
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));  // Convertir meses en enteros
  
        // Filtro adicional para los meses seleccionados
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana, tipo de exhibición, y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$marca_homologada",
              // tipo_exhibicion_homologado: "$tipo_exhibicion_homologado",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // Si no se seleccionan meses, agrupar por mes, tipo de exhibición y los otros campos requeridos
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$marca_homologada",
              // tipo_exhibicion_homologado: "$tipo_exhibicion_homologado",
              poc_nombre: "$poc.nombre",
              nombre_sv: "$poc.nombre_sv",
              documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta agregada
      const result = await ExhibicionContraprestadaModel.aggregate(aggregatePipeline);
  
      // Inicializar la estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        // Si se agrupa por semana
        result.forEach(item => {
          const week = item._id.week;
          const exhibicionObj = {
            marca: item._id.marca,
            // tipo_exhibicion_homologado: item._id.tipo_exhibicion_homologado,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[week]) {
            data[week] = [];
          }
  
          data[week].push(exhibicionObj);
        });
      } else {
        // Si se agrupa por mes
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const exhibicionObj = {
            marca: item._id.marca,
            // tipo_exhibicion_homologado: item._id.tipo_exhibicion_homologado,
            cantidad: item.count,
            poc_nombre: item._id.poc_nombre,
            nombre_sv: item._id.nombre_sv,
            documento_sv: item._id.documento_sv,
            region: item._id.region,
            gerencia: item._id.gerencia,
            cadena: item._id.cadena,
            empresa_id: item._id.empresa_id
          };
  
          if (!data[month]) {
            data[month] = [];
          }
  
          data[month].push(exhibicionObj);
        });
      }
  
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        data[clave].forEach((element: any) => { // recorriendo por mes o semana
          jsonData.push({
            'AÑO': year,
            ...addColumns,
            'MARCA': element.marca,
            // 'TIPO EXHIBICION HOMOLOGADO': element.tipo_exhibicion_homologado,
            'POC NOMBRE': element.poc_nombre,
            'NOMBRE SV': element.nombre_sv,
            'DOCUMENTO SV': element.documento_sv,
            'REGION': element.region,
            'GERENCIA': element.gerencia,
            'CADENA': element.cadena,
            'EMPRESA ID': element.empresa_id,
            'CANTIDAD': element.cantidad
          });
        });
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, typesExhibitions: string, marcas: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
  
      // Filtros basados en el frontend
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = {
          $gte: startOfYear,
          $lt: endOfYear
        };
      }
      if (filters.supervisor && filters.supervisor.length > 0) {
        query['poc.documento_sv'] = { $in: filters.supervisor };
      }
      if (filters.cliente && filters.cliente.length > 0) {
        query['empresa_id'] = { $in: filters.cliente };
      }
      if (filters.tienda && filters.tienda.length > 0) {
        query['poc.nombre'] = { $in: filters.tienda };
      }
      if (filters.cadena && filters.cadena.length > 0) {
        query['poc.cadena'] = { $in: filters.cadena };
      }
      if (filters.gerencia && filters.gerencia.length > 0) {
        query['poc.gerencia'] = { $in: filters.gerencia };
      }
      if (filters.region && filters.region.length > 0) {
        query['poc.region'] = { $in: filters.region };
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query['poc.tipo'] = { $in: filters.tipo };
      }
      if (typesExhibitions) {
        query['tipo_exhibicion_homologado'] = { $in: JSON.parse(typesExhibitions) };
      }
      if (marcas) {
        query['marca_homologada'] = { $in: JSON.parse(marcas) };
      }
  
      // Construir el pipeline de agregación
      let aggregatePipeline: any = [
        {
          $addFields: {
            adjusted_fecha_creacion: {
              $dateSubtract: {
                startDate: "$fecha_creacion",
                unit: "hour",
                amount: 5  // Ajustar zona horaria si es necesario
              }
            }
          }
        },
        { $match: query }  // Filtro inicial basado en el año y otros parámetros
      ];

      // Filtro de linea_homologada (si se especifica)
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $match: {
            "linea_homologada": { $in: filters.linea }
          }
        });
      }
  
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));
  
        // Filtro adicional para los meses seleccionados
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
  
        // Agrupar por semana, marca, SKU y los nuevos campos
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$marca_homologada",
              skus: "$sku_homologado",
              tipo_exhibicion_homologado: "$tipo_exhibicion_homologado",
              poc_nombre: "$poc.nombre",
              poc_nombre_sv: "$poc.nombre_sv",
              poc_documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
      } else {
        // Si no se seleccionan meses, agrupar por mes, marca, SKU y los nuevos campos
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$marca_homologada",
              skus: "$sku_homologado",
              tipo_exhibicion_homologado: "$tipo_exhibicion_homologado",
              poc_nombre: "$poc.nombre",
              poc_nombre_sv: "$poc.nombre_sv",
              poc_documento_sv: "$poc.documento_sv",
              region: "$poc.region",
              gerencia: "$poc.gerencia",
              cadena: "$poc.cadena",
              empresa_id: "$empresa_id"
            },
            count: { $sum: 1 }
          }
        });
  
        // Ordenar por mes
        aggregatePipeline.push({
          $sort: {
            "_id.month": 1
          }
        });
      }
  
      // Ejecutar la consulta agregada
      const result = await ExhibicionContraprestadaModel.aggregate(aggregatePipeline);
  
      // Inicializar la estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        // Si se agrupa por semana
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const skus = item._id.skus;
          const tipoExhibicionHomologado = item._id.tipo_exhibicion_homologado;
          const pocNombre = item._id.poc_nombre;
          const pocNombreSV = item._id.poc_nombre_sv;
          const pocDocumentoSV = item._id.poc_documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
          if (!data[week][marca][skus]) {
            data[week][marca][skus] = {
              tipoExhibicionHomologado,
              pocNombre,
              pocNombreSV,
              pocDocumentoSV,
              region,
              gerencia,
              cadena,
              empresaId,
              count: 0
            };
          }
  
          data[week][marca][skus].count += count;
        });
      } else {
        // Si se agrupa por mes
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const skus = item._id.skus;
          const tipoExhibicionHomologado = item._id.tipo_exhibicion_homologado;
          const pocNombre = item._id.poc_nombre;
          const pocNombreSV = item._id.poc_nombre_sv;
          const pocDocumentoSV = item._id.poc_documento_sv;
          const region = item._id.region;
          const gerencia = item._id.gerencia;
          const cadena = item._id.cadena;
          const empresaId = item._id.empresa_id;
          const count = item.count;
  
          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
          if (!data[month][marca][skus]) {
            data[month][marca][skus] = {
              tipoExhibicionHomologado,
              pocNombre,
              pocNombreSV,
              pocDocumentoSV,
              region,
              gerencia,
              cadena,
              empresaId,
              count: 0
            };
          }
  
          data[month][marca][skus].count += count;
        });
      }
      // return data; // quien tiene el resultado
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
      const existsMonth = filters.meses && filters.meses.length > 0;
      for (let clave in data) {
        const addColumns = {};
        if (existsMonth) {
          const month = this.getMonthFromWeek(parseInt(clave), year);
          addColumns['MES'] = month;
          addColumns['SEMANA'] = clave;
        } else {
          addColumns['MES'] = months[parseInt(clave) - 1];
        }
        for (let marca in data[clave]) {
          for (let descripcion in data[clave][marca]) {
            jsonData.push({
              'AÑO': year,
              ...addColumns,
              'MARCA': marca,
              'DESCRIPCION': descripcion,
              'TIPO EXHIBICION HOMOLOGADO': data[clave][marca][descripcion].tipoExhibicionHomologado,
              'POC NOMBRE': data[clave][marca][descripcion].pocNombre,
              'NOMBRE SV': data[clave][marca][descripcion].pocNombreSV,
              'DOCUMENTO SV': data[clave][marca][descripcion].pocDocumentoSV,
              'REGION': data[clave][marca][descripcion].region,
              'GERENCIA': data[clave][marca][descripcion].gerencia,
              'CADENA': data[clave][marca][descripcion].cadena,
              'EMPRESA ID': data[clave][marca][descripcion].empresaId,
              'CANTIDAD': data[clave][marca][descripcion].count
            });
          }
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async downloadExcelFileExhibitionContraprestadaMonthlySupervisorVigenteCounts(filterTable: string): Promise<void> {
    try {
      let query = {};
      const filters = JSON.parse(filterTable);
      
      for (let clave in filters) {
        if (clave === 'anio') {
          const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
          const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
          query['fecha_creacion'] = { 
            $gte: startOfYear,
            $lt: endOfYear
          };
        }
        if (clave === 'supervisor' && filters.supervisor.length > 0) {
          query['poc.documento_sv'] = { $in: filters.supervisor };
        }
        if (clave === 'cliente' && filters.cliente.length > 0) {
          query['empresa_id'] = { $in: filters.cliente };
        } 
        if (clave === 'tienda' && filters.tienda.length > 0) {
          query['poc.nombre'] = { $in: filters.tienda };
        }
        if (clave === 'cadena' && filters.cadena.length > 0) {
          query['poc.cadena'] = { $in: filters.cadena };
        }
        if (clave === 'gerencia' && filters.gerencia.length > 0) {
          query['poc.gerencia'] = { $in: filters.gerencia };
        }
        if (clave === 'region' && filters.region.length > 0) {
          query['poc.region'] = { $in: filters.region };
        }
        if (clave === 'tipo' && filters.tipo.length > 0) {
          query['poc.tipo'] = { $in: filters.tipo };
        }
      }
  
      // Agregar filtro de meses específicos
      let monthMatchStage = {};
      if (filters.meses && filters.meses.length > 0) {
        monthMatchStage = {
          $expr: { $in: [{ $month: '$fecha_creacion_modificada' }, filters.meses.map(Number)] }
        };
      }
  
      const result = await ExhibicionContraprestadaModel.aggregate([
        { $match: query },
        {
          $addFields: {
            fecha_creacion_modificada: {
              $subtract: ['$fecha_creacion', 5 * 60 * 60 * 1000] // Restar 5 horas en milisegundos
            }
          }
        },
        // Filtrar solo los meses especificados si existen en filters.meses
        { $match: monthMatchStage },
  
        // Agrupar por mes, supervisor, vigente, y otros campos adicionales
        {
          $group: {
            _id: {
              month: { $month: '$fecha_creacion_modificada' },
              supervisor: '$poc.nombre_sv',
              vigente: '$vigente',
              tipoExhibicionHomologado: '$tipo_exhibicion_homologado',
              pocNombre: '$poc.nombre',
              pocNombreSV: '$poc.nombre_sv',
              pocDocumentoSV: '$poc.documento_sv',
              empresaId: '$empresa_id',
              region: '$poc.region',
              gerencia: '$poc.gerencia',
              cadena: '$poc.cadena'
            },
            count: { $sum: 1 }
          }
        },
  
        // Reestructurar la agrupación para tener los supervisores agrupados por mes
        {
          $group: {
            _id: {
              month: '$_id.month',
              supervisor: '$_id.supervisor',
              tipoExhibicionHomologado: '$_id.tipoExhibicionHomologado',
              pocNombre: '$_id.pocNombre',
              pocNombreSV: '$_id.pocNombreSV',
              pocDocumentoSV: '$_id.pocDocumentoSV',
              empresaId: '$_id.empresaId',
              region: '$_id.region',
              gerencia: '$_id.gerencia',
              cadena: '$_id.cadena'
            },
            vigente_counts: {
              $push: {
                vigente: '$_id.vigente',
                count: '$count'
              }
            }
          }
        },
  
        // Reestructurar de nuevo para tener los meses como la agrupación principal
        {
          $group: {
            _id: '$_id.month',
            supervisors: {
              $push: {
                supervisor: '$_id.supervisor',
                tipoExhibicionHomologado: '$_id.tipoExhibicionHomologado',
                pocNombre: '$_id.pocNombre',
                pocNombreSV: '$_id.pocNombreSV',
                pocDocumentoSV: '$_id.pocDocumentoSV',
                empresaId: '$_id.empresaId',
                region: '$_id.region',
                gerencia: '$_id.gerencia',
                cadena: '$_id.cadena',
                counts: '$vigente_counts'
              }
            }
          }
        },
  
        // Ordenar por mes
        {
          $sort: {
            '_id': 1
          }
        }
      ]);
  
      // Formatear la salida para organizar los resultados como esperas
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const year = filters.anio[0];
      const jsonData: any = [];
  
      result.forEach((monthGroup: any) => {
        monthGroup.supervisors.forEach((supervisor: any) => {
          jsonData.push({
            'AÑO': year,
            'MES': months[monthGroup._id - 1],
            'TIPO EXHIBICION HOMOLOGADO': supervisor.tipoExhibicionHomologado,
            'POC NOMBRE': supervisor.pocNombre,
            'NOMBRE SV': supervisor.supervisor,
            'DOCUMENTO SV': supervisor.pocDocumentoSV,
            'REGION': supervisor.region,
            'GERENCIA': supervisor.gerencia,
            'CADENA': supervisor.cadena,
            'EMPRESA ID': supervisor.empresaId,
            'CONFIRMADO': supervisor.counts.find((c: any) => c.vigente === true)?.count || 0,
            'PENDIENTE': supervisor.counts.find((c: any) => c.vigente === false)?.count || 0
          });
        });
      });
  
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', WTF: true });
      return buffer;
  
    } catch (error: unknown) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
  // contraprestada end
  
  async downloadExcelPlantilla(entity): Promise<any> {
    try {
      if (!entity) throw new Error('Entity not found');
      const nameContainer =  Constantes.NAME_CONTAINER_PANTILLA_FOR_ENTITY[entity];
      const namePlantilla = Constantes.NAME_PANTILLA_FOR_ENTITY[entity];
      let fileUrlPlantilla: any = "";
      try {
        fileUrlPlantilla = await this.azureStorageService.downloadFile(
          nameContainer,
          namePlantilla
        );
      } catch (error) {
        console.error("Error input storage: ", error);
        throw new Error("Error al descargar el archivo al storage");
      }
      
      return {success: true, file_url: fileUrlPlantilla} as any; 
    } catch (err) {
        console.error('Error exporting data:', err);
        throw err;
      }
  };

  private getMonthFromWeek(week: number, year: number): string {
    // Crea una nueva fecha a partir del primer día del año
    const firstDayOfYear = new Date(year, 0, 1);

    // Calcula la fecha correspondiente al primer lunes del año
    const firstMonday = new Date(
        firstDayOfYear.setDate(
            firstDayOfYear.getDate() + ((1 - firstDayOfYear.getDay() + 7) % 7)
        )
    );

    // Calcula la fecha correspondiente al inicio de la semana especificada
    const weekDate = new Date(
        firstMonday.setDate(firstMonday.getDate() + (week - 1) * 7)
    );

    // Obtén el mes correspondiente a la fecha calculada
    const month = weekDate.toLocaleString('es-ES', { month: 'long' });
    return month;
  }
}