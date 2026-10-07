import { addHours, endOfDay, parseISO, subHours } from 'date-fns';
import { ADLS_SAS_TOKEN_USER } from '../config';
import Model from '../db/index';
import { IncidenciaCompetenciaModel } from '../models/incidenciaCompetencia.model';
import { IncidenciaMuebleAsignacionModel } from '../models/incidenciaMuebleAsignacion.model';
import { IncidenciaMuebleMantenimientoModel } from '../models/incidenciaMuebleMantenimiento.model';
import { IncidenciaMuebleRecojoModel } from '../models/incidenciaMuebleRecojo.model';
import { UsuarioService } from './usuario.service';
import { PocsService } from './pocs.service';
import filterDateRange from '../utils/filterDateRange';

export class IncidenciaService {
  incidencia_competencia = Model.collection('incidencia_competencia');
  incidencia_mueble_asignacion = Model.collection('incidencia_mueble_asignacion');
  incidencia_mueble_mantenimiento = Model.collection('incidencia_mueble_mantenimiento');
  incidencia_mueble_recojo = Model.collection('incidencia_mueble_recojo');
  public userService =  new UsuarioService();
  public pocService =  new PocsService();

  constructor() {}


  public async saveCompetencia(data: any) {
    try {
      if(data.offline == 1){
        const competenciaResponse = await this.incidencia_competencia.find({incidencia_competencia_id: data.incidencia_competencia_id}).toArray();
        if(competenciaResponse.length > 0){
          return { success: false, message: 'El incidencia_competencia_id ya existe en la base de datos' };
        }
      }
      data.fecha_creacion = data.offline == 1 ? new Date(data.fecha_creacion) : new Date(new Date().toUTCString());
      data.imagenes.forEach(element => {
        element.fecha_creacion = data.offline == 1 > 0 ? new Date(element.fecha_creacion) : new Date(new Date().toUTCString());
      });
      const result = await this.incidencia_competencia.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveCompetencia:', error.message);
      } else {
        console.error('Error al guardar los datos de saveCompetencia:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  public async getIncidenciaCompetencia(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string) {
    try {
      // let query = { empresa_id: empresa_id ,fecha_creacion: { $gte: startDate, $lte: endDate }};
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
  
      const data = await IncidenciaCompetenciaModel.paginate(query, options);
      data.docs = data?.docs?.map((element: any) => (
        { ...element, 
          imagenes: element.imagenes.map((image: any) => ({...image, imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`})),
          fecha_creacion: subHours(element.fecha_creacion, 5)
        }
      ));
      return { ...data };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las exhibiciones-adicional:', error.message);
      } else {
        console.error('Error al obtener las exhibiciones-adicional:', String(error));
      }
      throw new Error('Error interno del servidor');
    }
  }

  public async saveMuebleAsignacion(data: any) {
    try {
      if(data.offline == 1){
        const asignacionResponse = await this.incidencia_mueble_asignacion.find({incidencia_mueble_asignacion_id: data.incidencia_mueble_asignacion_id}).toArray();
        if(asignacionResponse.length > 0){
          return { success: false, message: 'El incidencia_mueble_asignacion_id ya existe en la base de datos' };
        }
      }
      // data.fecha_creacion = new Date(new Date().toUTCString());
      data.fecha_creacion = data.offline == 1 ? new Date(data.fecha_creacion) : new Date(new Date().toUTCString());
      const result = await this.incidencia_mueble_asignacion.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveMuebleAsignacion:', error.message);
      } else {
        console.error('Error al guardar los datos de saveMuebleAsignacion:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  // en el frontend lo usan en dos partes
  public async getIncidenciaMuebleAsignacion(empresa_id: string, poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false, filterStartDate: string, filterEndDate: string, user_id: string) {
    try {
      let query = {};

      if (poc) query['poc.poc'] = poc;

      if (!isPaginate) {
        query['empresa_id'] = empresa_id;
        const asignaciones = await this.incidencia_mueble_asignacion.find(query).sort({fecha_creacion: -1}).toArray();
        return { listAsignacion: asignaciones};
      }

      query = {}
      if (filterStartDate && filterEndDate) {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
        query['fecha_creacion'] = { $gte : adjusted_start_date , $lte:adjusted_end_date };
      }

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
  
      const data = await IncidenciaMuebleAsignacionModel.paginate(query, options);
      data.docs = data?.docs?.map((element: any) => (
        { 
          ...element,
          fecha_creacion: subHours(element.fecha_creacion, 5)
        }
      ));
      return { ...data };
    } catch (error: unknown) {
      // if (error instanceof Error) {
      //   console.error('Error al obtener las exhibiciones-adicional:', error.message);
      // } else {
      //   console.error('Error al obtener las exhibiciones-adicional:', String(error));
      // }
      throw new Error('Error interno del servidor');
    }
  }

  public async saveMuebleMantenimiento(data: any) {
    try {   
      if(data.offline == 1){
        const mantenimientoResponse = await this.incidencia_mueble_mantenimiento.find({incidencia_mueble_mantenimiento_id: data.incidencia_mueble_mantenimiento_id}).toArray();
        if(mantenimientoResponse.length > 0){
          return { success: false, message: 'El incidencia_mueble_mantenimiento_id ya existe en la base de datos' };
        }
      }
      data.fecha_creacion = data.offline == 1 ? new Date(data.fecha_creacion) : new Date(new Date().toUTCString());
      data.imagenes.forEach(element => {
        element.fecha_creacion = data.offline == 1 > 0 ? new Date(element.fecha_creacion) : new Date(new Date().toUTCString());
      });
      const result = await this.incidencia_mueble_mantenimiento.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveMuebleMantenimiento:', error.message);
      } else {
        console.error('Error al guardar los datos de saveMuebleMantenimiento:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  // en el frontend lo usan en dos partes
  public async getIncidenciaMuebleMantenimiento(empresa_id: string, poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false, filterStartDate: string, filterEndDate: string, user_id: string) {
    try {
      let query = { };

      if (poc) query['poc.poc'] = poc;

      if (!isPaginate) {
        query['empresa_id'] = empresa_id;
        const asignaciones = await this.incidencia_mueble_mantenimiento.find(query).sort({fecha_creacion: -1}).toArray();
        // const data = asignaciones.map((asignacion: any) => ({ ...asignacion, fecha_creacion: subHours(asignacion.fecha_creacion, 5), imagenes: asignacion?.imagenes?.map((image: any) => ({...image, imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`})) }));
        const data = asignaciones.map((asignacion: any) => ({ ...asignacion, imagenes: asignacion?.imagenes?.map((image: any) => ({...image, imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`})) }));
        return { data: data };
      }
      query = {}
      if (filterStartDate && filterEndDate) {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
        query['fecha_creacion'] = { $gte : adjusted_start_date , $lte:adjusted_end_date };
      }

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

      const data = await IncidenciaMuebleMantenimientoModel.paginate(query, options);
      data.docs = data?.docs?.map((element: any) => (
        { ...element, 
          fecha_creacion: subHours(element.fecha_creacion, 5),
          imagenes: element.imagenes.map((image: any) => ({...image, imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`}))
        }
      ));
      return { ...data };  
    } catch (error: unknown) {
      // if (error instanceof Error) {
      //   console.error('Error al obtener las exhibiciones-adicional:', error.message);
      // } else {
      //   console.error('Error al obtener las exhibiciones-adicional:', String(error));
      // }
      throw new Error('Error interno del servidor');
    }
  }

  public async saveMuebleRecojo(data: any) {
    try {
      if(data.offline == 1){
        const recojoResponse = await this.incidencia_mueble_recojo.find({incidencia_mueble_recojo_id: data.incidencia_mueble_recojo_id}).toArray();
        if(recojoResponse.length > 0){
          return { success: false, message: 'El incidencia_mueble_recojo_id ya existe en la base de datos' };
        }
      }
      data.fecha_creacion = data.offline == 1 ? new Date(data.fecha_creacion) : new Date(new Date().toUTCString());
      data.imagenes.forEach(element => {
        element.fecha_creacion = data.offline == 1 > 0 ? new Date(element.fecha_creacion) : new Date(new Date().toUTCString());
      });
      const result = await this.incidencia_mueble_recojo.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveMuebleRecojo:', error.message);
      } else {
        console.error('Error al guardar los datos de saveMuebleRecojo:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  // en el frontend lo usan en dos partes
  public async getIncidenciaMuebleRecojo(empresa_id: string, poc: number, pageIndex: number, pageSize: number, isPaginate: boolean = false, filterStartDate: string, filterEndDate: string, user_id: string) {
    try {
      let query = { };
      
      if (poc) query['poc.poc'] = poc;
      if (!isPaginate) {
        query['empresa_id'] = empresa_id;
        const asignaciones = await this.incidencia_mueble_recojo.find(query).sort({fecha_creacion: -1}).toArray();
        const data = asignaciones.map((asignacion: any) => ({
          ...asignacion,
          imagenes: asignacion?.imagenes?.map((image: any) => (
            {
              ...image,
              imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`
            }))
          }));
        return { data: data };
      }

      query = {}
      if (filterStartDate && filterEndDate) {
        const { adjusted_start_date, adjusted_end_date } = filterDateRange(filterStartDate, filterEndDate);
        query['fecha_creacion'] = { $gte : adjusted_start_date , $lte:adjusted_end_date };
      }
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
      const data = await IncidenciaMuebleRecojoModel.paginate(query, options);
      data.docs = data?.docs?.map((element: any) => (
        { ...element, 
          fecha_creacion: subHours(element.fecha_creacion, 5),
          imagenes: element.imagenes.map((image: any) => ({...image, imagen_url: `${image.imagen_url}?${ADLS_SAS_TOKEN_USER}`}))
        }
      ));
      return { ...data };
      
    } catch (error: unknown) {
      // if (error instanceof Error) {
      //   console.error('Error al obtener las exhibiciones-adicional:', error.message);
      // } else {
      //   console.error('Error al obtener las exhibiciones-adicional:', String(error));
      // }
      throw new Error('Error interno del servidor');
    }
  }

}