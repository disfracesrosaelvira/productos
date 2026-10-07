import { ADLS_SAS_TOKEN_USER } from '../config';
import Model from '../db/index';
import { ObjectId } from "mongodb";
import { ExhibicionCompetencia, ExhibicionCompetenciaModel } from '../models/exhibicionCompetencia.model';
import { addHours, endOfDay, formatISO, parseISO, subDays, subHours } from 'date-fns';
import { UsuarioService } from './usuario.service';
import { EstructuraComercialService } from './estructuraComercial.service';
import { PocsService } from './pocs.service';
import filterDateRange from '../utils/filterDateRange';

export class ExhibicionCompetenciaService {
  exhibicionCompetencia = Model.collection('exhibicion_competencia');
  estructuraComercialCollection = Model.collection('estructura_comercial');
  productos = Model.collection('sku');
  marcas = Model.collection('sku');
  public userService =  new UsuarioService();
  public estructuraComercial = new EstructuraComercialService();
  public pocService =  new PocsService();
  constructor() {}
  

  public async saveExhibicionCompetencia(data: any) {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Datos inválidos para guardar');
      }            
      
      // data.forEach((item: any) => {
        await Promise.all(data.map(async (item) => {
          const result_estructura = await this.estructuraComercialCollection.findOne({poc:item.poc});
            item.documento_sv = '';
            item.nombre_sv = '';    
          if (result_estructura) {
            item.documento_sv = result_estructura.documento_sv;
            item.nombre_sv = result_estructura.nombre_sv;            
          }

          if (typeof item.created_at === 'string') {
            item.created_at = new Date(item.created_at);
          }
        }));
        
      // });
  
      const result = await this.exhibicionCompetencia.insertMany(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de exhibicion-competencia:', error.message);
      } else {
        console.error('Error al guardar los datos de exhibicion-competencia:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async deleteExhibicionCompetencia(id: string) {
    try {
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          "fecha_eliminacion": new Date(),
        }
      };
      const result = await this.exhibicionCompetencia.updateOne(
        filter,
        update as any
      );  
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de exhibicion-competencia:', error.message);
      } else {
        console.error('Error al guardar los datos de exhibicion-competencia:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async updateExhibicionCompetencia(id: string, data: Partial<ExhibicionCompetencia>) {
    try {
      const currentDoc = await ExhibicionCompetenciaModel.findById(id);

      if (!currentDoc) {
        throw new Error('Documento no encontrado');
      }
      const updateData: Partial<ExhibicionCompetencia> = {};
      if (data.fecha_fin_vigencia) {
        updateData.fecha_fin_vigencia = new Date(data.fecha_fin_vigencia);
      }
      updateData.fecha_ultimo_relevo = data.fecha_ultimo_relevo;
      if (data.validaciones && data.validaciones.length > 0) {
        const newValidation = data.validaciones.map(validation => ({
          ...validation,
          fecha_inicio_vigencia: new Date(validation.fecha_inicio_vigencia),
          fecha_fin_vigencia: new Date(validation.fecha_fin_vigencia),
          fecha_creacion: data.offline == 1 ? new Date(validation.fecha_creacion) : new Date(new Date().toUTCString()),
          imagenes: validation.imagenes.map(imagen => ({
            ...imagen,
            fecha_creacion: data.offline == 1 ? new Date(imagen.fecha_creacion) : new Date(new Date().toUTCString())
          })),
          offline: data.offline,
        }));
        updateData.validaciones = currentDoc.validaciones.concat(newValidation);
      }
      const result = await ExhibicionCompetenciaModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true } // Para devolver el documento actualizado
      );
      return result;
  
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al actualizar el documento:', error.message);
      } else {
        console.error('Error al actualizar el documento:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getExhibicionesCompetencia(empresa_id: string, poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false,startOfMonth:string,endOfMonth:string,user_id:string,filterTable: string | undefined) {
    try {
      // if (poc) query['poc'] = poc;  // ya no se usa
      let query = {};
      const fechaPeru = subHours(new Date(), 5); //restamos 5 horas para obtener la hora de peru
      const fechaActual = new Date(fechaPeru.setUTCHours(0, 0, 0, 0)).toISOString();
      query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }};
      if (!isPaginate) {
        query['fecha_eliminacion'] = { $exists: false };
        const exhibiciones = await this.exhibicionCompetencia.find(query).sort({fecha_creacion: -1}).toArray();
        return { listContraprestadas: exhibiciones.map((exhibicion: any) => (
          {
            _id: exhibicion._id,
            cantidad: exhibicion.cantidad, 
            zona: exhibicion.zona,
            tipo_exhibicion:exhibicion.tipo_exhibicion,
            dia_vigencia:exhibicion.dia_vigencia,
            tipo_menu:exhibicion.tipo_menu,
            productos: exhibicion.productos,
            fecha_creacion: subHours(exhibicion?.fecha_creacion, 5),
            imagenes: exhibicion.imagenes.map((image: any) => ({...image, url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`})), marca: exhibicion.marca, fecha_inicio_vigencia: exhibicion.fecha_inicio_vigencia, fecha_fin_vigencia: exhibicion.fecha_fin_vigencia }))};
      }

      query ={};
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
      const data: any = await ExhibicionCompetenciaModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true,sort: { fecha_ultimo_relevo: -1 }})
      
      data.docs = data?.docs?.map((exhibicion: any) => (
        {...exhibicion,
          fecha_eliminacion: exhibicion.fecha_eliminacion ? subHours(exhibicion.fecha_eliminacion, 5) : null,
          fecha_creacion: subHours(exhibicion.fecha_creacion, 5),
          validaciones: exhibicion.validaciones.map((validacion: any) => ({
            ...validacion,
            fecha_creacion: subHours(validacion.fecha_creacion, 5),
            imagenes: validacion.imagenes.map(image => ({
              ...image,
              imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`,
            })),
          })),
          fecha_ultimo_relevo: exhibicion.fecha_ultimo_relevo ? subHours(exhibicion.fecha_ultimo_relevo, 5) : null,
        }
      ));
      return { ...data };

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones-competencia:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones-competencia:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async getFiltersCompetencia(startOfMonth:string,endOfMonth:string) {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(startOfMonth, endOfMonth);
      const dateRangeFilter = { fecha_creacion: { $gte: adjusted_start_date, $lte: adjusted_end_date } }
      // Obtener todos los valores únicos
      const [exhibicionPocIds, exhibicionPocNombres, exhibicionCadenas] = await Promise.all([
        ExhibicionCompetenciaModel.distinct('poc.poc', {
          ...dateRangeFilter,
          'poc.poc': { $ne: null }
        }),
        ExhibicionCompetenciaModel.distinct('poc.nombre', {
          ...dateRangeFilter,
          'poc.nombre': { $ne: null }
        }),
        ExhibicionCompetenciaModel.distinct('poc.cadena', {
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

  public async getExhibitionCompetenciaCountsByTypeMonthAndWeek(filterTable: string) {
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

        // Agrupar por semana y tipo de exhibición
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              tipo_exhibicion: "$tipo_exhibicion"
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
              tipo_exhibicion: "$tipo_exhibicion"
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
          const tipoExhibicion = item._id.tipo_exhibicion;
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
          const tipoExhibicion = item._id.tipo_exhibicion;
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

  public async getExhibitionCompetenciaCountsByBrandMonthAndWeek(filterTable: string, typesExhibitions: string) {
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
      if (typesExhibitions) { // es un array que llega desde el frontend
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
        // Si hay meses definidos, filtrar por los meses indicados
        const filteredMonths = filters.meses.map(m => parseInt(m)); // Convertir los meses en enteros
        
        // Filtrar por los meses específicos
        aggregatePipeline.push({
          $match: {
            $expr: {
              $in: [{ $month: "$fecha_creacion" }, filteredMonths]
            }
          }
        });

        // Agrupar por semana y marca si se especifican meses
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca"
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
        // Si no se especifican meses, agrupar por mes y marca
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca"
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
        // Inicializar la estructura de datos por semanas si hay meses especificados
        data = {};
        result.forEach(item => {
          const week = item._id.week;
          const marca = item._id.marca;
          const count = item.count;

          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = 0;
          }

          data[week][marca] += count;
        });
      } else {
        // Inicializar la estructura de datos por meses si no hay meses especificados
        data = {};
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const count = item.count;

          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = 0;
          }

          data[month][marca] += count;
        });
      }
      return data;

    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(filterTable: string, typesExhibitions: string, marcas: string) {
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
      if (typesExhibitions) { // es un array que llega desde el frontend
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

        // Agrupar por semana y marca
        aggregatePipeline.push({
          $group: {
            _id: {
              week: { $isoWeek: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion"
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
        // Agrupar por mes y marca
        aggregatePipeline.push({
          $group: {
            _id: {
              month: { $month: "$fecha_creacion" },
              marca: "$skus.marca",
              descripcion: "$skus.descripcion"
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
          const count = item.count;

          if (!data[week]) {
            data[week] = {};
          }
          if (!data[week][marca]) {
            data[week][marca] = {};
          }
          if (!data[week][marca][descripcion]) {
            data[week][marca][descripcion] = 0;
          }

          data[week][marca][descripcion] += count;
        });
      } else {
        // Inicializar la estructura de datos por meses
        result.forEach(item => {
          const month = item._id.month;
          const marca = item._id.marca;
          const descripcion = item._id.descripcion;
          const count = item.count;

          if (!data[month]) {
            data[month] = {};
          }
          if (!data[month][marca]) {
            data[month][marca] = {};
          }
          if (!data[month][marca][descripcion]) {
            data[month][marca][descripcion] = 0;
          }

          data[month][marca][descripcion] += count;
        });
      }

      return data;

    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibicionesCompetenciaVigente(empresa_id: string,poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false,startOfMonth:string,endOfMonth:string,user_id:string) {
    try {
      const usuario = await this.validateUser(user_id);
      if(!usuario) throw new Error('Usuario no encontrado');
      const fechaPeru = subHours(new Date(), 5); //restamos 5 horas para obtener la hora de peru
      const fechaActual = new Date(fechaPeru.setUTCHours(0, 0, 0, 0)).toISOString();
      let query ={};
      if(usuario.rol == 'admin' || usuario.rol == 'backoffice'){
        query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }, fecha_eliminacion: { $exists: false }};
      }else if(usuario.rol == 'supervisor'){
        // const estructuraComercial = await this.estructuraComercial.getEstructuraComercialByDocumentoSv(user_id);
        // const usersDocumentBDR = estructuraComercial?.map((item: any) => item.documento_bdr);
        // query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }, fecha_eliminacion: { $exists: false }, usuario_id: { $in: usersDocumentBDR } };
        query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }, fecha_eliminacion: { $exists: false } };
      }else if(usuario.rol == 'bdr'){
        // query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }, fecha_eliminacion: { $exists: false }, usuario_id: user_id };
        query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }, fecha_eliminacion: { $exists: false } };
      }
      // query = { empresa_id: empresa_id,fecha_inicio_vigencia: { $lte: fechaActual} ,fecha_fin_vigencia: { $gte: fechaActual }, fecha_eliminacion: { $exists: false }};
      if (poc) query['poc.poc'] = poc;

      const data: any = await ExhibicionCompetenciaModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true,sort: { fecha_creacion: -1 }})
      // data.docs = data?.docs?.map((exhibicion: any) => ({ ...exhibicion, fecha_creacion: subHours(exhibicion.fecha_creacion, 5), imagenes: exhibicion?.imagenes?.map((image: any) => ({...image, url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`}))}))
      data.docs = data?.docs?.map((exhibicion: any) => (
        {
          ...exhibicion,
          fecha_creacion: subHours(exhibicion.fecha_creacion, 5),
          validaciones: exhibicion.validaciones.map((validacion: any) => ({
            ...validacion,
            fecha_creacion: subHours(validacion.fecha_creacion, 5),
            imagenes: validacion.imagenes.map(image => ({
              ...image,
              imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`,
            })),
          })),
        }
      ));
      return { ...data };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones-competencia:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones-competencia:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibicionesCompetenciaRenovable(empresa_id: string,poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false,startOfMonth:string,endOfMonth:string,user_id:string) {
    try {
      const fechaPeru = new Date(subHours(new Date(), 5).setUTCHours(0, 0, 0, 0)); 
      // const fechaPeru = subHours(new Date(), 5); //restamos 5 horas para obtener la hora de peru
      // const fechaActual = new Date(fechaPeru.setUTCHours(0, 0, 0, 0)).toISOString();
      // const fechaActualMenos7Dias = new Date(subDays(new Date(), 7).setUTCHours(0, 0, 0, 0)).toISOString();
      // const fecha_inicio = new Date(new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), 1).setUTCHours(0, 0, 0, 0)).toISOString();
      const fecha_inicio = new Date(subDays(fechaPeru, 60).setUTCHours(0, 0, 0, 0)).toISOString();
      const fecha_fin = new Date(subDays(fechaPeru, 1)).toISOString();
      
      let query ={};
      // query = { empresa_id: empresa_id,fecha_fin_vigencia: { $lt: fecha_inicio, $gte: fecha_fin }, fecha_eliminacion: { $exists: false }};
      query = { empresa_id: empresa_id, fecha_fin_vigencia: {$gte: fecha_inicio, $lte: fecha_fin}, fecha_eliminacion: { $exists: false }};
      
      if (poc) query['poc.poc'] = poc;
      const data: any = await ExhibicionCompetenciaModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true,sort: { fecha_creacion: -1 }})
      data.docs = data?.docs?.map((exhibicion: any) => (
        {
          ...exhibicion,
          fecha_creacion: subHours(exhibicion.fecha_creacion, 5),
          validaciones: exhibicion.validaciones.map((validacion: any) => ({
            ...validacion,
            fecha_creacion: subHours(validacion.fecha_creacion, 5),
            imagenes: validacion.imagenes.map(image => ({
              ...image,
              imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`,
            })),
          })),
        }
      ));
      
      return { ...data };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones-competencia:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones-competencia:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async getExhibicionesCompetenciaRenovableOffline() {
    try {
      const fechaPeru = new Date(subHours(new Date(), 5).setUTCHours(0, 0, 0, 0)); //restamos 5 horas para obtener la hora de peru
      // const fecha_inicio = new Date(new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), 1).setUTCHours(0, 0, 0, 0)).toISOString();
      const fecha_inicio = new Date(subDays(fechaPeru, 60).setUTCHours(0, 0, 0, 0)).toISOString();
      const fecha_fin = new Date(subDays(fechaPeru, 1)).toISOString();
      let query ={};
      // query = { fecha_fin_vigencia: { $lt: fecha_inicio, $gte: fecha_fin }, fecha_eliminacion: { $exists: false }};
      query = { fecha_fin_vigencia: {$gte: fecha_inicio, $lte: fecha_fin}, fecha_eliminacion: { $exists: false }};
      const data: any = await ExhibicionCompetenciaModel.find(query)
      .lean()
      .sort({ fecha_creacion: -1 });

      const result = data?.map((exhibicion: any) => (
        {
          ...exhibicion,
          fecha_creacion: subHours(exhibicion.fecha_creacion, 5),
          validaciones: exhibicion.validaciones.map((validacion: any) => ({
            ...validacion,
            fecha_creacion: subHours(validacion.fecha_creacion, 5),
            imagenes: validacion.imagenes.map(image => ({
              ...image,
              imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`,
            })),
          })),
        }
      ));
      
      // return { ...data };
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones-competencia:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones-competencia:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
      // throw new Error('Error interno del servidor');
    }
  }

  public async getProductosAllByApp(empresa_id: any) {
    // const marca = ['Amstel', 'Heineken', 'Tres Cruces', 'Pum Pum']
    try {
      const marcasProductos = await this.marcas.find({ empresa_id: empresa_id, competencia: 1,estado:1 }).project({ descripcion: 1, marca: 1 }).toArray();      
      const marca = [...new Set(marcasProductos.map(producto => producto.marca))];
      const productos = await this.productos.find({ empresa_id: empresa_id, marca: { $in: marca } }).project({ descripcion: 1, empresa_id: 1, sku: 1, marca: 1,imagen:1, linea: 1 }).toArray();
      return { listProductos: productos.map((producto: any) => ({ ... producto, imagen: `${producto.imagen}?${ADLS_SAS_TOKEN_USER}`}))};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los productos:', error.message);
      } else {
        console.error('Error al obtener los productos:', String(error));
      }
      return { error: 'Error interno del servidor' };
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
