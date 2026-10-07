import Model from '../db/index';
import xlsx from "xlsx";
import { format, parse, startOfDay } from "date-fns";
import { ObjectId } from "mongodb";
import { ExhibicionContraprestada, ExhibicionContraprestadaModel } from '../models/exhibicionContraprestada.model';
import { ADLS_SAS_TOKEN_USER } from '../config';
import { addHours, endOfDay, formatISO, parseISO, startOfMonth, subDays, subHours } from 'date-fns';
import { UsuarioService } from './usuario.service';
import { EstructuraComercialService } from './estructuraComercial.service';
import filterDateRange from '../utils/filterDateRange';
import { PocsService } from './pocs.service';
// import Constantes from "../utils/constant";
// import { PocModel } from '../models/poc.model';

export class ExhibicionContraprestadaService {
  exhibicionContraprestada = Model.collection('exhibicion_contraprestada');
  estructuraComercialCollection = Model.collection('estructura_comercial');
//   exhibicionContraprestada = Model.collection('exhibiciones_contraprestadas');
  public userService =  new UsuarioService();
  public estructuraComercial = new EstructuraComercialService();
  public pocService =  new PocsService();
  currentDate = format(
    new Date().setHours(0, 0, 0, 0),
    "yyyy-MM-dd'T'HH:mm:ss"
  );

  constructor() {}

  public async getExhibicionesContraprestadas(poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false,startOfMonth:string,endOfMonth:string,user_id:string,filterTable: string | undefined) {
    try {
      let query = {};
      if (!isPaginate) {
        const contraprestadas = await this.exhibicionContraprestada.find(query).project({ fecha_inicio: 1, fecha_fin: 2, poc: 3, poc_nombre: 4, empresa_id: 5,validaciones:6,fecha_creacion:7 }).toArray();
        return {
          listContraprestadas: contraprestadas.map((contraprestada: any) => ({
            ...contraprestada,            
            fecha_creacion: subHours(contraprestada.fecha_creacion, 5),
            validaciones: contraprestada?.validaciones?.map((val: any) => ({...val,
              fecha_creacion: subHours(val?.fecha_creacion, 5),
              imagenes: val?.imagenes?.map((img:any) => ({...img,url: `${img.url}?${ADLS_SAS_TOKEN_USER}`}))
            })),            
          }))
        };
      }

      query = {};
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(startOfMonth, endOfMonth);
      query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date } };
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
      // console.log('query', query);
      // const dataResult = await ExhibicionContraprestadaModel.aggregate([
      //   { $match: query }, // Aplica los filtros
      //   { $sort: { fecha_ultimo_relevo: -1, fecha_creacion: -1 } }, // Ordena los resultados
      //   { $skip: (pageIndex - 1) * pageSize }, // Paginación: salta los primeros documentos
      //   { $limit: pageSize }, // Límite por página
      // ]).allowDiskUse(true);   
      // console.log('dataResult', dataResult);
      const data = await ExhibicionContraprestadaModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true, sort: { fecha_ultimo_relevo: -1, fecha_creacion: -1  }});
      data.docs = data?.docs?.map((exhibicion: any) => ({
        ...exhibicion,
        fecha_creacion: subHours(exhibicion.fecha_creacion, 5),
        validaciones: exhibicion?.validaciones?.map((val: any) => (
          {
            ...val,
            fecha_creacion: subHours(val?.fecha_creacion, 5),
            imagenes: val?.imagenes?.map((img:any) => ({...img,url: `${img.url}?${ADLS_SAS_TOKEN_USER}`}))
        })),
        fecha_ultimo_relevo: exhibicion.fecha_ultimo_relevo ? subHours(exhibicion.fecha_ultimo_relevo, 5) : null,
    }))
      return { ...data };

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones contraprestadas:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones contraprestadas:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async getFiltersContraprestada(startOfMonth:string,endOfMonth:string) {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(startOfMonth, endOfMonth);
      const dateRangeFilter = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date } }
      // Obtener todos los valores únicos
      const [exhibicionPocIds, exhibicionPocNombres, exhibicionCadenas] = await Promise.all([
        ExhibicionContraprestadaModel.distinct('poc.poc', {
          ...dateRangeFilter,
          'poc.poc': { $ne: null }
        }),
        ExhibicionContraprestadaModel.distinct('poc.nombre', {
          ...dateRangeFilter,
          'poc.nombre': { $ne: null }
        }),
        ExhibicionContraprestadaModel.distinct('poc.cadena', {
          ...dateRangeFilter,
          'poc.cadena': { $ne: null }
        })
      ]);
      return { 
        poc: exhibicionPocIds,
        nombre: exhibicionPocNombres,
        cadena: exhibicionCadenas,
      };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibitionContraMonthlySupervisorVigenteCounts(filterTable: string) {
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

      // Agregar filtro de linea_homologada
      if (filters.linea && filters.linea.length > 0) {
        query['linea_homologada'] = { $in: filters.linea };
      }

      // Agregar filtro de meses específicos
      let monthMatchStage = {};
      if (filters.meses && filters.meses.length > 0) {
        monthMatchStage = {
          $expr: { $in: [{ $month: '$fecha_creacion_modificada' }, filters.meses.map(Number)] }
        };
      }

      const result = await ExhibicionContraprestadaModel.aggregate([
        // Filtrar documentos dentro del año especificado
        { $match: query },
    
        // Restar 5 horas a la fecha de creación
        {
          $addFields: {
            fecha_creacion_modificada: {
              $subtract: ['$fecha_creacion', 5 * 60 * 60 * 1000] // Restar 5 horas en milisegundos
            }
          }
        },
    
        // Filtrar solo los meses especificados si existen en filters.meses
        { $match: monthMatchStage },

        // Agrupar por mes, luego por supervisor y contar por cada valor de vigente (true, false)
        {
          $group: {
            _id: {
              month: { $month: '$fecha_creacion_modificada' },
              supervisor: '$poc.nombre_sv',
              vigente: '$vigente'
            },
            count: { $sum: 1 }
          }
        },
    
        // Reestructurar la agrupación para tener los supervisores agrupados por mes
        {
          $group: {
            _id: {
              month: '$_id.month',
              supervisor: '$_id.supervisor'
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
      const formattedResult = result.map(monthGroup => {
        const month = monthGroup._id;
        const supervisors = monthGroup.supervisors.map(supervisorGroup => {
          const supervisor = supervisorGroup.supervisor;
          const counts = { true: 0, false: 0 };
    
          supervisorGroup.counts.forEach(countObj => {
            counts[countObj.vigente.toString()] = countObj.count;
          });
    
          return {
            supervisor,
            counts
          };
        });
    
        return {
          month,
          supervisors
        };
      });
    
      return formattedResult;
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibitionContraprestadaCountsByTypeMonthAndWeek(filterTable: string) {
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
  
        // Agrupar por semana y tipo de exhibición
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              tipo_exhibicion_homologado: "$tipo_exhibicion_homologado"
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
        // Si no se seleccionan meses, agrupar por mes y tipo de exhibición
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              tipo_exhibicion_homologado: "$tipo_exhibicion_homologado"
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
          const tipoExhibicion = item._id.tipo_exhibicion_homologado;
          const count = item.count;
  
          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][tipoExhibicion]) {
            data[week][tipoExhibicion] = 0;
          }
  
          data[week][tipoExhibicion] += count;
        });
      } else {
        // Si se agrupa por mes
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const tipoExhibicion = item._id.tipo_exhibicion_homologado;
          const count = item.count;
  
          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][tipoExhibicion]) {
            data[month][tipoExhibicion] = 0;
          }
  
          data[month][tipoExhibicion] += count;
        });
      }
  
      return data;
  
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibitionContraprestadaCountsByBrandMonthAndWeek(filterTable: string, typesExhibitions: string) {
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
  
        // Agrupar por semana y tipo de exhibición
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$marca_homologada"
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
        // Si no se seleccionan meses, agrupar por mes y tipo de exhibición
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$marca_homologada"
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
          const tipoExhibicion = item._id.marca;
          const count = item.count;
  
          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][tipoExhibicion]) {
            data[week][tipoExhibicion] = 0;
          }
  
          data[week][tipoExhibicion] += count;
        });
      } else {
        // Si se agrupa por mes
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const tipoExhibicion = item._id.marca;
          const count = item.count;
  
          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][tipoExhibicion]) {
            data[month][tipoExhibicion] = 0;
          }
  
          data[month][tipoExhibicion] += count;
        });
      }
  
      return data;
  
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, typesExhibitions: string, marcas: string) {
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

        // Agrupar por semana, marca y SKU
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$marca_homologada",
              skus: "$sku_homologado"
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
        // Si no se seleccionan meses, agrupar por mes, marca y SKU
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$marca_homologada",
              skus: "$sku_homologado"
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
          const count = item.count;

          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
          if (!data[week][marca][skus]) {
            data[week][marca][skus] = 0;
          }

          data[week][marca][skus] += count;
        });
      } else {
        // Si se agrupa por mes
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const skus = item._id.skus;
          const count = item.count;

          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
          if (!data[month][marca][skus]) {
            data[month][marca][skus] = 0;
          }

          data[month][marca][skus] += count;
        });
      }

      return data;

    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibicionesContraprestadasAlertasVigente(app: string,poc: number,accion:string,user_id:string) {
    try {
      const currentDate = new Date(new Date().toUTCString());
      // const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const startOfDay = new Date(subHours(currentDate, 5).setUTCHours(0, 0, 0, 0));
      // const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      const vigenteFilter = accion === 'vigentes' ? true : false;
      // const contraprestadas = await this.exhibicionContraprestada.find({
      //   empresa_id: app,
      //   "poc.poc": poc,
      //   fecha_inicio: { $lte: currentDate },
      //   fecha_fin: { $gte: currentDate },
      //   vigente: vigenteFilter
      // }).project({
      //   _id: 1,
      //   empresa_id: 1,
      //   zona: 1,
      //   tipo_exhibicion: 1,
      //   correlativo: 1,
      //   tienda: 1,
      //   campaña: 1,
      //   fecha_inicio: 1,
      //   fecha_fin: 1,
      //   marca: 1,
      //   skus: 1,
      //   vigente: 1,
      //   fecha_creacion: 1,
      //   'poc.poc': 1,
      //   'poc.nombre': 1,
      //   'poc.nombre_planning': 1,
      //   'poc.tipo': 1,
      //   'poc.poc_backus': 1,
      //   'poc.poc_cadena': 1,
      //   'poc.documento_sv': 1,
      //   'poc.nombre_sv': 1,
      //   validaciones: 1,
      //   imagenes: 1,
      //   'usuario.usuario_id': 1,
      //   'usuario.nombre': 1,
      //   // 'usuario.rol': 1
      // }).sort({ fecha_creacion: 1 }).toArray();
      const contraprestadas = await this.exhibicionContraprestada.aggregate([
        {
          $match: {
            empresa_id: app,
            "poc.poc": poc,
            fecha_inicio: { $lte: subHours(currentDate, 5) },
            // fecha_fin: { $gte: currentDate },
            fecha_fin: { $gte: startOfDay },
            vigente: vigenteFilter
          }
        },
        {
          $addFields: {
            correlativoNumerico: { $toInt: "$correlativo" }
          }
        },
        {
          $sort: {
            correlativoNumerico: 1 // 1 para ascendente, -1 para descendente
          }
        },
        {
          $project: {
            // ... resto de los campos del project
            correlativoNumerico: 0 // eliminar el campo temporal
          }
        }
      ]).toArray();
      const contraprestadas_data = contraprestadas.map(item => {
        item.validaciones = item.validaciones?.map(validacion => {
            validacion.imagenes = validacion.imagenes.map(imagen => {
                imagen.url = `${imagen.url}?${ADLS_SAS_TOKEN_USER}`;
                imagen.fecha_creacion = subHours(imagen.fecha_creacion, 5);
                return imagen;
            });
            return validacion;
        });
        item.fecha_creacion = subHours(item.fecha_creacion, 5)
        return item;
      });
      // const sucursalesFiltradas = contraprestadas_data.filter(contraprestada => {       
      //    if (accion === 'vigentes') {          
      //      return contraprestada.vigente === true;
      //    }else if (accion === 'alertas') {
      //      return contraprestada.vigente === false;
      //   }       
      //  });
      // return { listContraprestadas: sucursalesFiltradas };
      return { listContraprestadas: contraprestadas_data };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones contraprestadas:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones contraprestadas:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibicionesContraprestadasOffline() {
    try {
      const fechaPeru = new Date(subHours(new Date(), 5).setUTCHours(0, 0, 0, 0)); //restamos 5 horas para obtener la hora de peru

      const currentDate = new Date();
      const fecha_inicio = new Date(new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), 1).setUTCHours(0, 0, 0, 0));
      const result = await this.exhibicionContraprestada.find({
        fecha_inicio: { $lte: currentDate },
        fecha_fin: { $gte: currentDate }
      }).toArray();
      
      // const result = await this.exhibicionContraprestada.find({
      //   vigente: false
      // }).toArray();

      return { result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones contraprestadas offline:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones contraprestadas offline:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }


  public async updateExhibicionesContraprestadasVigentes(id:string, data:any) {
    try {      
      
      const filter = { _id: new ObjectId(id) };
      // const nowUTC = new Date();
      
      
      
      // const update = { $set: { vigente: true,validaciones:[{imgUrl : data.imgUrl, comentario: data.comentario,created_at:data.created_at,comentarios_adicionales:data.comentarios_adicionales}] } };
      // if (data.type_contra == 'confirmar') {
      //   let documento_sv:string='';
      //   let nombre_sv:string='';  
      //   const result_value = await this.estructuraComercialCollection.findOne({poc:data.poc});
      //     if (result_value) {
      //       documento_sv = result_value.documento_sv;
      //       nombre_sv = result_value.nombre_sv;
      //     }        
      //     set = {vigente: true,documento_sv:documento_sv,nombre_sv:nombre_sv}
      // }else{
      //   set = {vigente: true}
      // }
      if (data.offline == 1) {
        // haciendo esto por si algun usuario no actualizo la pagina web en su celular
        data.fecha_ultimo_relevo = data.fecha_ultimo_relevo ? new Date(data.fecha_ultimo_relevo) : new Date(new Date().toUTCString());
      } else {
        data.fecha_ultimo_relevo = new Date(new Date().toUTCString());
      }
      let set: any ={vigente: true, fecha_ultimo_relevo: data.fecha_ultimo_relevo};
      if (data.tipo_mueble === 0 || data.tipo_mueble === 1) {
        set["tipo_mueble"] = data.tipo_mueble;
      }
      const update = {
        $set:  set ,
        $push: {"validaciones": {
              comentario: data.comentario,
              fecha_creacion: data.offline >0 ? new Date(data.fecha_creacion) :new Date(new Date().toUTCString()),
              comentarios_adicionales: data.comentarios_adicionales,
              usuario_id: data.usuario_id,
              usuario_nombre: data.usuario_nombre,
              // imagenes: data.imagenes,
              imagenes: data.imagenes.map(imagen => ({
                ...imagen,
                fecha_creacion: data.offline > 0 ? new Date(imagen.fecha_creacion) : new Date(new Date().toUTCString()),
              })),
              offline: data.offline
            }}
      };
      const result = await this.exhibicionContraprestada.updateOne(
        filter,
        update as any
      );      
      
      const insertedId = result;
      return { id: insertedId };
    } catch (error) {
      console.error("Error al obtener:", error);
      return { error: "Error interno del servidor" };
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

  public async exhibicionesContraprestadasBullUpload(data: any) {
    try {
      data.forEach(exhibicion => {
        exhibicion.fecha_creacion = new Date(new Date().toUTCString());
        let fechaInicio = new Date(exhibicion.fecha_inicio);
        exhibicion.fecha_inicio = new Date(fechaInicio.setUTCHours(0, 0, 0, 0));

        // Para fecha_fin
        let fechaFin = new Date(exhibicion.fecha_fin);
        exhibicion.fecha_fin = new Date(fechaFin.setUTCHours(0, 0, 0, 0));
      });
      const result = await this.exhibicionContraprestada.insertMany(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de contraprestada:', error.message);
      } else {
        console.error('Error al guardar los datos de contraprestada:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async exhibicionesContraprestadaValidateRecordsDatabse(file: any): Promise<any[]> {
    try {
      const fileBuffer = file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const duplicados: any = [];
      const batchIterator = this.processExcelInBatches(sheet);

      for await (const batch of batchIterator) {
        const pipeline = [
          {
            $match: {
              $or: batch.map((row: any) => ({
                empresa_id: row.empresa_id,
                zona: row.zona,
                tipo_exhibicion: row.tipo_exhibicion,
                tipo_exhibicion_homologado: row.tipo_exhibicion_homologado,
                correlativo: row.correlativo,
                tienda: { 
                  $in: [ // usamos $in para comparar tanto con el valor original como con su versión convertida a número (si es posible)
                    row.tienda, 
                    isNaN(row.tienda) ? row.tienda : parseInt(row.tienda)
                  ]
                },
                campaña: row.campaña,
                fecha_inicio: new Date((new Date(row.fecha_inicio)).setUTCHours(0, 0, 0, 0)),
                fecha_fin: new Date((new Date(row.fecha_fin)).setUTCHours(0, 0, 0, 0)),
                marca: row.marca,
                skus: row.skus,
                'poc.nombre': row.poc_nombre
              }))
            }
          },
          {
            $group: {
              _id: null,
              duplicados: { $push: "$$ROOT" }
            }
          }
        ];

        const result = await ExhibicionContraprestadaModel.aggregate(pipeline);
        const duplicadosSet = new Set(result[0]?.duplicados.map(doc => 
          `${doc.empresa_id}|${doc.zona}|${doc.tipo_exhibicion}|${doc.tipo_exhibicion_homologado}|${doc.correlativo.toString()}|${doc.tienda.toString()}|${doc.campaña}|${doc.fecha_inicio.toISOString().split('T')[0]}|${doc.fecha_fin.toISOString().split('T')[0]}|${doc.marca}|${doc.skus}|${doc.poc.nombre}`
        ) || []);
  
        batch.forEach((row: any) => {
          const fechaInicio = new Date((new Date(row.fecha_inicio)).setUTCHours(0, 0, 0, 0));
          const fechaFin = new Date((new Date(row.fecha_fin)).setUTCHours(0, 0, 0, 0));
          const key = `${row.empresa_id}|${row.zona}|${row.tipo_exhibicion}|${row.tipo_exhibicion_homologado}|${row.correlativo.toString()}|${row.tienda.toString()}|${row.campaña}|${fechaInicio.toISOString().split('T')[0]}|${fechaFin.toISOString().split('T')[0]}|${row.marca}|${row.skus}|${row.poc_nombre}`;
          if (duplicadosSet.has(key)) {
            duplicados.push(row);
          }
        });
      }
      return { status: 'success', message: 'verificación exitoso.', data: duplicados, } as any;
    } catch (error) {
      throw error;
    }
  }

  processExcelInBatches(sheet, batchSize = 1000) {
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });
    return {
      [Symbol.asyncIterator]: async function* () {
        for (let i = 0; i < rows.length; i += batchSize) {
          yield rows.slice(i, i + batchSize);
        }
      }
    };
  }
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
