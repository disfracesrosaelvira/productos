import Model from '../db/index';
import { format, subHours } from "date-fns";
import { ADLS_SAS_TOKEN_USER } from '../config';
import { PrecioModel } from '../models/precio.model';
import { UsuarioService } from './usuario.service';
import { PocsService } from './pocs.service';
import filterDateRange from '../utils/filterDateRange';

export class PrecioService {
  marcas = Model.collection('sku');
  productos = Model.collection('sku');
  precioInput = Model.collection('precio');
  public userService =  new UsuarioService();
  public pocService =  new PocsService();
  currentDate = format(
    new Date().setHours(0, 0, 0, 0),
    "yyyy-MM-dd'T'HH:mm:ss"
  );

  constructor() {}

  public async getMarca(response: any) {
    const { empresa_id } = response;
    // const marca = ['Amstel', 'Heineken', 'Tres Cruces', 'Pum Pum'] // marca: { $in: marca } // se comenta por petiicion Luis - Gilder
    try {
      const productos = await this.marcas.find({ empresa_id: empresa_id, competencia: 1 }).project({ descripcion: 1, marca: 1 }).toArray();
      return { listMarcas: productos};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los productos:', error.message);
      } else {
        console.error('Error al obtener los productos:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  } 

  public async getMarcasCompetencia(response: any) {
    const { empresa_id } = response;
    const marca = ['Amstel', 'Heineken', 'Tres Cruces', 'Pum Pum']
    try {
      // const productos = await this.marcas.find({ empresa_id: empresa_id, marca: { $in: marca } }).project({ descripcion: 1, marca: 1 }).toArray();
      const productos = await this.marcas.distinct('marca', { empresa_id: empresa_id, marca: { $in: marca } });
      return { listMarcas: productos};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los productos:', error.message);
      } else {
        console.error('Error al obtener los productos:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  } 

  public async getProductos(empresa_id: any, marca: any) {
    try {
      const productos = await this.productos.find({ empresa_id, marca })
      .project({ descripcion: 1, empresa_id: 2, imagen: 3, marca: 4, sku:5 })
      .sort({ descripcion: 1 })
      .toArray();
      return { listProductos: productos.map((producto: any) => ({ descripcion: producto.descripcion, empresa_id: producto.empresa_id, foto: `${producto.imagen}?${ADLS_SAS_TOKEN_USER}`, marca: producto.marca, sku: producto.sku}))};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los productos:', error.message);
      } else {
        console.error('Error al obtener los productos:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  
  public async getProductosAllByApp(empresa_id: any) {
    const marca = ['Amstel', 'Heineken', 'Tres Cruces']
    try {
      const productos = await this.productos.find({ empresa_id: empresa_id, marca: { $in: marca } }).project({ descripcion: 1, empresa_id: 1, sku: 1, marca: 1 }).toArray();
      return { listProductos: productos};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los productos:', error.message);
      } else {
        console.error('Error al obtener los productos:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  } 
  public async savePrecioInput(data: any) {
    try {
      // if (!data || !Array.isArray(data) || data.length === 0) {
      //   throw new Error('Datos inválidos para guardar');
      // }
      if(data.offline == 1){
        const precioResponse = await this.precioInput.find({precio_id: data.precio_id}).toArray();
        if(precioResponse.length > 0){
          return { success: false, message: 'El precio_id ya existe en la base de datos' };
        }
      }
      data?.skus?.forEach((item: any) => {
        item.pvp_regular = parseFloat(item.pvp_regular);
        const parsedPvpPromocional = parseFloat(item.pvp_promocional);
        if (!isNaN(parsedPvpPromocional)) {
            item.pvp_promocional = parsedPvpPromocional;
        } else {
            delete item.pvp_promocional;
        }
        const parsedPvpAdicional = parseFloat(item.pvp_adicional);
        if (!isNaN(parsedPvpAdicional)) {
            item.pvp_adicional = parsedPvpAdicional;
        } else {
            delete item.pvp_adicional;
        }
        // if (data?.offline > 0){
          delete item.codeParent;
        // }
      });

      if (data?.offline == 1) {
        data.fecha_creacion = new Date(data.fecha_creacion);
      } else {
        data.fecha_creacion = new Date(new Date().toUTCString());
      }

      const result = await this.precioInput.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de precio:', error.message);
      } else {
        console.error('Error al guardar los datos de precio:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getPrecios(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string) {
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

      const options = {
        page: pageIndex || 1,
        limit: pageSize || 10,
        sort: { fecha_creacion: -1 },
        lean: true,
        leanWithId: true,
      };
  
      const data = await PrecioModel.paginate(query, options);
      data.docs = data?.docs?.map((price: any) => ({
        ...price, 
        fecha_creacion: subHours(price.fecha_creacion, 5),
        skus: price?.skus?.map((sku: any) => ({...sku, 
          pvp_regular: parseFloat(sku.pvp_regular), 
          pvp_promocional: parseFloat(sku.pvp_promocional),
          pvp_adicional: parseFloat(sku.pvp_adicional),
          imagen_url: `${sku.imagen_url}?${ADLS_SAS_TOKEN_USER}`}))
      }));
      
      return { ...data };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los precios:', error.message);
      } else {
        console.error('Error al obtener los precios:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async getPrecioCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, marcas: string) {
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
  
      // Filtro condicional de marcas
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
  
      // Agregar el cálculo de diferencia de precios
      // aggregatePipeline.push({
      //   $addFields: {
      //     diferencia_pvp: {
      //       $subtract: [
      //         "$skus.pvp_regular",
      //         { $ifNull: ["$skus.pvp_promocional", 0] }
      //       ]
      //     }
      //   }
      // });
      aggregatePipeline.push({
        $addFields: {
          diferencia_pvp: {
            $cond: {
              if: { $ifNull: ["$skus.pvp_promocional", null] }, // Verifica si pvp_promocional está presente
              then: { $subtract: ["$skus.pvp_regular", "$skus.pvp_promocional"] },
              else: { $subtract: ["$skus.pvp_regular", "$skus.pvp_regular"] } // Caso en el que se reste a sí mismo
            }
          }
        }
      });
  
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
  
        // Agrupar por semana y marca, sumando la diferencia de precios
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion"
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
        // Agrupar por mes y marca, sumando la diferencia de precios
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion"
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
  
      if (filters.meses && filters.meses.length > 0) {
        // Inicializar la estructura de datos por semanas
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const promedioDiferencia = item.promedio_diferencia_pvp;
  
          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
          if (!data[week][marca][descripcion]) {
            data[week][marca][descripcion] = 0;
          }
  
          data[week][marca][descripcion] = promedioDiferencia;
        });
      } else {
        // Inicializar la estructura de datos por meses
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const promedioDiferencia = item.promedio_diferencia_pvp;
  
          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
          if (!data[month][marca][descripcion]) {
            data[month][marca][descripcion] = 0;
          }
  
          data[month][marca][descripcion] = promedioDiferencia;
        });
      }
  
      return data;

    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getPrecioAveragesByBrandAndDescriptionByMonthAndWeek(filterTable: string) {
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
  
      // // Filtro condicional de marcas
      // if (marcas) {
      //   const listMarcas = JSON.parse(marcas);
      //   if (listMarcas.length > 0) {
      //     aggregatePipeline.push({
      //       $match: {
      //         'skus.marca': { $in: listMarcas }
      //       }
      //     });
      //   }
      // }
  
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
  
        // // Agrupar por semana y marca, calculando los promedios
        // aggregatePipeline.push({
        //   $group: {
        //     _id: {
        //       week: { $isoWeek: "$fecha_creacion" },
        //       marca: "$skus.marca",
        //       descripcion: "$skus.descripcion"
        //     },
        //     avg_pvp_regular: { $avg: "$skus.pvp_regular" },
        //     avg_pvp_promocional: { $avg: { $ifNull: ["$skus.pvp_promocional", 0] } },
        //     avg_pvp_adicional: { $avg: { $ifNull: ["$skus.pvp_adicional", 0] } }
        //   }
        // });

        // Agrupar por semana y marca, calculando los promedios
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
            },
            avg_pvp_regular: { $avg: "$skus.pvp_regular" }, // Calcular promedio de todos
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
          },
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // // Agrupar por mes y marca, calculando los promedios
        // aggregatePipeline.push({
        //   $group: {
        //     _id: {
        //       month: { $month: "$fecha_creacion" },
        //       marca: "$skus.marca",
        //       descripcion: "$skus.descripcion"
        //     },
        //     avg_pvp_regular: { $avg: "$skus.pvp_regular" },
        //     avg_pvp_promocional: { $avg: { $ifNull: ["$skus.pvp_promocional", 0] } },
        //     avg_pvp_adicional: { $avg: { $ifNull: ["$skus.pvp_adicional", 0] } }
        //   }
        // });

        // Agrupar por mes y marca, calculando los promedios
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion",
            },
            avg_pvp_regular: { $avg: "$skus.pvp_regular" }, // Calcular promedio de todos
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
          },
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
  
      if (filters.meses && filters.meses.length > 0) {
        // Inicializar la estructura de datos por semanas
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
  
          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
  
          data[week][marca][descripcion] = {
            avg_pvp_regular: item.avg_pvp_regular,
            avg_pvp_promocional: item.avg_pvp_promocional,
            avg_pvp_adicional: item.avg_pvp_adicional
          };
        });
      } else {
        // Inicializar la estructura de datos por meses
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
  
          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
  
          data[month][marca][descripcion] = {
            avg_pvp_regular: item.avg_pvp_regular,
            avg_pvp_promocional: item.avg_pvp_promocional,
            avg_pvp_adicional: item.avg_pvp_adicional
          };
        });
      }
  
      return data;
  
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  // public async getPrecioStructuredByMonthOrWeek(filterTable: string) {
  //   try {
  //       const filters = JSON.parse(filterTable);
  //       let query: any = {};
  //       let aggregatePipeline: any[] = [];

  //       // Filtros iniciales
  //       if (filters.anio) {
  //           const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
  //           const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
  //           query['fecha_creacion'] = { $gte: startOfYear, $lt: endOfYear };
  //       }
  //       if (filters.tienda && filters.tienda.length > 0) {
  //           query['poc.nombre'] = { $in: filters.tienda };
  //       }
  //       if (filters.region && filters.region.length > 0) {
  //           query['poc.region'] = { $in: filters.region };
  //       }

  //       // Ajuste de fecha por zona horaria
  //       aggregatePipeline.push({
  //           $addFields: {
  //               adjusted_fecha_creacion: {
  //                   $dateSubtract: {
  //                       startDate: "$fecha_creacion",
  //                       unit: "hour",
  //                       amount: 5,
  //                   },
  //               },
  //           },
  //       });

  //       // Aplicar filtros iniciales
  //       aggregatePipeline.push({ $match: query });

  //       // Descomponer el array de skus
  //       aggregatePipeline.push({ $unwind: "$skus" });

  //       // Agrupación dinámica por mes o semana
  //       if (filters.meses && filters.meses.length > 0) {
  //           const filteredMonths = filters.meses.map((m) => parseInt(m));
  //           aggregatePipeline.push({
  //               $match: {
  //                   $expr: {
  //                       $in: [{ $month: "$fecha_creacion" }, filteredMonths],
  //                   },
  //               },
  //           });
  //           aggregatePipeline.push({
  //               $group: {
  //                   _id: {
  //                       week: { $isoWeek: "$adjusted_fecha_creacion" },
  //                       tienda: "$poc.nombre",
  //                       descripcion: "$skus.descripcion",
  //                   },
  //                   avg_pvp_regular: { $avg: "$skus.pvp_regular" },
  //                   avg_pvp_promocional: {
  //                       $avg: {
  //                           $cond: [{ $gt: ["$skus.pvp_promocional", 0] }, "$skus.pvp_promocional", null],
  //                       },
  //                   },
  //                   avg_pvp_adicional: {
  //                       $avg: {
  //                           $cond: [{ $gt: ["$skus.pvp_adicional", 0] }, "$skus.pvp_adicional", null],
  //                       },
  //                   },
  //               },
  //           });
  //       } else {
  //           aggregatePipeline.push({
  //               $group: {
  //                   _id: {
  //                       month: { $month: "$adjusted_fecha_creacion" },
  //                       tienda: "$poc.nombre",
  //                       descripcion: "$skus.descripcion",
  //                   },
  //                   avg_pvp_regular: { $avg: "$skus.pvp_regular" },
  //                   avg_pvp_promocional: {
  //                       $avg: {
  //                           $cond: [{ $gt: ["$skus.pvp_promocional", 0] }, "$skus.pvp_promocional", null],
  //                       },
  //                   },
  //                   avg_pvp_adicional: {
  //                       $avg: {
  //                           $cond: [{ $gt: ["$skus.pvp_adicional", 0] }, "$skus.pvp_adicional", null],
  //                       },
  //                   },
  //               },
  //           });
  //       }

  //       // Ordenar por semana o mes
  //       aggregatePipeline.push({ $sort: { "_id.week": 1, "_id.month": 1 } });

  //       // Formatear los resultados
  //       const results = await PrecioModel.aggregate(aggregatePipeline);
  //       const formattedResults: any = {};

  //       results.forEach((item) => {
  //           const period = item._id.week || item._id.month;
  //           const tienda = item._id.tienda;
  //           const descripcion = item._id.descripcion;

  //           if (!formattedResults[period]) {
  //               formattedResults[period] = {};
  //           }
  //           if (!formattedResults[period][tienda]) {
  //               formattedResults[period][tienda] = [];
  //           }

  //           formattedResults[period][tienda].push({
  //               descripcion,
  //               avg_pvp_regular: item.avg_pvp_regular,
  //               avg_pvp_promocional: item.avg_pvp_promocional,
  //               avg_pvp_adicional: item.avg_pvp_adicional,
  //           });
  //       });

  //       return formattedResults;
  //   } catch (error) {
  //       throw new Error("Error interno del servidor");
  //   }
  // }
  
  // public async getStoresWithProductsPromotionalPrice(filterTable: string) {
  //   try {
  //     const filters = JSON.parse(filterTable);
  //     let query: any = {};
  //     let aggregatePipeline: any[] = [];

  //     // Filtros iniciales
  //     if (filters.anio) {
  //       const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
  //       const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
  //       query['fecha_creacion'] = { $gte: startOfYear, $lt: endOfYear };
  //     }
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

  //     // Ajuste de fecha por zona horaria
  //     aggregatePipeline.push({
  //       $addFields: {
  //         adjusted_fecha_creacion: {
  //           $dateSubtract: {
  //             startDate: "$fecha_creacion",
  //             unit: "hour",
  //             amount: 5,
  //           },
  //         },
  //       },
  //     });

  //     // Aplicar filtros iniciales
  //     aggregatePipeline.push({ $match: query });

  //     // Descomponer el array de skus
  //     aggregatePipeline.push({ $unwind: "$skus" });

  //     // Filtro para considerar solo `pvp_promocional` mayor a 0
  //     aggregatePipeline.push({
  //       $match: {
  //         "skus.pvp_promocional": { $gt: 0 },
  //       },
  //     });

  //     // Agrupación dinámica por mes o semana
  //     if (filters.meses && filters.meses.length > 0) {
  //       const filteredMonths = filters.meses.map((m) => parseInt(m));
  //       aggregatePipeline.push({
  //         $match: {
  //           $expr: {
  //             $in: [{ $month: "$fecha_creacion" }, filteredMonths],
  //           },
  //         },
  //       });
  //       aggregatePipeline.push({
  //         $group: {
  //           _id: {
  //             week: { $isoWeek: "$adjusted_fecha_creacion" },
  //             tienda: "$poc.nombre",
  //             descripcion: "$skus.descripcion",
  //           },
  //           avg_pvp_promocional: { $avg: "$skus.pvp_promocional" },
  //         },
  //       });
  //     } else {
  //       aggregatePipeline.push({
  //         $group: {
  //           _id: {
  //             month: { $month: "$adjusted_fecha_creacion" },
  //             tienda: "$poc.nombre",
  //             descripcion: "$skus.descripcion",
  //           },
  //           avg_pvp_promocional: { $avg: "$skus.pvp_promocional" },
  //         },
  //       });
  //     }

  //     // Ordenar por semana o mes
  //     aggregatePipeline.push({ $sort: { "_id.week": 1, "_id.month": 1 } });

  //     // Filtrar agrupaciones donde el promedio es mayor a 0
  //     aggregatePipeline.push({
  //       $match: {
  //         avg_pvp_promocional: { $gt: 0 },
  //       },
  //     });

  //     // Ejecutar la consulta
  //     const results = await PrecioModel.aggregate(aggregatePipeline);

  //     // Estructura de los resultados
  //     const formattedResults: any = {};

  //     results.forEach((item) => {
  //       const period = item._id.week || item._id.month;
  //       const tienda = item._id.tienda;
  //       const descripcion = item._id.descripcion;

  //       if (!formattedResults[period]) {
  //         formattedResults[period] = {};
  //       }
  //       if (!formattedResults[period][tienda]) {
  //         formattedResults[period][tienda] = {};
  //       }

  //       formattedResults[period][tienda][descripcion] = item.avg_pvp_promocional;
  //     });

  //     return formattedResults;
  //   } catch (error) {
  //     throw new Error("Error interno del servidor");
  //   }
  // }

  public async getStoresWithProductsPromotionalPrice(filterTable: string) { // (pvp_regular + pvp_promocional)/2
    try {
      const filters = JSON.parse(filterTable);
      let query: any = {};
      let aggregatePipeline: any[] = [];
  
      // Filtros iniciales
      if (filters.anio) {
        const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
        query['fecha_creacion'] = { $gte: startOfYear, $lt: endOfYear };
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
  
      // Ajuste de fecha por zona horaria
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
  
      // Aplicar filtros iniciales
      aggregatePipeline.push({ $match: query });
  
      // Descomponer el array de skus
      aggregatePipeline.push({ $unwind: "$skus" });
  
      // Filtro para considerar solo `pvp_promocional` mayor a 0
      aggregatePipeline.push({
        $match: {
          "skus.pvp_promocional": { $gt: 0 },
        },
      });
  
      // Calcular el promedio entre `pvp_regular` y `pvp_promocional`
      aggregatePipeline.push({
        $addFields: {
          "skus.promedio_pvp": {
            $divide: [
              { $add: ["$skus.pvp_regular", "$skus.pvp_promocional"] },
              2,
            ],
          },
        },
      });
  
      // Agrupación dinámica por mes o semana
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map((m) => parseInt(m));
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths],
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
            avg_promedio_pvp: { $avg: "$skus.promedio_pvp" },
          },
        });
      } else {
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$adjusted_fecha_creacion" },
              tienda: "$poc.nombre",
              descripcion: "$skus.descripcion",
            },
            avg_promedio_pvp: { $avg: "$skus.promedio_pvp" },
          },
        });
      }
  
      // Ordenar por semana o mes
      aggregatePipeline.push({ $sort: { "_id.week": 1, "_id.month": 1 } });
  
      // Ejecutar la consulta
      const results = await PrecioModel.aggregate(aggregatePipeline);
  
      // Estructura de los resultados
      const formattedResults: any = {};
  
      results.forEach((item) => {
        const period = item._id.week || item._id.month;
        const tienda = item._id.tienda;
        const descripcion = item._id.descripcion;
  
        if (!formattedResults[period]) {
          formattedResults[period] = {};
        }
        if (!formattedResults[period][tienda]) {
          formattedResults[period][tienda] = {};
        }
  
        formattedResults[period][tienda][descripcion] = item.avg_promedio_pvp;
      });
  
      return formattedResults;
    } catch (error) {
      throw new Error("Error interno del servidor");
    }
  }  
}
