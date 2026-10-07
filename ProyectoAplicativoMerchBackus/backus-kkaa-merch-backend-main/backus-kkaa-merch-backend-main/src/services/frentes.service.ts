import { ADLS_SAS_TOKEN_USER } from '../config';
import { FrenteModel } from '../models/frente.model';
import Model from '../db/index';
import { UsuarioService } from './usuario.service';
import { PocsService } from './pocs.service';
import filterDateRange from '../utils/filterDateRange';
import { subHours } from 'date-fns';
import { ConfigService } from './config.service';

export class FrenteService {
  categorias = Model.collection('sku');
  frente = Model.collection('frente');
  public userService =  new UsuarioService();
  public pocService =  new PocsService();
  public configService =  new ConfigService();

  constructor() {}


  public async saveFrente(data: any) {
    try {
      // data.map((item: any) => {
      //   if (typeof item.created_at === 'string') {
      //     item.created_at = new Date(item.created_at);
      //   }
      // });
      if(data.offline == 1){
        const frenteResponse = await this.frente.find({frente_id: data.frente_id}).toArray();
        if(frenteResponse.length > 0){
          return { success: false, message: 'El frente_id ya existe en la base de datos' };
        }
      }
      data.imagenes.forEach(element => {
        element.fecha_creacion = data.offline == 1 ? new Date(element.fecha_creacion) : new Date(new Date().toUTCString());
      });
      data.fecha_creacion = data.offline == 1 ? new Date(data.fecha_creacion) : new Date(new Date().toUTCString());
      // data.fecha_creacion = new Date(new Date().toUTCString());
      const result = await this.frente.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de frente:', error.message);
      } else {
        console.error('Error al guardar los datos de frente:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getFrentes(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string) {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
      console.log('adjusted_start_date', adjusted_start_date);
      console.log('adjusted_end_date', adjusted_end_date);
      let query = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date }};

      if (!user_id) {
        throw new Error('El usuario_id es requerido');
      }
      const usuario: any = await this.userService.getUsuarioByUserId(user_id);
      if (usuario.rol == 'supervisor') {
        const pocs = await this.pocService.getPocByDocumentoSv(user_id);
        query['poc.poc'] = { $in: pocs };
      } else if (usuario.rol == 'bdr') {
        query['usuario.usuario_id'] = user_id;
      }
      const options = {
        page: pageIndex || 1,
        limit: pageSize || 10,
        sort: { fecha_creacion: -1 },
        lean: true,
        leanWithId: true
      };
  
      const data = await FrenteModel.paginate(query, options);
      data.docs = data?.docs?.map((frente: any) => (
        { ...frente,
          fecha_creacion: subHours(frente.fecha_creacion, 5),
          imagenes: frente.imagenes.map((image: any) => ({...image, imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`}))
        }
      ));
      return { ...data };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  // public async getFrenteCountsByBrandMonthAndWeek(filterTable: string) {
  //   try {
  //     const filters = JSON.parse(filterTable);
  //     let aggregatePipeline: any[] = [];
  
  //     // Ajustar fecha de creación restando 5 horas
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
  
  //     // Construcción del query base para los filtros generales
  //     let query: any = {};
  //     if (filters.anio) {
  //       const startOfYear = new Date(`${filters.anio[0]}-01-01T00:00:00.000Z`);
  //       const endOfYear = new Date(`${filters.anio[0] + 1}-01-01T00:00:00.000Z`);
  //       query["fecha_creacion"] = { $gte: startOfYear, $lt: endOfYear };
  //     }
  //     if (filters.supervisor && filters.supervisor.length > 0) {
  //       query["poc.documento_sv"] = { $in: filters.supervisor };
  //     }
  //     if (filters.cliente && filters.cliente.length > 0) {
  //       query["empresa_id"] = { $in: filters.cliente };
  //     }
  //     if (filters.tienda && filters.tienda.length > 0) {
  //       query["poc.nombre"] = { $in: filters.tienda };
  //     }
  //     if (filters.cadena && filters.cadena.length > 0) {
  //       query["poc.cadena"] = { $in: filters.cadena };
  //     }
  //     if (filters.gerencia && filters.gerencia.length > 0) {
  //       query["poc.gerencia"] = { $in: filters.gerencia };
  //     }
  //     if (filters.region && filters.region.length > 0) {
  //       query["poc.region"] = { $in: filters.region };
  //     }
  //     if (filters.tipo && filters.tipo.length > 0) {
  //       query["poc.tipo"] = { $in: filters.tipo };
  //     }
  
  //     // Aplicar los filtros generales al pipeline
  //     aggregatePipeline.push({ $match: query });
  
  //     // **Filtrar las líneas dentro del array `skus`**
  //     if (filters.linea && filters.linea.length > 0) {
  //       aggregatePipeline.push({
  //         $addFields: {
  //           skus: {
  //             $filter: {
  //               input: "$skus",
  //               as: "sku",
  //               cond: { $in: ["$$sku.linea", filters.linea] },
  //             },
  //           },
  //         },
  //       });
  //       console.log('filters.linea', filters.linea);
  //     }
  
  //     // Descomponer el array `skus` después de filtrar
  //     aggregatePipeline.push({
  //       $unwind: "$skus",
  //     });
  
  //     // Filtrar por meses si se especifican
  //     if (filters.meses && filters.meses.length > 0) {
  //       const filteredMonths = filters.meses.map((m) => parseInt(m));
  //       aggregatePipeline.push({
  //         $match: {
  //           $expr: {
  //             $in: [{ $month: "$fecha_creacion" }, filteredMonths],
  //           },
  //         },
  //       });
  
  //       // Agrupar por semana y marca
  //       aggregatePipeline.push({
  //         $group: {
  //           _id: {
  //             week: { $isoWeek: "$fecha_creacion" },
  //             marca: "$skus.marca",
  //           },
  //           totalCantidad: { $sum: "$skus.cantidad" },
  //         },
  //       });
  
  //       // Ordenar por semana
  //       aggregatePipeline.push({
  //         $sort: { "_id.week": 1 },
  //       });
  //     } else {
  //       // Si no hay meses, agrupar por mes y marca
  //       aggregatePipeline.push({
  //         $group: {
  //           _id: {
  //             month: { $month: "$fecha_creacion" },
  //             marca: "$skus.marca",
  //           },
  //           totalCantidad: { $sum: "$skus.cantidad" },
  //         },
  //       });
  
  //       // Ordenar por mes
  //       aggregatePipeline.push({
  //         $sort: { "_id.month": 1 },
  //       });
  //     }
  
  //     // Ejecutar el pipeline
  //     const result = await FrenteModel.aggregate(aggregatePipeline);
  
  //     // Estructurar los resultados
  //     let data: any = {};
  
  //     if (filters.meses && filters.meses.length > 0) {
  //       result.forEach((item) => {
  //         const week = item._id.week;
  //         const marca = item._id.marca;
  //         const totalCantidad = item.totalCantidad;
  
  //         if (!data[week]) {
  //           data[week] = {};
  //         }
  //         if (!data[week][marca]) {
  //           data[week][marca] = 0;
  //         }
  
  //         data[week][marca] += totalCantidad;
  //       });
  //     } else {
  //       result.forEach((item) => {
  //         const month = item._id.month;
  //         const marca = item._id.marca;
  //         const totalCantidad = item.totalCantidad;
  
  //         if (!data[month]) {
  //           data[month] = {};
  //         }
  //         if (!data[month][marca]) {
  //           data[month][marca] = 0;
  //         }
  
  //         data[month][marca] += totalCantidad;
  //       });
  //     }
  //     console.log('data', data);
  //     return data;
  //   } catch (error: unknown) {
  //     throw new Error("Error interno del servidor: " + error);
  //   }
  // }
  public async getFrenteCountsByBrandMonthAndWeek(filterTable: string) {
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
      filters.linea.push('Cervezas')
      // Filtro de línea antes de descomponer el array
      if (filters.linea && filters.linea.length > 0) {
        aggregatePipeline.push({
          $addFields: {
            // Filtra el array skus para mantener solo los elementos que coinciden con las líneas especificadas
            "skus": {
              $filter: {
                input: "$skus",
                as: "sku",
                cond: { $in: ["$$sku.linea", filters.linea] }
              }
            }
          }
        });
        
        // Filtra documentos que tengan al menos un SKU después del filtrado
        aggregatePipeline.push({
          $match: {
            "skus": { $ne: [] }
          }
        });
      }

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
  
        // Agrupar por semana y marca y sumar cantidad
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca"
            },
            totalCantidad: { $sum: "$skus.cantidad" }
          }
        });
  
        // Ordenar por semana
        aggregatePipeline.push({
          $sort: {
            "_id.week": 1
          }
        });
  
      } else {
        // Si no se especifican meses, agrupar por mes y marca y sumar cantidad
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca"
            },
            totalCantidad: { $sum: "$skus.cantidad" }
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
      const result = await FrenteModel.aggregate(aggregatePipeline);
  
      // Estructura para almacenar los resultados
      let data = {};
  
      if (filters.meses && filters.meses.length > 0) {
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const totalCantidad = item.totalCantidad;
  
          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = 0;
          }
  
          data[week][marca] += totalCantidad;
        });
      } else {
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const totalCantidad = item.totalCantidad;
  
          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = 0;
          }
  
          data[month][marca] += totalCantidad;
        });
      }
      return data;

    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getFrenteCountsByPocAndBrandMonthAndWeek(filterTable: string) {
    try {
      const query: any = {};
      const filters = JSON.parse(filterTable);
      let aggregatePipeline: any = [];
  

      if (filters.linea && filters.linea.length > 0) {
        const filteredLineas = filters.linea;
        aggregatePipeline.push({
          $match: {
            'skus': {
              $elemMatch: {
                linea: { $in: filteredLineas }
              }
            }
          }
        });
      }

      // Filtro de año y otros filtros condicionales
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
  
      // Filtro adicional para los meses si están definidos
      if (filters.meses && filters.meses.length > 0) {
        const filteredMonths = filters.meses.map(m => parseInt(m));
        aggregatePipeline.push({
          $match: {
            ...query,
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });
      } else {
        aggregatePipeline.push({ $match: query });
      }
  
      // Ajustar la fecha para obtener el último registro de cada poc por semana o mes
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
  
      // Agrupar para obtener el último registro de cada poc en cada semana o mes
      aggregatePipeline.push({
        $group: {
          _id: filters.meses && filters.meses.length > 0
            ? { week: { $isoWeek: "$adjusted_fecha_creacion" }, pocId: "$poc.poc" }
            : { month: { $month: "$adjusted_fecha_creacion" }, pocId: "$poc.poc" },
          lastRecord: { $first: "$$ROOT" }
        }
      });
  
      // Proyectar el objeto de marcas y cantidades sin necesidad de unwind
      aggregatePipeline.push({
        $project: {
          _id: 1,
          pocId: "$_id.pocId",
          period: filters.meses && filters.meses.length > 0 ? "$_id.week" : "$_id.month",
          marcas: {
            $arrayToObject: {
              $map: {
                input: "$lastRecord.skus",
                as: "sku",
                in: { k: "$$sku.marca", v: "$$sku.cantidad" }
              }
            }
          }
        }
      });
  
      // Agrupar el resultado final en la estructura deseada
      aggregatePipeline.push({
        $group: {
          _id: "$period",
          pocRecords: {
            $push: {
              pocId: "$pocId",
              marcas: "$marcas"
            }
          }
        }
      });
  
      // Ejecutar la consulta
      const result = await FrenteModel.aggregate(aggregatePipeline);
  
      // Estructurar los datos para salida
      const data: any = {};
  
      result.forEach(item => {
        const period = item._id;
        data[period] = item.pocRecords.reduce((acc, record) => {
          acc[record.pocId] = record.marcas;
          return acc;
        }, {});
      });
  
      const lineasMarcas = await this.configService.configValues('sku_linea_marca');
      let marcas: string[] = [];
      let marcasCompetencia: string[] = [];
      if (lineasMarcas.success && lineasMarcas.result) {
        const found = lineasMarcas.result.find((item: any) => item.codigo === 'sku_linea_marca');
        found?.valor.forEach((item: any) => {
          if (item.competencia === 1) {
            // console.log('item', item.marcas);
            marcasCompetencia.push(...item.marcas);
          } else {
            marcas.push(...item.marcas);
          }    
        })
      }
      
      return this.calculateAveragePercentages(data, marcas, marcasCompetencia);;
  
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  private async calculateAveragePercentages(data, marcas: string[], marcasCompetencia:string[]) {
    let result = {};
  
    for (const week in data) {
      let totalPorcentajeMarcas = 0;
      let totalPorcentajeMarcasCompetencia = 0;
      let totalPocs = 0;
  
      for (const poc in data[week]) {
        let totalMarcas = 0;
        let totalMarcasCompetencia = 0;
        let totalGeneral = 0;
  
        // Calcular los totales por tipo de marca en cada poc
        for (const marca in data[week][poc]) {
          const cantidad = data[week][poc][marca];
          totalGeneral += cantidad;
  
          if (marcas.includes(marca)) {
            totalMarcas += cantidad;
          } else if (marcasCompetencia.includes(marca)) {
            totalMarcasCompetencia += cantidad;
          }
        }
  
        // Calcular los porcentajes para el poc actual
        const porcentajeMarcas = (totalMarcas / totalGeneral) * 100;
        const porcentajeCompetencia = (totalMarcasCompetencia / totalGeneral) * 100;
  
        // Acumular los porcentajes para promediarlos al final
        totalPorcentajeMarcas += porcentajeMarcas;
        totalPorcentajeMarcasCompetencia += porcentajeCompetencia;
        totalPocs += 1;
      }
  
      // Calcular el promedio de porcentajes por semana
      result[week] = {
        promedioPorcentajeMarca: (totalPorcentajeMarcas / totalPocs).toFixed(2),
        promedioPorcentajeMarcaCompetencia: (totalPorcentajeMarcasCompetencia / totalPocs).toFixed(2)
      };
    }
  
    return result;
  }
}

