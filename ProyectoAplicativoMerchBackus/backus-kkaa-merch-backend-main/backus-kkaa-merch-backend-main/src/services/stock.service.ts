import Model from '../db/index';
import { ADLS_SAS_TOKEN_USER } from '../config';
import { StockModel } from '../models/stock.model';
import { UsuarioService } from './usuario.service';
import { PocsService } from './pocs.service';
import filterDateRange from '../utils/filterDateRange';
import { subHours } from 'date-fns';

export class StockService {
  categorias = Model.collection('sku');
  stock = Model.collection('stock');
  public userService =  new UsuarioService();
  public pocService =  new PocsService();
  
  constructor() { }

  public async saveStock(data: any) {
    try {
      if(data.offline == 1){
        const stockResponse = await this.stock.find({stock_id: data.stock_id}).toArray();
        if(stockResponse.length > 0){
          return { success: false, message: 'El stock_id ya existe en la base de datos' };
        }
      }
      // data.fecha_creacion = new Date(new Date().toUTCString());
      data.fecha_creacion = data.offline == 1 ? new Date(data.fecha_creacion) : new Date(new Date().toUTCString());
      await this.stock.insertOne(data);
      return { success: true, message: 'Operación con éxito' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de stock:', error.message);
      } else {
        console.error('Error al guardar los datos de stock:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getStocks(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string) {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
      let query = {fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date }};
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
      
      const options = {
        page: pageIndex || 1,
        limit: pageSize || 10,
        sort: { fecha_creacion: -1 },
        lean: true,
        leanWithId: true
      };
      
      const data = await StockModel.paginate(query, options);
      data.docs = data?.docs?.map((stock: any) => ({
        ...stock, 
        fecha_creacion: subHours(stock.fecha_creacion, 5),
      }));
      return { ...data };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getStockAverageByDescriptionMonthAndWeek(filterTable: string) {
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
      aggregatePipeline.push({
        $match: query,
      });
  
      // Descomponer el array de SKUs
      aggregatePipeline.push({
        $unwind: "$skus",
      });
  
      // Calcular el promedio para cada registro
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
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
            },
            avg_promedio_stock: { $avg: "$skus.promedio_stock" },
          },
        });
  
        aggregatePipeline.push({
          $sort: { "_id.week": 1 },
        });
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$adjusted_fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
            },
            avg_promedio_stock: { $avg: "$skus.promedio_stock" },
          },
        });
  
        aggregatePipeline.push({
          $sort: { "_id.month": 1 },
        });
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
  
        // data[period][marca][descripcion] = {
        //   avgPromedioStock: item.avg_promedio_stock.toFixed(2),
        // };
        data[period][marca][descripcion] = item.avg_promedio_stock;
      });
  
      return data;
    } catch (error: unknown) {
      throw new Error("Error interno del servidor");
    }
  }

  public async getStockSeparateAveragesByDescriptionMonthAndWeek(filterTable: string) {
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
          // avgGondolaStock: item.avg_gondola_stock.toFixed(2),
          // avgExhibicionStock: item.avg_exhibicion_stock.toFixed(2),
          avgGondolaStock: item.avg_gondola_stock,
          avgExhibicionStock: item.avg_exhibicion_stock,
        };
      });
  
      return data;
    } catch (error: unknown) {
      throw new Error("Error interno del servidor");
    }
  }

  public async getStockStoreAveragesByDescriptionMonthAndWeek(filterTable: string) {
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
  
      // Calcular el promedio de gondola_stock y exhibicion_stock para cada registro
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
              tienda: "$poc.nombre",
              descripcion: "$skus.descripcion",
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
              tienda: "$poc.nombre",
              descripcion: "$skus.descripcion",
            },
            avg_promedio_stock: { $avg: "$skus.promedio_stock" },
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
        const tienda = item._id.tienda;
        const descripcion = item._id.descripcion;
  
        if (!data[period]) {
          data[period] = {};
        }
        if (!data[period][tienda]) {
          data[period][tienda] = {};
        }
  
        // data[period][tienda][descripcion] = {
        //   avgPromedioStock: item.avg_promedio_stock,
        // };
        data[period][tienda][descripcion] = item.avg_promedio_stock;
      });
  
      return data;
    } catch (error: unknown) {
      throw new Error("Error interno del servidor");
    }
  }
}