import { subHours, addHours } from 'date-fns';
import xlsx from "xlsx";
import Model from '../db/index';
import { Poc, PocModel } from '../models/poc.model';
import { UsuarioService } from './usuario.service';
import { ExhibicionAdicionalModel } from '../models/exhibicionAdicional.model';
import { ExhibicionCompetenciaModel } from '../models/exhibicionCompetencia.model';
import { ExhibicionContraprestadaModel } from '../models/exhibicionContraprestada.model';
import { FrenteModel } from '../models/frente.model';
import { IncidenciaCompetenciaModel } from '../models/incidenciaCompetencia.model';
import { IncidenciaMuebleAsignacionModel } from '../models/incidenciaMuebleAsignacion.model';
import { IncidenciaMuebleMantenimientoModel } from '../models/incidenciaMuebleMantenimiento.model';
import { IncidenciaMuebleRecojoModel } from '../models/incidenciaMuebleRecojo.model';
import { PrecioModel } from '../models/precio.model';
import { StockModel } from '../models/stock.model';
import { SkuModel } from '../models/sku.model';
import filterDateRange from '../utils/filterDateRange';

export class PocsService {
  poc = Model.collection('poc');
  public userService =  new UsuarioService();
  constructor() {}

  public async savePoc(data: Poc) {
    try {
      let filter;
      if (data.nombre_planning.trim() == '') {
        filter = [
          { poc: data.poc },
          { nombre: data.nombre }
        ]
      } else {
        filter = [
          { poc: data.poc },
          { nombre: data.nombre },
          { nombre_planning: data.nombre_planning }
        ]
      }
      const existingPOC = await this.poc.findOne({
        $or: filter
      });
      if (existingPOC) {
        return { success: false, error: 'El POC, POC Nombre o Nombre Planning ya existe en la base de datos' };
      }
      data.fecha_creacion = new Date(new Date().toUTCString());
      delete data['_id'];
      delete data['fecha_actualizacion'];
      delete data['usuario_id_actualizacion'];
      const pocConIDMayor = await this.poc.findOne({}, { sort: { poc: -1 } });
      data.poc = pocConIDMayor?.poc + 1;
      const result = await this.poc.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de savePoc:', error.message);
      } else {
        console.error('Error al guardar los datos de savePoc:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  public async getPocs(pageIndex: number, pageSize: number, user_id: string, filterTable: string | undefined) {
    try {

      if (!user_id) {
        throw new Error('El usuario_id es requerido');
      }
      const usuario: any = await this.userService.getUsuarioByUserId(user_id);

      let query = {}
      // if (usuario.rol == 'supervisor') {
      //   query['documento_sv'] = user_id;
      // }
      if (usuario.rol == 'bdr') {
        query['usuario_id_creacion'] = user_id;
      }

      if (filterTable) {
        const filters = JSON.parse(filterTable);
        filters.forEach((filter: { key: string, values: string[] }) => {
          query[filter.key] = { $in: filter.values };
        });
      }

      // if (filterTable) {
      //   const filters = JSON.parse(filterTable);
      //   filters.forEach((filter: { key: string, values: string[] }) => {
      //     const orConditions: any = [];
  
      //     if (filter.values.some(value => value !== "")) {
      //       orConditions.push({ [filter.key]: { $in: filter.values.filter(value => value !== "") } });
      //     }
      //     if (filter.values.includes("")) {
      //       orConditions.push({ [filter.key]: "" });
      //       orConditions.push({ [filter.key]: null });
      //       orConditions.push({ [filter.key]: { $exists: false } });
      //     }
  
      //     if (orConditions.length > 0) {
      //       query['$or'] = orConditions;
      //     }
      //   });
      // }

    //   if (filterTable) {
    //   const filters = JSON.parse(filterTable);
    //   filters.forEach((filter: { key: string, values: string[] }) => {
    //     const nonEmptyValues = filter.values.filter(value => value.trim() !== "");
    //     const emptyConditions: any = [];

    //     // Si hay valores no vacíos, agrega la condición $in
    //     if (nonEmptyValues.length > 0) {
    //       query[filter.key] = { $in: nonEmptyValues };
    //     }

    //     // Si hay valores vacíos, nulos, o faltantes, agrega condiciones al $or
    //     if (filter.values.some(value => value.trim() === "")) {
    //       emptyConditions.push({ [filter.key]: "" });
    //       // emptyConditions.push({ [filter.key]: " " });
    //       // emptyConditions.push({ [filter.key]: "-" });
    //       // emptyConditions.push({ [filter.key]: "0" });
    //       emptyConditions.push({ [filter.key]: null });
    //       emptyConditions.push({ [filter.key]: { $exists: false } });
    //     }

    //     // Si tenemos condiciones vacías, combinarlas con las no vacías usando $or
    //     if (emptyConditions.length > 0) {
    //       if (query[filter.key]) {
    //         query['$and'] = [
    //           { [filter.key]: query[filter.key] },
    //           { $or: emptyConditions }
    //         ];
    //       } else {
    //         query['$or'] = emptyConditions;
    //       }
    //     }
    //   });
    // }

      const options = {
        page: pageIndex || 1,
        limit: pageSize || 10,
        // sort: { fecha_creacion: -1 },
        sort: { fecha_creacion: -1, _id: -1 },
        lean: true, // Obtener documentos como JSON puro
        leanWithId: false // Asegurarse de que `leanWithId` no añada `_id` a `id`  
      };
  
      const data = await PocModel.paginate(query, options);
      data.docs = data?.docs?.map((poc: any) => (
        { 
          ...poc,
          fecha_creacion: subHours(poc.fecha_creacion, 5),
          fecha_actualizacion: poc.fecha_actualizacion ? subHours(poc.fecha_actualizacion, 5) : null,
        }
      ));

      return { ...data };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getPocsRelevos(pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string, searchName?: string) {
    try {
      const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
      // Construir la consulta base
      const query: any = { estado: 1 };

      // Agregar filtro de búsqueda por nombre si se proporciona
      if (searchName) {
        query.nombre = { $regex: new RegExp(searchName, 'i') }; // Búsqueda insensible a mayúsculas y minúsculas
      }
      const options = {
        page: pageIndex || 1,
        limit: pageSize || 10,
        sort: { fecha_creacion: -1 },
        lean: true, // Obtener documentos como JSON puro
        select: 'poc nombre',
        leanWithId: false // Asegurarse de que `leanWithId` no añada `_id` a `id`  
      };
  
      const data = await PocModel.paginate(query, options);

      const enrichedDocs = await Promise.all(
        data.docs.map(async (poc: any) => {
          const exhibicionAdicional = await ExhibicionAdicionalModel.findOne({
            'poc.poc': poc.poc,
            fecha_ultimo_relevo: { $gte: adjusted_start_date, $lte: adjusted_end_date },
          });
          const exhibicionCompetencia = await ExhibicionCompetenciaModel.findOne({
            'poc.poc': poc.poc,
            fecha_ultimo_relevo: { $gte: adjusted_start_date, $lte: adjusted_end_date },
          });
          const frente = await FrenteModel.findOne({
            'poc.poc': poc.poc,
            fecha_creacion:{ $gte: adjusted_start_date, $lte: adjusted_end_date },
          });
          const precio = await PrecioModel.findOne({
            'poc.poc': poc.poc,
            fecha_creacion:{ $gte: adjusted_start_date, $lte: adjusted_end_date },
          });
          const stock = await StockModel.findOne({
            'poc.poc': poc.poc,
            fecha_creacion:{ $gte: adjusted_start_date, $lte: adjusted_end_date },
          });

          return {
            poc: poc.poc,
            nombre: poc.nombre,
            is_relevos_exhibicion_adicional: !!exhibicionAdicional,
            is_relevos_exhibicion_competencia: !!exhibicionCompetencia,
            is_relevos_frente: !!frente,
            is_relevos_precio: !!precio,
            is_relevos_stock: !!stock
          };
        })
      );

      return { ...data, docs: enrichedDocs };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getPocsFilters() {
    try {
      const poc = await PocModel.distinct('poc');
      const nombre = await PocModel.distinct('nombre');
      const poc_cadena = await PocModel.distinct('poc_cadena');
      const poc_backus = await PocModel.distinct('poc_backus');
      const nombre_planning = await PocModel.distinct('nombre_planning');
      const tipo = await PocModel.distinct('tipo');
      const documento_sv = await PocModel.distinct('documento_sv');
      const nombre_sv = await PocModel.distinct('nombre_sv');
      const usuario_id_creacion = await PocModel.distinct('usuario_id_creacion');
      const usuario_id_actualizacion = await PocModel.distinct('usuario_id_actualizacion');

      return { 
        poc,
        nombre,
        poc_cadena,
        poc_backus,
        nombre_planning,
        tipo,
        documento_sv,
        nombre_sv,
        usuario_id_creacion,
        usuario_id_actualizacion,
       };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getFiltersDashboard(filters: { [key: string]: any }) {
    try {
      const query: any = {};

      // Agregar filtros dinámicos con arrays
      if (filters.nombre && Array.isArray(filters.nombre) && filters.nombre.length != 0) {
        query.nombre = { $in: filters.nombre }; // Filtra por un array de nombres
      }

      if (filters.cadena && Array.isArray(filters.cadena) && filters.cadena.length != 0) {
        query.cadena = { $in: filters.cadena }; // Filtra por un array de cadenas
      }

      if (filters.region && Array.isArray(filters.region) && filters.region.length != 0) {
        query.region = { $in: filters.region }; // Filtra por un array de regiones
      }

      if (filters.gerencia && Array.isArray(filters.gerencia) && filters.gerencia.length != 0) {
        query.gerencia = { $in: filters.gerencia }; // Filtra por un array de gerencias
      }

      if (filters.documento_sv && Array.isArray(filters.documento_sv) && filters.documento_sv.length != 0) {
        query.documento_sv = { $in: filters.documento_sv }; // Filtra por un array de documentos_sv
      }
      if (filters.tipo && Array.isArray(filters.tipo) && filters.tipo.length != 0) {
        query.tipo = { $in: filters.tipo }; // Filtra por un array de tipo
      }

      const queryLineas: any = {};
      if (filters.cliente && Array.isArray(filters.cliente) && filters.cliente.length != 0) {
        queryLineas.empresa_id = { $in: filters.cliente };
      }

      // Resto de las consultas con los filtros aplicados
      const tiendas = await PocModel.distinct('nombre', query);
      const documento_sv_and_nombre_sv = await PocModel.aggregate([
        // { $match: query },
        // { $match: { ...query, documento_sv: { $exists: true, $ne: null, $ne: '' } } },
        { $match: { ...query, documento_sv: { $exists: true } } },
        { $group: { _id: "$documento_sv", nombre_sv: { $first: "$nombre_sv" } } },
        { $project: { _id: 0, documento_sv: "$_id", nombre_sv: 1 } }
      ]);
      const cadenas = await PocModel.distinct('cadena', query);
      const gerencias = await PocModel.distinct('gerencia', query);
      const regiones = await PocModel.distinct('region', query);
      const tipos = await PocModel.distinct('tipo', query);
      const lineas = await SkuModel.distinct('linea', queryLineas);

      return { 
        tiendas,
        documento_sv_and_nombre_sv,
        cadenas,
        gerencias,
        regiones,
        tipos,
        lineas,
       };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getCheckName(nombre: string, id: string) {
    // const existingPoc = await PocModel.findOne({ nombre: nombre });
    if(nombre == '') return false;
    const query: any = {
      nombre: new RegExp('^' + nombre + '$', 'i')
    };
  
    if (id) {
      query._id = { $ne: id };
    }
    const existingPoc = await PocModel.findOne(query); // buscar coincidencias sin importar mayúsculas o minúsculas
    return existingPoc;
  }

  public async getCheckPocCadena(poc_cadena: string, id: string) {
    if(poc_cadena == '') return false;
    const query: any = {
      poc_cadena: new RegExp('^' + poc_cadena + '$', 'i')
    };
  
    if (id) {
      query._id = { $ne: id };
    }
    const existingPoc = await PocModel.findOne(query); // buscar coincidencias sin importar mayúsculas o minúsculas
    return existingPoc;
  }

  public async getCheckPocBackus(poc_backus: string, id: string) {
    if(poc_backus == '') return false;
    const query: any = {
      poc_backus: new RegExp('^' + poc_backus + '$', 'i')
    };
  
    if (id) {
      query._id = { $ne: id };
    }
    const existingPoc = await PocModel.findOne(query); // buscar coincidencias sin importar mayúsculas o minúsculas
    return existingPoc;
  }

  public async getCheckNamePlanning(nombre_planning: string, id: string) {
    if(nombre_planning == '') return false;
    const query: any = {
      nombre_planning: new RegExp('^' + nombre_planning + '$', 'i')
    };
  
    if (id) {
      query._id = { $ne: id };
    }
  
    const existingPoc = await PocModel.findOne(query);
    // const existingPoc = await PocModel.findOne({ nombre_planning: new RegExp('^' + nombre_planning + '$', 'i') }); // buscar coincidencias sin importar mayúsculas o minúsculas
    return existingPoc;
  }

  public async getSupervisors() {
    try {
      // return await PocModel
      //   .findOne({ documento_sv }) // Filtras por documento_sv
      //   .select('documento_sv nombre_sv') // Seleccionas solo los campos deseados
      //   .exec();
      const supervisores=  await PocModel.aggregate([
        {
          $group: {
            _id: '$nombre_sv', // Agrupas por el campo `nombre_sv`
            documento_sv: { $first: '$documento_sv' }, // Obtienes el primer `documento_sv` asociado
          },
        },
        {
          $project: {
            _id: 0, // Excluyes el campo `_id` del resultado
            nombre_sv: '$_id', // Incluyes `nombre_sv` como un campo normal
            documento_sv: 1, // Incluyes `documento_sv`
          },
        },
      ]);
      return supervisores.filter((supervisor: any) => supervisor.documento_sv != null && supervisor.nombre_sv != null);
    } catch (error) {
      console.error('Error al obtener supervisores únicos:', error);
      return [];
    }
  }

  public async getPocById(id: string): Promise<Poc | null> {
    try {   
      const result = await PocModel.findById(id).exec();
      return result;
    } catch (error) {
      console.error('Error al obtener la sku por ID:', error);
      return null;
    }
  }

  public async updatePoc(id: string, data: Poc) {
    try {
      let existingPOC;
      if(data.nombre_planning.trim() != '') {
        existingPOC = await PocModel.findOne({
          _id: { $ne: id }, // Excluir el documento que se está actualizando
          nombre_planning: data.nombre_planning
        });
      }
      if (existingPOC) {
        return { success: false, error: 'El nombre_planning ya existe en la base de datos' };
      }
      const result = await PocModel.findByIdAndUpdate(
        id,
        {
          ...data,
          fecha_actualizacion: new Date(new Date().toUTCString()),
        },
        { new: true } // Para devolver el documento actualizado
      );

      if (!result) {
        // throw new Error('Poc no encontrada');
        return { success: false, error: 'Poc no encontrada' };
      }
      if (result) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 60);
        
        await this.actualizarColeccionesRelacionadas(result.poc, data, fechaLimite);
      }
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al actualizar el poc:', error.message);
      } else {
        console.error('Error al actualizar el poc:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async updateSupervisor(nombre_sv: string, data: any) {
    try {
      const result = await PocModel.updateMany(
        { nombre_sv },
        {
          $set: { 
            documento_sv: data.documento_sv, 
            nombre_sv: data.nombre_sv 
          }
        }
      );
      await this.updateSupervisorInTheCollection(nombre_sv, data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al actualizar supervisor:', error.message);
      } else {
        console.error('Error al actualizar el supervisor:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  //buscar los document_sv por el id de la estructura comercial
  public async getPocByDocumentoSv(documento_sv: string) {
    try {
      const result = await this.poc.find({ documento_sv: documento_sv }).project({"poc": 1}).toArray();
      const pocs = result.map((doc: any) => doc.poc);
      return pocs;
    } catch (error) {
      console.error('Error al obtener los documentos de SV', error);
      return null;
    }
  }

  public async getPocsNoPaginate() {
    try {
      const query = { estado: 1 };
      const data = await PocModel.find(query);
      return data;
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  async uploadExcelPocsMassiveLoad( file: any, user): Promise<any[]> {
    try {
      const usuario = JSON.parse(user);
      if(!usuario) throw new Error('Usuario no encontrado');
      const fileBuffer = file.buffer;
      // Parsear y filtrar datos del Excel
      const parsedData = await this.parseExcelUploadExcelPocsMassiveLoad(fileBuffer, usuario);

      // Validar existencia de registros duplicados
      const existingRecords: any = [];
      for (const data of parsedData) {
        const filter = data.nombre_planning?.trim()
          ? [{ nombre: data.nombre }, { nombre_planning: data.nombre_planning }]
          : [{ nombre: data.nombre }];

        const existingPOC = await this.poc.findOne({ $or: filter });
        if (existingPOC) {
          existingRecords.push(data);
        }
      }
      if (existingRecords.length > 0) {
        return {
          success: false,
          message: 'Existen registros duplicados. No se realizó la carga.',
          duplicatedRecords: existingRecords, // Devuelve los registros duplicados
        } as any;
      }

      // Obtener el valor más alto de `poc` en la colección
      const pocConIDMayor = await this.poc.findOne({}, { sort: { poc: -1 } });
      let nextPoc = pocConIDMayor?.poc ? pocConIDMayor.poc + 1 : 1; // Si no hay datos, inicia desde 1

      // Asignar valores únicos de `poc` y preparar datos para inserción
      const bulkOperations = parsedData.map((data) => {
        data.poc = nextPoc++;
        return {
          insertOne: { document: data },
        };
      });

      // Ejecutar operaciones masivas
      const result = await this.poc.bulkWrite(bulkOperations);

      return { success: true, message: 'Carga masiva completada con éxito.', data: result } as any;
    } catch (error) {
      console.error('Error en uploadExcelPocsMassiveLoad:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }

  async parseExcelUploadExcelPocsMassiveLoad(
    buffer: Buffer,
    usuario
  ): Promise<any[]> {
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null,
    });
    // Define las columnas que quieres mantener
    const columnsToKeep: string[] = ['nombre', 'poc_cadena', 'poc_backus', 'nombre_planning', 'tipo', 'documento_sv', 'nombre_sv', 'estado', 'poc_livetrade', 'cadena', 'gerencia', 'region'];

    // console.log('jsonData', jsonData);
    const filteredData = jsonData.map((row: any) => {
      let filteredRow = {};
      for (let key in row) {
        let trimmedKey = key.trim(); // remove leading and trailing whitespace
        if (columnsToKeep.includes(trimmedKey)) {
          if (row[key] === undefined || row[key] === "#N/A" || row[key] === null) {
            filteredRow[key] = '';
          } else {
            filteredRow[key] = row[key];
          }
        }
      }

      filteredRow["fecha_creacion"] = new Date(new Date().toUTCString());
      filteredRow["usuario_id_creacion"] = usuario.usuario_id;
      return filteredRow;
    });

    return filteredData;
  }

  async varifyExcelPocsMassiveLoad( file: any): Promise<any[]> {
    try {
      const fileBuffer = file.buffer;
      // Parsear y filtrar datos del Excel
      const parsedData = await this.parseExcelVarifyExcelPocsMassiveLoad(fileBuffer);

      const errores: any = {
        campos_vacios: {
          nombre: false,
          documento_sv: false,
          nombre_sv: false,
        },
        campos_is_not_cadenas: {
          nombre: false,
          documento_sv: false,
          nombre_sv: false,
          poc_backus: false,
          poc_livetrade: false,
          poc_cadena: false,
        },
        duplicados: false,
        duplicados_bd: {
          nombre: [],
          poc_cadena: [],
          poc_backus: [],
          nombre_planning: [],
        },
        tipo: [],
        estado: false,
        duplicados_excel: {
          nombre_excel: [],
          poc_cadena_excel: [],
          poc_backus_excel: [],
          nombre_planning_excel: [],
        }
      };

      // Validar campos obligatorios y si son de tipo string si que tienen contenido
      parsedData.forEach((row, index) => {
        const nombre = typeof row.nombre === 'string' ? row.nombre.trim() : '';
        const documento_sv = typeof row.documento_sv === 'string' ? row.documento_sv.trim() : '';
        const nombre_sv = typeof row.nombre_sv === 'string' ? row.nombre_sv.trim() : '';
        if (nombre === '') {
          errores.campos_vacios.nombre = true;
        }
        if (documento_sv === '') {
          errores.campos_vacios.documento_sv = true;
        }
        if (nombre_sv === '') {
          errores.campos_vacios.nombre_sv = true;
        }
        if (row.nombre && (typeof row.nombre != 'string')) {
          errores.campos_is_not_cadenas.nombre = true;
        }
        if (row.documento_sv && (typeof row.documento_sv != 'string')) {
          errores.campos_is_not_cadenas.documento_sv = true;
        }
        if (row.nombre_sv && (typeof row.nombre_sv != 'string')) {
          errores.campos_is_not_cadenas.nombre_sv = true;
        }
        if (row.poc_backus && (typeof row.poc_backus != 'string')) {
          errores.campos_is_not_cadenas.poc_backus = true;
        }
        if (row.poc_livetrade && (typeof row.poc_livetrade != 'string')) {
          errores.campos_is_not_cadenas.poc_livetrade = true;
        }
        if (row.poc_cadena && (typeof row.poc_cadena != 'string')) {
          errores.campos_is_not_cadenas.poc_cadena = true;
        }
      });

      // Validar duplicados en el Excel
      const seenRows = new Set();
      const duplicatedRows = parsedData.filter((row) => {
        const rowKey = `${row.nombre}|${row.poc_cadena}|${row.poc_backus}|${row.nombre_planning}|${row.tipo}|${row.documento_sv}|${row.nombre_sv}|${row.estado}|${row.poc_livetrade}|${row.cadena}|${row.gerencia}|${row.region}`;
        if (seenRows.has(rowKey)) {
          return true;
        }
        seenRows.add(rowKey);
        return false;
      });
      if (duplicatedRows.length > 0) {
        errores.duplicados = true;
      }

      // Validar duplicados dentro del Excel
      const seenNames = new Set();
      const seenPocCadenas = new Set();
      const seenPocBackus = new Set();
      const seenNombresPlanning = new Set();

      parsedData.forEach((row) => {
        if (row.nombre && seenNames.has(row.nombre)) {
          errores.duplicados_excel.nombre_excel.push(row.nombre);
        }
        seenNames.add(row.nombre);

        if (row.poc_cadena && seenPocCadenas.has(row.poc_cadena)) {
          errores.duplicados_excel.poc_cadena_excel.push(row.poc_cadena);
        }
        seenPocCadenas.add(row.poc_cadena);

        if (row.poc_backus && row.cadena !== 'COESTI' && row.cadena !== 'MASS') {
          if (seenPocBackus.has(row.poc_backus)) {
            errores.duplicados_excel.poc_backus_excel.push(row.poc_backus);
          }
          seenPocBackus.add(row.poc_backus);
        }

        if (row.nombre_planning && seenNombresPlanning.has(row.nombre_planning)) {
          errores.duplicados_excel.nombre_planning_excel.push(row.nombre_planning);
        }
        seenNombresPlanning.add(row.nombre_planning);
      });

      // Eliminar duplicados en los arrays de duplicados internos
      errores.duplicados_excel.nombre_excel = [...new Set(errores.duplicados_excel.nombre_excel)];
      errores.duplicados_excel.poc_cadena_excel = [...new Set(errores.duplicados_excel.poc_cadena_excel)];
      errores.duplicados_excel.poc_backus_excel = [...new Set(errores.duplicados_excel.poc_backus_excel)];
      errores.duplicados_excel.nombre_planning_excel = [...new Set(errores.duplicados_excel.nombre_planning_excel)];

      // Validar existencia de registros duplicados en la base de datos
      const nombres = parsedData.filter((data) => data.nombre !== '').map((data) => data.nombre);
      const pocCadenas = parsedData.filter((data) => data.poc_cadena !== '').map((data) => data.poc_cadena);
      const pocBackus = parsedData.filter((data) => data.poc_backus !== '').map((data) => data.poc_backus);
      const nombresPlanning = parsedData.filter((data) => data.nombre_planning !== '').map((data) => data.nombre_planning);

      const existingRecords = await this.poc
        .find({
          $or: [
            { nombre: { $in: nombres } },
            { poc_cadena: { $in: pocCadenas } },
            { poc_backus: { $in: pocBackus } },
            { nombre_planning: { $in: nombresPlanning } }
          ],
        })
        .toArray(); // Convierte el cursor a un array

      // Identificar duplicados por cada campo
      existingRecords.forEach((record) => {
        if (record.nombre && nombres.includes(record.nombre)) {
          errores.duplicados_bd.nombre.push(record.nombre);
        }
        if (record.poc_cadena && pocCadenas.includes(record.poc_cadena)) {
          errores.duplicados_bd.poc_cadena.push(record.poc_cadena);
        }
        // Validar duplicidad de poc_backus solo si cadena no es 'COESTI' o 'MASS'
        const cadenaCorrespondiente = parsedData.find((row) => row.poc_backus === record.poc_backus)?.cadena || '';
        if (record.poc_backus && pocBackus.includes(record.poc_backus) && cadenaCorrespondiente !== 'COESTI' && cadenaCorrespondiente !== 'MASS') {
          errores.duplicados_bd.poc_backus.push(record.poc_backus);
        }
        if (record.nombre_planning && nombresPlanning.includes(record.nombre_planning)) {
          errores.duplicados_bd.nombre_planning.push(record.nombre_planning);
        }
      });

      // Eliminar duplicados en los arrays de errores
      errores.duplicados_bd.nombre = [...new Set(errores.duplicados_bd.nombre)];
      errores.duplicados_bd.poc_cadena = [...new Set(errores.duplicados_bd.poc_cadena)];
      errores.duplicados_bd.poc_backus = [...new Set(errores.duplicados_bd.poc_backus)];
      errores.duplicados_bd.nombre_planning = [...new Set(errores.duplicados_bd.nombre_planning)];

      // Validar valores en la columna `tipo`
      const validTypes = ['SMK', 'TC', 'CADENA LOCAL', 'C&C'];
      const invalidTypes = parsedData
        .map((row) => row.tipo)
        .filter((tipo) => tipo && !validTypes.includes(tipo));
      if (invalidTypes.length > 0) {
        errores.tipo = invalidTypes;
      }

      // Validar valores en la columna `estado`
      const invalidEstado = parsedData.filter(
        (row) => isNaN(row.estado) || row.estado < 0 || row.estado > 1
      );
      if (invalidEstado.length > 0) {
        errores.estado = true;
      }

      return errores;
    } catch (error) {
      console.error('Error en uploadExcelPocsMassiveLoad:', error);
      throw new Error('Error al procesar el archivo.');
    }
  }

  async parseExcelVarifyExcelPocsMassiveLoad(buffer: Buffer): Promise<any[]> {
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null,
    });
    // Define las columnas que quieres mantener
    const columnsToKeep: string[] = ['nombre', 'poc_cadena', 'poc_backus', 'nombre_planning', 'tipo', 'documento_sv', 'nombre_sv', 'estado', 'poc_livetrade', 'cadena', 'gerencia', 'region'];

    // console.log('jsonData', jsonData);
    const filteredData = jsonData.map((row: any) => {
      let filteredRow = {};
      for (let key in row) {
        let trimmedKey = key.trim(); // remove leading and trailing whitespace
        if (columnsToKeep.includes(trimmedKey)) {
          if (row[key] === undefined || row[key] === "#N/A" || row[key] === null) {
            filteredRow[key] = '';
          } else {
            filteredRow[key] = row[key];
          }
        }
      }
      return filteredRow;
    });

    return filteredData;
  }

  private async actualizarColeccionesRelacionadas(pocId: number, datosActualizados: Partial<Poc>, fechaLimite: Date) {
    const colecciones = [
      ExhibicionAdicionalModel,
      ExhibicionCompetenciaModel,
      ExhibicionContraprestadaModel,
      FrenteModel,
      IncidenciaCompetenciaModel,
      IncidenciaMuebleAsignacionModel,
      IncidenciaMuebleMantenimientoModel,
      IncidenciaMuebleRecojoModel,
      PrecioModel,
      StockModel
    ];
  
    const operacionesActualizacion = colecciones.map(modelo => 
      modelo.updateMany(
        {
          'poc.poc': pocId,
          fecha_creacion: { $gte: fechaLimite }
        },
        {
          $set: {
            'poc.nombre': datosActualizados.nombre || null,
            'poc.nombre_planning': datosActualizados.nombre_planning || null,
            'poc.tipo': datosActualizados.tipo || null,
            'poc.poc_backus': datosActualizados.poc_backus || null,
            'poc.poc_cadena': datosActualizados.poc_cadena || null,
            'poc.documento_sv': datosActualizados.documento_sv || null,
            'poc.nombre_sv': datosActualizados.nombre_sv || null,
            'poc.poc_livetrade': datosActualizados.poc_livetrade || null,
            'poc.cadena': datosActualizados.cadena || null,
            'poc.gerencia': datosActualizados.gerencia || null,
            'poc.region': datosActualizados.region || null
          }
        }
      )
    );
  
    return Promise.all(operacionesActualizacion);
  }

  updateSupervisorInTheCollection(nombre_sv, data) {
    const fecha_inicio = addHours((new Date(data.fecha_inicio)), 5);
    const colecciones = [
      ExhibicionAdicionalModel,
      ExhibicionCompetenciaModel,
      ExhibicionContraprestadaModel,
      FrenteModel,
      IncidenciaCompetenciaModel,
      IncidenciaMuebleAsignacionModel,
      IncidenciaMuebleMantenimientoModel,
      IncidenciaMuebleRecojoModel,
      PrecioModel,
      StockModel
    ];
    const operacionesActualizacion = colecciones.map(modelo => 
      modelo.updateMany(
        {
          'poc.nombre_sv': nombre_sv,
          fecha_creacion: { $gte: fecha_inicio }
        },
        {
          $set: {
            'poc.documento_sv': data.documento_sv,
            'poc.nombre_sv': data.nombre_sv,
          }
        }
      )
    );
  
    return Promise.all(operacionesActualizacion);
  }
}