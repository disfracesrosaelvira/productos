import Model from '../db/index';
import { PocModel } from '../models/poc.model';
import Constant from "../utils/constant";

export class SucursalService {
  sucursal = Model.collection('poc')
  estructureComercial = Model.collection('estructura_comercial');

  constructor( ) {
  }

  public async getSucursales(empresa_id: any) {
    try {
      
      console.log(empresa_id);
      
      const sucursal = await this.sucursal.find({ estado:1 }).project({ nombre: 1,poc:2 }).toArray();
      return { listSucursales: sucursal };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las sucursales:', error.message);
      } else {
        console.error('Error al obtener las sucursales:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  public async getStore4UserType(user_id: any,rol:any, pageIndex: number, pageSize: number, isPaginate: boolean = false,filter:string) {
    try {            
      let query ={nombre: { $regex: filter , $options: 'i' }, estado: 1};
      
      if(rol=='admin' || rol=="backoffice"){
        if (!isPaginate) {
          const estruccomercial= await this.sucursal.find({ }).project({ _id: 0, nombre: 1, poc: 2}).sort({nombre:1}).toArray();
          return { listSucursales: estruccomercial.map((item:any)=>{return {poc:item.poc,poc_nombre:item.nombre}}) };  
        }   
        const data: any = await PocModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true,
          sort: { nombre: 1 }})
          data.docs = data?.docs?.map((pocdata: any) => ({ poc:pocdata.poc,poc_livetrade:pocdata.poc_livetrade,poc_nombre:pocdata.nombre,nombre_planning:pocdata.nombre_planning,tipo:pocdata.tipo,poc_cadena:pocdata.poc_cadena,poc_backus:pocdata.poc_backus,documento_sv:pocdata.documento_sv,nombre_sv:pocdata.nombre_sv,cadena:pocdata.cadena,gerencia:pocdata.gerencia,region:pocdata.region}))
        return { ...data };
      }
      if(rol==Constant.ESTRUCTURA_COMERCIAL_TYPE.supervisor){          
        if (!isPaginate) {
          const estruccomercial= await this.sucursal.find({ }).project({ _id: 0, nombre: 1, poc: 2}).sort({nombre:1}).toArray();
          return { listSucursales: estruccomercial.map((item:any)=>{return {poc:item.poc,poc_nombre:item.nombre}}) };  
        }       
        const data: any = await PocModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true,
          sort: { nombre: 1 }})
          data.docs = data?.docs?.map((pocdata: any) => ({poc:pocdata.poc,poc_livetrade:pocdata.poc_livetrade,poc_nombre:pocdata.nombre,nombre_planning:pocdata.nombre_planning,tipo:pocdata.tipo,poc_cadena:pocdata.poc_cadena,poc_backus:pocdata.poc_backus,documento_sv:pocdata.documento_sv,nombre_sv:pocdata.nombre_sv,cadena:pocdata.cadena,gerencia:pocdata.gerencia,region:pocdata.region }))
        return { ...data };

      }else if(rol==Constant.ESTRUCTURA_COMERCIAL_TYPE.bdr){        
        if (!isPaginate) {
          const estruccomercial= await this.sucursal.find({ }).project({ _id: 0, nombre: 1, poc: 2}).sort({nombre:1}).toArray();
          return { listSucursales: estruccomercial.map((item:any)=>{return {poc:item.poc,poc_nombre:item.nombre}}) };
        }
        const data: any = await PocModel.paginate(query, { page: pageIndex, limit: pageSize, lean: true, leanWithId: true,
          sort: { nombre: 1 }})
          data.docs = data?.docs?.map((pocdata: any) => ({poc:pocdata.poc,poc_livetrade:pocdata.poc_livetrade,poc_nombre:pocdata.nombre,nombre_planning:pocdata.nombre_planning,tipo:pocdata.tipo,poc_cadena:pocdata.poc_cadena,poc_backus:pocdata.poc_backus,documento_sv:pocdata.documento_sv,nombre_sv:pocdata.nombre_sv,cadena:pocdata.cadena,gerencia:pocdata.gerencia,region:pocdata.region }))
        return { ...data };
      }
      
      return { listSucursales: [] };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las sucursales:', error.message);
      } else {
        console.error('Error al obtener las sucursales:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  public async findStorePoc(nombre: any) {
    try {
      
      const sucursal = await this.sucursal.findOne({ nombre:nombre });
      return { sucursal };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener las sucursales:', error.message);
      } else {
        console.error('Error al obtener las sucursales:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  public async getPocOffline() {
    try {
      // const data = await PocModel.find({}, { _id: 0 });
      const pocs = await PocModel.find({estado: 1});
      return pocs;
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }
}
